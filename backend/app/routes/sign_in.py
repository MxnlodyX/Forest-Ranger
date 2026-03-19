from flask import Blueprint, jsonify, request, session
from ..models import get_db_connection

sign_in_bp = Blueprint('sign_in', __name__)


def _sign_in_by_role(expected_staff_role: str):
    payload = request.get_json(silent=True) or {}
    username = (payload.get('username') or '').strip()
    password = payload.get('password')

    if not username or password is None:
        return jsonify({"error": "username and password are required"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT staff_id, username, full_name, title_role, staff_role, status, profile_image
                FROM staff
                WHERE username = %s AND pwd = %s AND staff_role = %s
                LIMIT 1
                """,
                (username, password, expected_staff_role),
            )
            staff = cursor.fetchone()
        conn.close()

        if not staff:
            return jsonify({"error": "invalid credentials"}), 401

        session['staff_id'] = staff['staff_id']
        session['staff_role'] = staff['staff_role']
        session['username'] = staff['username']

        return jsonify(
            {
                "message": "sign in successful",
                "user": {
                    "staff_id": staff['staff_id'],
                    "username": staff['username'],
                    "name": staff['full_name'],
                    "title_role": staff['title_role'],
                    "staff_role": staff['staff_role'],
                    "status": staff['status'],
                    "profile_image": staff['profile_image'],
                },
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@sign_in_bp.route('/api/backoffice-portal/sign_in', methods=['POST'])
def backoffice_sign_in():
    return _sign_in_by_role('Back-Office')


@sign_in_bp.route('/api/fieldops-portal/sign_in', methods=['POST'])
def fieldops_sign_in():
    return _sign_in_by_role('Field-Ops')


@sign_in_bp.route('/api/sign_out', methods=['POST'])
def sign_out():
    session.clear()
    return jsonify({"message": "signed out"})