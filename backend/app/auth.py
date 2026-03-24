from functools import wraps

from flask import jsonify, session


def require_auth(allowed_roles: set[str] | None = None):
    """Require an authenticated session and optionally enforce staff roles."""

    def decorator(view_func):
        @wraps(view_func)
        def wrapped(*args, **kwargs):
            staff_id = session.get('staff_id')
            staff_role = session.get('staff_role')
            if not staff_id or not staff_role:
                return jsonify({'error': 'authentication required'}), 401

            if allowed_roles and staff_role not in allowed_roles:
                return jsonify({'error': 'forbidden'}), 403

            return view_func(*args, **kwargs)

        return wrapped

    return decorator
