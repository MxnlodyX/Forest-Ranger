import pymysql
import os
import uuid
from flask import Blueprint, jsonify, request, current_app, url_for
from werkzeug.utils import secure_filename
from ..auth import require_auth
from ..models import get_db_connection

hr_bp = Blueprint('human_resource', __name__)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
ROLE_ALIASES = {
    'backoffice': 'Back-Office',
    'back-office': 'Back-Office',
    'fieldops': 'Field-Ops',
    'field-ops': 'Field-Ops',
}
STATUS_ALIASES = {
    'off duty': 'Off Duty',
    'off-duty': 'Off Duty',
    'on duty': 'On Duty',
    'on-duty': 'On Duty',
    'active': 'Active',
}
ALLOWED_STAFF_STATUSES = {'Off Duty', 'On Duty', 'Active'}


def _is_allowed_image(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


def _normalize_staff_role(role: str | None) -> str:
    normalized = (role or '').strip()
    if not normalized:
        return ''
    return ROLE_ALIASES.get(normalized.lower(), normalized)


def _normalize_staff_status(status: str | None) -> str:
    normalized = (status or '').strip()
    if not normalized:
        return ''
    return STATUS_ALIASES.get(normalized.lower(), normalized)


def _parse_enum_values(enum_type: str | None) -> set[str]:
    if not enum_type:
        return set()
    raw = enum_type.strip()
    if not raw.startswith('enum(') or not raw.endswith(')'):
        return set()
    body = raw[5:-1]
    values = set()
    for part in body.split(','):
        cleaned = part.strip().strip("'").strip('"')
        if cleaned:
            values.add(cleaned)
    return values


def _get_staff_status_enum_values(cursor) -> set[str]:
    cursor.execute("SHOW COLUMNS FROM staff LIKE 'status'")
    col = cursor.fetchone() or {}
    return _parse_enum_values(col.get('Type'))


def _status_for_db_write(cursor, requested_status: str) -> str:
    enum_values = _get_staff_status_enum_values(cursor)
    if not enum_values:
        return requested_status
    if requested_status in enum_values:
        return requested_status
    # Backward compatibility for old schema: map Active -> Leave
    if requested_status == 'Active' and 'Leave' in enum_values:
        return 'Leave'
    return requested_status


def _status_for_response(raw_status: str | None) -> str:
    return 'Active' if raw_status == 'Leave' else (raw_status or '')


@hr_bp.route('/api/staff', methods=['GET'])
@require_auth({'Back-Office', 'Backoffice'})
def get_staff_list():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    staff_id,
                    username,
                    full_name,
                    contact_number,
                    title_role,
                    staff_role,
                    area,
                    status,
                    profile_image
                FROM staff
                ORDER BY staff_id DESC
                """
            )
            staff_list = cursor.fetchall()
            for row in staff_list:
                row['status'] = _status_for_response(row.get('status'))
        conn.close()
        return jsonify(staff_list)
    except Exception:
        return jsonify({"error": "internal server error"}), 500


@hr_bp.route('/api/add_new_staff', methods=['POST'])
@require_auth({'Back-Office', 'Backoffice'})
def add_new_staff():
    payload = request.get_json(silent=True) or {}
    username = (payload.get('username') or '').strip()
    password = payload.get('password')
    full_name = (payload.get('full_name') or payload.get('name') or '').strip()
    contact_number = (payload.get('contact_number') or payload.get('contact') or '').strip()
    title_role = (payload.get('title_role') or payload.get('title') or '').strip()
    staff_role = _normalize_staff_role(payload.get('staff_role') or payload.get('role'))
    area = (payload.get('area') or '').strip() or None
    status = _normalize_staff_status(payload.get('status'))
    profile_image = payload.get('profile_image') or payload.get('image')

    if not all([username, password, full_name, contact_number, title_role, staff_role, status]):
        return jsonify({"error": "username, password, full_name, contact_number, title_role, staff_role, status are required"}), 400
    if status not in ALLOWED_STAFF_STATUSES:
        return jsonify({"error": "status must be Off Duty, On Duty, or Active"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            db_status = _status_for_db_write(cursor, status)
            cursor.execute(
                """
                INSERT INTO staff (username, pwd, full_name, contact_number, title_role, staff_role, area, status, profile_image)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (username, password, full_name, contact_number, title_role, staff_role, area, db_status, profile_image),
            )
            staff_id = cursor.lastrowid

            cursor.execute(
                """
                SELECT
                    staff_id,
                    username,
                    full_name,
                    contact_number,
                    title_role,
                    staff_role,
                    area,
                    status,
                    profile_image
                FROM staff
                WHERE staff_id = %s
                LIMIT 1
                """,
                (staff_id,),
            )
            created_staff = cursor.fetchone()
            if created_staff:
                created_staff['status'] = _status_for_response(created_staff.get('status'))

        conn.commit()
        conn.close()
    except pymysql.err.IntegrityError:
        return jsonify({"error": "username already exists"}), 409
    except pymysql.err.DataError as exc:
        return jsonify({"error": f"invalid staff data: {exc}"}), 400
    except Exception:
        return jsonify({"error": "internal server error"}), 500

    return jsonify({"message": "New staff added successfully!", "staff": created_staff}), 201

@hr_bp.route('/api/edit_staff', methods=['PUT'])
@require_auth({'Back-Office', 'Backoffice'})
def edit_staff(staff_id: int | None = None):
    payload = request.get_json(silent=True) or {}
    staff_id_from_body = payload.get('staff_id')
    if isinstance(staff_id_from_body, str):
        staff_id_from_body = staff_id_from_body.strip()

    staff_id = (
        staff_id_from_body
        or request.args.get('staff_id', type=int)
        or staff_id
    )

    try:
        staff_id = int(staff_id) if staff_id is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "staff_id must be an integer"}), 400

    username = (payload.get('username') or '').strip()
    password = (payload.get('password') or '').strip()
    full_name = (payload.get('full_name') or payload.get('name') or '').strip()
    contact_number = (payload.get('contact_number') or payload.get('contact') or '').strip()
    title_role = (payload.get('title_role') or payload.get('title') or '').strip()
    staff_role = _normalize_staff_role(payload.get('staff_role') or payload.get('role'))
    area = (payload.get('area') or '').strip() or None
    status = _normalize_staff_status(payload.get('status'))
    profile_image = payload.get('profile_image') or payload.get('image')

    if not all([staff_id, username, full_name, contact_number, title_role, staff_role, status]):
        return jsonify({"error": "staff_id, username, full_name, contact_number, title_role, staff_role, status are required"}), 400
    if status not in ALLOWED_STAFF_STATUSES:
        return jsonify({"error": "status must be Off Duty, On Duty, or Active"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            db_status = _status_for_db_write(cursor, status)
            cursor.execute(
                """
                SELECT 1
                FROM staff
                WHERE staff_id = %s
                LIMIT 1
                """,
                (staff_id,),
            )
            if not cursor.fetchone():
                conn.commit()
                conn.close()
                return jsonify({"error": "staff not found"}), 404

            if password:
                cursor.execute(
                    """
                    UPDATE staff
                    SET username = %s,
                        pwd = %s,
                        full_name = %s,
                        contact_number = %s,
                        title_role = %s,
                        staff_role = %s,
                        area = %s,
                        status = %s,
                        profile_image = %s
                    WHERE staff_id = %s
                    """,
                    (username, password, full_name, contact_number, title_role, staff_role, area, db_status, profile_image, staff_id),
                )
            else:
                cursor.execute(
                    """
                    UPDATE staff
                    SET username = %s,
                        full_name = %s,
                        contact_number = %s,
                        title_role = %s,
                        staff_role = %s,
                        area = %s,
                        status = %s,
                        profile_image = %s
                    WHERE staff_id = %s
                    """,
                    (username, full_name, contact_number, title_role, staff_role, area, db_status, profile_image, staff_id),
                )

            cursor.execute(
                """
                SELECT
                    staff_id,
                    username,
                    full_name,
                    contact_number,
                    title_role,
                    staff_role,
                    area,
                    status,
                    profile_image
                FROM staff
                WHERE staff_id = %s
                LIMIT 1
                """,
                (staff_id,),
            )
            updated_staff = cursor.fetchone()
            if updated_staff:
                updated_staff['status'] = _status_for_response(updated_staff.get('status'))

        conn.commit()
        conn.close()
    except pymysql.err.IntegrityError:
        return jsonify({"error": "username already exists"}), 409
    except pymysql.err.DataError as exc:
        return jsonify({"error": f"invalid staff data: {exc}"}), 400
    except Exception:
        return jsonify({"error": "internal server error"}), 500

    return jsonify({"message": "Staff updated successfully!", "staff": updated_staff}), 200

@hr_bp.route('/api/upload_profile_image', methods=['POST'])
@require_auth({'Back-Office', 'Backoffice'})
def upload_profile_image():
    file = request.files.get('image')
    if not file or not file.filename:
        return jsonify({"error": "image file is required"}), 400

    if not _is_allowed_image(file.filename):
        return jsonify({"error": "only png, jpg, jpeg, webp are allowed"}), 400

    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    extension = file.filename.rsplit('.', 1)[1].lower()
    base_name = secure_filename(file.filename.rsplit('.', 1)[0]) or 'image'
    unique_name = f"{base_name[:40]}-{uuid.uuid4().hex}.{extension}"
    save_path = os.path.join(upload_dir, unique_name)
    file.save(save_path)

    image_url = url_for('static', filename=f'uploads/{unique_name}', _external=False)
    return jsonify({"image_url": image_url}), 201


@hr_bp.route('/api/delete_staff/<int:staff_id>', methods=['DELETE'])
@require_auth({'Back-Office', 'Backoffice'})
def delete_staff(staff_id: int):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM staff WHERE staff_id = %s", (staff_id,))
            deleted_rows = cursor.rowcount
        conn.commit()
        conn.close()

        if deleted_rows == 0:
            return jsonify({"error": "staff not found"}), 404

        return jsonify({"message": "Staff deleted successfully!"}), 200
    except Exception:
        return jsonify({"error": "internal server error"}), 500
