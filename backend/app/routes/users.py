from flask import Blueprint, jsonify
from ..models import get_db_connection

users_bp = Blueprint('users', __name__)


@users_bp.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users")
            users = cursor.fetchall()
        conn.close()
        return jsonify(users)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
