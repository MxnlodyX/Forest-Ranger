from flask import Blueprint, jsonify, request, session
from ..models import get_db_connection
from time import time

sign_in_bp = Blueprint('sign_in', __name__)

_login_attempts: dict[str, list[float]] = {}
_blocked_until: dict[str, float] = {}
_MAX_ATTEMPTS = 5
_WINDOW_SECONDS = 300
_BLOCK_SECONDS = 300


def _rate_limit_key(username: str) -> str:
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown')
    return f"{client_ip}|{username.lower()}"


def _is_temporarily_blocked(key: str) -> bool:
    now = time()
    blocked_until = _blocked_until.get(key, 0)
    if blocked_until <= now:
        _blocked_until.pop(key, None)
        return False
    return True


def _register_failed_attempt(key: str) -> None:
    now = time()
    attempts = [t for t in _login_attempts.get(key, []) if now - t <= _WINDOW_SECONDS]
    attempts.append(now)
    _login_attempts[key] = attempts
    if len(attempts) >= _MAX_ATTEMPTS:
        _blocked_until[key] = now + _BLOCK_SECONDS
        _login_attempts.pop(key, None)


def _clear_attempts(key: str) -> None:
    _login_attempts.pop(key, None)
    _blocked_until.pop(key, None)


def _sign_in_by_role(expected_staff_role: str):
    payload = request.get_json(silent=True) or {}
    username = (payload.get('username') or '').strip()
    password = payload.get('password')

    if not username or password is None:
        return jsonify({"error": "username and password are required"}), 400

    rate_key = _rate_limit_key(username)
    if _is_temporarily_blocked(rate_key):
        return jsonify({"error": "too many failed attempts, try again later"}), 429

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
            _register_failed_attempt(rate_key)
            return jsonify({"error": "invalid credentials"}), 401

        _clear_attempts(rate_key)

        session.clear()
        session['staff_id'] = staff['staff_id']
        session['staff_role'] = staff['staff_role']
        session['username'] = staff['username']
        session.permanent = True

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
    except Exception:
        return jsonify({"error": "internal server error"}), 500


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