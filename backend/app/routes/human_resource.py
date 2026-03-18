import pymysql
import os
import uuid
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
from ..models import get_db_connection

hr_bp = Blueprint('human_resource', __name__)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


def _is_allowed_image(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


@hr_bp.route('/api/staff', methods=['GET'])
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
                    status,
                    profile_image
                FROM staff
                ORDER BY staff_id DESC
                """
            )
            staff_list = cursor.fetchall()
        conn.close()
        return jsonify(staff_list)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@hr_bp.route('/api/add_new_staff', methods=['POST'])
def add_new_staff():
    payload = request.get_json(silent=True) or {}
    username = (payload.get('username') or '').strip()
    password = payload.get('password')
    full_name = (payload.get('full_name') or '').strip()
    contact_number = (payload.get('contact_number') or '').strip()
    title_role = (payload.get('title_role') or '').strip()
    staff_role = (payload.get('staff_role') or '').strip()
    status = (payload.get('status') or '').strip()
    profile_image = payload.get('profile_image')

    if not all([username, password, full_name, contact_number, title_role, staff_role, status]):
        return jsonify({"error": "username, password, full_name, contact_number, title_role, staff_role, status are required"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO staff (username, pwd, full_name, contact_number, title_role, staff_role, status, profile_image)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (username, password, full_name, contact_number, title_role, staff_role, status, profile_image),
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
                    status,
                    profile_image
                FROM staff
                WHERE staff_id = %s
                LIMIT 1
                """,
                (staff_id,),
            )
            created_staff = cursor.fetchone()

        conn.commit()
        conn.close()
    except pymysql.err.IntegrityError:
        return jsonify({"error": "username already exists"}), 409
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify({"message": "New staff added successfully!", "staff": created_staff}), 201


@hr_bp.route('/api/upload_profile_image', methods=['POST'])
def upload_profile_image():
    file = request.files.get('image')
    if not file or not file.filename:
        return jsonify({"error": "image file is required"}), 400

    if not _is_allowed_image(file.filename):
        return jsonify({"error": "only png, jpg, jpeg, webp are allowed"}), 400

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    original_name = secure_filename(file.filename)
    extension = original_name.rsplit('.', 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{extension}"
    save_path = os.path.join(upload_dir, unique_name)
    file.save(save_path)

    return jsonify({"image_url": f"/static/uploads/{unique_name}"}), 201
