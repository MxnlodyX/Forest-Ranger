import os
import uuid
from datetime import date, datetime

from flask import Blueprint, current_app, jsonify, request, url_for
from werkzeug.utils import secure_filename

from ..models import get_db_connection

report_bp = Blueprint('report_management', __name__)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


def _is_allowed_image(filename: str) -> bool:
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


def _serialize_value(val):
	if isinstance(val, (datetime, date)):
		return val.isoformat()
	return val


def _serialize_row(row: dict | None) -> dict | None:
	if not row:
		return None

	result = {key: _serialize_value(value) for key, value in row.items()}
	result['image_urls'] = []
	return result


def _attach_images(cursor, reports: list[dict]) -> list[dict]:
	if not reports:
		return reports

	report_ids = [r['incident_id'] for r in reports]
	placeholders = ', '.join(['%s'] * len(report_ids))
	cursor.execute(
		f"""
		SELECT incident_id, image_url
		FROM incident_image
		WHERE incident_id IN ({placeholders})
		ORDER BY image_id ASC
		""",
		report_ids,
	)
	image_rows = cursor.fetchall()

	by_report_id: dict[int, list[str]] = {}
	for row in image_rows:
		by_report_id.setdefault(row['incident_id'], []).append(row['image_url'])

	for report in reports:
		report['image_urls'] = by_report_id.get(report['incident_id'], [])

	return reports


def _fetch_report(cursor, incident_id: int) -> dict | None:
	cursor.execute(
		"""
		SELECT
			ir.incident_id,
			ir.incident_title,
			ir.description,
			ir.incident_type,
			ir.location_id,
			l.location_name,
			ir.reported_by,
			s.full_name AS reporter_name,
			ir.created_at,
			ir.updated_at
		FROM incident_report ir
		LEFT JOIN location l ON ir.location_id = l.location_id
		LEFT JOIN staff s ON ir.reported_by = s.staff_id
		WHERE ir.incident_id = %s
		LIMIT 1
		""",
		(incident_id,),
	)
	report = _serialize_row(cursor.fetchone())
	if not report:
		return None

	_attach_images(cursor, [report])
	return report


@report_bp.route('/api/reports', methods=['GET'])
def get_reports():
	reported_by = request.args.get('reported_by', type=int)

	try:
		conn = get_db_connection()
		with conn.cursor() as cursor:
			query = """
				SELECT
					ir.incident_id,
					ir.incident_title,
					ir.description,
					ir.incident_type,
					ir.location_id,
					l.location_name,
					ir.reported_by,
					s.full_name AS reporter_name,
					ir.created_at,
					ir.updated_at
				FROM incident_report ir
				LEFT JOIN location l ON ir.location_id = l.location_id
				LEFT JOIN staff s ON ir.reported_by = s.staff_id
			"""
			params = []
			if reported_by is not None:
				query += " WHERE ir.reported_by = %s"
				params.append(reported_by)

			query += " ORDER BY ir.incident_id DESC"
			cursor.execute(query, params)
			rows = cursor.fetchall()

			reports = [_serialize_row(row) for row in rows]
			_attach_images(cursor, reports)

		conn.close()
		return jsonify(reports)
	except Exception as exc:
		return jsonify({'error': str(exc)}), 500


@report_bp.route('/api/reports/<int:incident_id>', methods=['GET'])
def get_report_by_id(incident_id: int):
	try:
		conn = get_db_connection()
		with conn.cursor() as cursor:
			report = _fetch_report(cursor, incident_id)
		conn.close()

		if not report:
			return jsonify({'error': 'Report not found'}), 404
		return jsonify(report)
	except Exception as exc:
		return jsonify({'error': str(exc)}), 500


@report_bp.route('/api/reports', methods=['POST'])
def create_report():
	payload = request.get_json(silent=True) or {}
	incident_title = (payload.get('incident_title') or '').strip()
	incident_type = (payload.get('incident_type') or '').strip()

	if not incident_title:
		return jsonify({'error': 'incident_title is required'}), 400
	if not incident_type:
		return jsonify({'error': 'incident_type is required'}), 400

	description = (payload.get('description') or '').strip() or None
	location_id = payload.get('location_id') or None
	reported_by = payload.get('reported_by') or None
	image_urls = payload.get('image_urls') or []

	if not isinstance(image_urls, list):
		return jsonify({'error': 'image_urls must be an array'}), 400
	if any(not isinstance(url, str) or not url.strip() for url in image_urls):
		return jsonify({'error': 'image_urls must contain only non-empty strings'}), 400

	try:
		conn = get_db_connection()
		with conn.cursor() as cursor:
			cursor.execute(
				"""
				INSERT INTO incident_report
					(incident_title, description, incident_type, location_id, reported_by)
				VALUES (%s, %s, %s, %s, %s)
				""",
				(incident_title, description, incident_type, location_id, reported_by),
			)
			incident_id = cursor.lastrowid

			for image_url in image_urls:
				cursor.execute(
					"""
					INSERT INTO incident_image (incident_id, image_url)
					VALUES (%s, %s)
					""",
					(incident_id, image_url.strip()),
				)

			report = _fetch_report(cursor, incident_id)
			conn.commit()
		conn.close()
		return jsonify(report), 201
	except Exception as exc:
		return jsonify({'error': str(exc)}), 500


@report_bp.route('/api/reports/<int:incident_id>', methods=['PUT'])
def update_report(incident_id: int):
	payload = request.get_json(silent=True) or {}

	allowed_fields = {
		'incident_title', 'description', 'incident_type', 'location_id', 'reported_by'
	}
	fields = []
	values = []

	for key in allowed_fields:
		if key in payload:
			value = payload.get(key)
			if key in ('incident_title', 'incident_type'):
				value = (value or '').strip()
				if not value:
					return jsonify({'error': f'{key} cannot be empty'}), 400
			if value == '':
				value = None
			fields.append(f"{key} = %s")
			values.append(value)

	image_urls_in_payload = 'image_urls' in payload
	image_urls = payload.get('image_urls') if image_urls_in_payload else None

	if image_urls_in_payload:
		if not isinstance(image_urls, list):
			return jsonify({'error': 'image_urls must be an array'}), 400
		if any(not isinstance(url, str) or not url.strip() for url in image_urls):
			return jsonify({'error': 'image_urls must contain only non-empty strings'}), 400

	if not fields and not image_urls_in_payload:
		return jsonify({'error': 'No valid fields to update'}), 400

	try:
		conn = get_db_connection()
		with conn.cursor() as cursor:
			cursor.execute(
				"SELECT incident_id FROM incident_report WHERE incident_id = %s LIMIT 1",
				(incident_id,),
			)
			if not cursor.fetchone():
				conn.close()
				return jsonify({'error': 'Report not found'}), 404

			if fields:
				values.append(incident_id)
				cursor.execute(
					f"UPDATE incident_report SET {', '.join(fields)} WHERE incident_id = %s",
					values,
				)

			if image_urls_in_payload:
				cursor.execute("DELETE FROM incident_image WHERE incident_id = %s", (incident_id,))
				for image_url in image_urls:
					cursor.execute(
						"""
						INSERT INTO incident_image (incident_id, image_url)
						VALUES (%s, %s)
						""",
						(incident_id, image_url.strip()),
					)

			report = _fetch_report(cursor, incident_id)
			conn.commit()
		conn.close()
		return jsonify(report)
	except Exception as exc:
		return jsonify({'error': str(exc)}), 500


@report_bp.route('/api/reports/<int:incident_id>', methods=['DELETE'])
def delete_report(incident_id: int):
	try:
		conn = get_db_connection()
		with conn.cursor() as cursor:
			cursor.execute("DELETE FROM incident_report WHERE incident_id = %s", (incident_id,))
			deleted_rows = cursor.rowcount
			conn.commit()
		conn.close()

		if deleted_rows == 0:
			return jsonify({'error': 'Report not found'}), 404
		return jsonify({'message': 'Report deleted successfully'})
	except Exception as exc:
		return jsonify({'error': str(exc)}), 500


@report_bp.route('/api/reports/upload_image', methods=['POST'])
def upload_report_image():
	image_file = request.files.get('image')
	if not image_file or not image_file.filename:
		return jsonify({'error': 'image file is required'}), 400

	if not _is_allowed_image(image_file.filename):
		return jsonify({'error': 'only png, jpg, jpeg, webp are allowed'}), 400

	upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
	os.makedirs(upload_dir, exist_ok=True)

	extension = image_file.filename.rsplit('.', 1)[1].lower()
	base_name = secure_filename(image_file.filename.rsplit('.', 1)[0]) or 'report'
	unique_name = f"{base_name[:40]}-{uuid.uuid4().hex}.{extension}"
	save_path = os.path.join(upload_dir, unique_name)
	image_file.save(save_path)

	image_url = url_for('static', filename=f'uploads/{unique_name}', _external=False)
	return jsonify({'image_url': image_url}), 201
