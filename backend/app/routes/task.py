import pymysql
from datetime import date
from flask import Blueprint, jsonify, request, session
from ..auth import require_auth
from ..models import get_db_connection

task_bp = Blueprint('task', __name__)
ACTIVE_TASK_STATUSES = ('Todo', 'In Progress')

# ---------------------------------------------------------------------------
# Helper: serialize DATE / DATETIME fields that pymysql returns as Python objects
# ---------------------------------------------------------------------------
def _serialize_row(row: dict) -> dict:
    if row is None:
        return {}
    result = {}
    for key, val in row.items():
        if hasattr(val, 'isoformat'):
            result[key] = val.isoformat()
        else:
            result[key] = val
    return result


def _to_int_or_none(value):
    if value in (None, ''):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


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


def _status_for_db_write(cursor, requested_status: str) -> str:
    cursor.execute("SHOW COLUMNS FROM staff LIKE 'status'")
    col = cursor.fetchone() or {}
    enum_values = _parse_enum_values(col.get('Type'))
    if not enum_values or requested_status in enum_values:
        return requested_status
    if requested_status == 'Active' and 'Leave' in enum_values:
        return 'Leave'
    return requested_status


def _id_exists(cursor, table_name: str, id_column: str, value: int) -> bool:
    cursor.execute(
        f"SELECT 1 FROM {table_name} WHERE {id_column} = %s LIMIT 1",
        (value,),
    )
    return bool(cursor.fetchone())


def _normalize_iso_date_or_none(value, field_name: str):
    if value in (None, ''):
        return None
    try:
        return date.fromisoformat(str(value))
    except ValueError as exc:
        raise ValueError(f"{field_name} must be YYYY-MM-DD") from exc


def _sync_staff_status(cursor, staff_id):
    normalized_staff_id = _to_int_or_none(staff_id)
    if not normalized_staff_id:
        return

    cursor.execute(
        """
        SELECT COUNT(*) AS active_task_count
        FROM task
        WHERE assigned_to = %s
          AND status IN (%s, %s)
        """,
        (normalized_staff_id, ACTIVE_TASK_STATUSES[0], ACTIVE_TASK_STATUSES[1]),
    )
    active_task_count = (cursor.fetchone() or {}).get('active_task_count', 0)
    next_status = 'On Duty' if active_task_count > 0 else 'Active'
    db_status = _status_for_db_write(cursor, next_status)

    cursor.execute(
        """
        UPDATE staff
        SET status = %s
        WHERE staff_id = %s
        """,
        (db_status, normalized_staff_id),
    )


_TASK_SELECT = """
    SELECT
        t.task_id,
        t.task_title,
        t.objective,
        t.description,
        t.destination,
        t.assigned_to,
        s.full_name   AS assignee_name,
        t.location_id,
        l.location_name,
        l.sector      AS location_sector,
        l.coordinates AS location_coordinates,
        t.priority,
        t.status,
        t.eta,
        t.assigned_date,
        t.created_at,
        t.updated_at
    FROM task t
    LEFT JOIN staff    s ON t.assigned_to = s.staff_id
    LEFT JOIN location l ON t.location_id  = l.location_id
"""


# ---------------------------------------------------------------------------
# GET /api/tasks  — all tasks
# ---------------------------------------------------------------------------
@task_bp.route('/api/tasks', methods=['GET'])
@require_auth({'Back-Office'})
def get_tasks():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(_TASK_SELECT + " ORDER BY t.task_id DESC")
            rows = cursor.fetchall()
        conn.close()
        return jsonify([_serialize_row(r) for r in rows])
    except Exception:
        return jsonify({"error": "internal server error"}), 500


# ---------------------------------------------------------------------------
# GET /api/tasks/assigned/<staff_id>  — tasks for a specific ranger
# ---------------------------------------------------------------------------
@task_bp.route('/api/tasks/assigned/<int:staff_id>', methods=['GET'])
@require_auth({'Back-Office', 'Field-Ops'})
def get_tasks_assigned_to(staff_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                _TASK_SELECT + " WHERE t.assigned_to = %s ORDER BY t.priority DESC, t.task_id ASC",
                (staff_id,),
            )
            rows = cursor.fetchall()
        conn.close()
        return jsonify([_serialize_row(r) for r in rows])
    except Exception:
        return jsonify({"error": "internal server error"}), 500


# ---------------------------------------------------------------------------
# POST /api/tasks  — create task
# ---------------------------------------------------------------------------
@task_bp.route('/api/tasks', methods=['POST'])
@require_auth({'Back-Office'})
def create_task():
    payload = request.get_json(silent=True) or {}
    task_title = (payload.get('task_title') or '').strip()
    if not task_title:
        return jsonify({"error": "task_title is required"}), 400

    objective     = payload.get('objective') or None
    description   = payload.get('description') or None
    destination   = payload.get('destination') or None
    assigned_to_raw = payload.get('assigned_to')
    assigned_to   = _to_int_or_none(assigned_to_raw)
    location_id_raw = payload.get('location_id')
    location_id   = _to_int_or_none(location_id_raw)
    priority      = payload.get('priority') or 'Medium'
    status        = payload.get('status') or 'Todo'
    eta           = payload.get('eta') or None
    try:
        assigned_date = _normalize_iso_date_or_none(payload.get('assigned_date'), 'assigned_date')
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if priority not in ('Low', 'Medium', 'High'):
        return jsonify({"error": "priority must be Low, Medium, or High"}), 400
    if status not in ('Todo', 'In Progress', 'Done'):
        return jsonify({"error": "status must be Todo, In Progress, or Done"}), 400
    if assigned_to_raw not in (None, '') and assigned_to is None:
        return jsonify({"error": "assigned_to must be an integer"}), 400
    if location_id_raw not in (None, '') and location_id is None:
        return jsonify({"error": "location_id must be an integer"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            if assigned_to and not _id_exists(cursor, 'staff', 'staff_id', assigned_to):
                conn.close()
                return jsonify({"error": "assigned_to staff not found"}), 404

            if location_id and not _id_exists(cursor, 'location', 'location_id', location_id):
                conn.close()
                return jsonify({"error": "location_id not found"}), 404

            cursor.execute(
                """
                INSERT INTO task
                    (task_title, objective, description, destination,
                     assigned_to, location_id, priority, status, eta, assigned_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (task_title, objective, description, destination,
                 assigned_to, location_id, priority, status, eta, assigned_date),
            )
            task_id = cursor.lastrowid
            if assigned_to:
                _sync_staff_status(cursor, assigned_to)
            conn.commit()
            cursor.execute(_TASK_SELECT + " WHERE t.task_id = %s", (task_id,))
            task = cursor.fetchone()
            if not task:
                conn.close()
                return jsonify({"error": "failed to load created task"}), 500
        conn.close()
        return jsonify(_serialize_row(task)), 201
    except pymysql.err.IntegrityError as exc:
        return jsonify({"error": f"integrity error: {exc}"}), 400
    except pymysql.err.DataError as exc:
        return jsonify({"error": f"invalid task data: {exc}"}), 400
    except pymysql.MySQLError as exc:
        return jsonify({"error": f"database error: {exc}"}), 400
    except Exception as exc:
        return jsonify({"error": f"internal server error: {exc}"}), 500


# ---------------------------------------------------------------------------
# PUT /api/tasks/<task_id>  — update task
# ---------------------------------------------------------------------------
@task_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
@require_auth({'Back-Office', 'Field-Ops'})
def update_task(task_id):
    payload = request.get_json(silent=True) or {}

    if 'assigned_to' in payload:
        normalized_assigned_to = _to_int_or_none(payload.get('assigned_to'))
        if payload.get('assigned_to') not in (None, '') and normalized_assigned_to is None:
            return jsonify({"error": "assigned_to must be an integer"}), 400
        payload['assigned_to'] = normalized_assigned_to

    if 'location_id' in payload:
        normalized_location_id = _to_int_or_none(payload.get('location_id'))
        if payload.get('location_id') not in (None, '') and normalized_location_id is None:
            return jsonify({"error": "location_id must be an integer"}), 400
        payload['location_id'] = normalized_location_id

    if 'assigned_date' in payload:
        try:
            payload['assigned_date'] = _normalize_iso_date_or_none(payload.get('assigned_date'), 'assigned_date')
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    allowed_cols = {
        'task_title', 'objective', 'description', 'destination',
        'assigned_to', 'location_id', 'priority', 'status', 'eta', 'assigned_date',
    }
    fields, values = [], []
    for key in allowed_cols:
        if key in payload:
            fields.append(f"{key} = %s")
            val = payload[key]
            # Treat empty string as NULL for nullable fields
            if val == '' and key not in ('task_title',):
                val = None
            values.append(val)

    if not fields:
        return jsonify({"error": "No valid fields to update"}), 400

    if 'priority' in payload and payload['priority'] not in ('Low', 'Medium', 'High'):
        return jsonify({"error": "priority must be Low, Medium, or High"}), 400
    if 'status' in payload and payload['status'] not in ('Todo', 'In Progress', 'Done'):
        return jsonify({"error": "status must be Todo, In Progress, or Done"}), 400

    values.append(task_id)
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT assigned_to FROM task WHERE task_id = %s", (task_id,))
            before_task = cursor.fetchone()
            if not before_task:
                conn.close()
                return jsonify({"error": "Task not found"}), 404

            previous_assigned_to = _to_int_or_none(before_task.get('assigned_to'))

            if 'assigned_to' in payload and payload.get('assigned_to') and not _id_exists(cursor, 'staff', 'staff_id', payload.get('assigned_to')):
                conn.close()
                return jsonify({"error": "assigned_to staff not found"}), 404

            if 'location_id' in payload and payload.get('location_id') and not _id_exists(cursor, 'location', 'location_id', payload.get('location_id')):
                conn.close()
                return jsonify({"error": "location_id not found"}), 404

            cursor.execute(
                f"UPDATE task SET {', '.join(fields)} WHERE task_id = %s",
                values,
            )
            conn.commit()
            cursor.execute(_TASK_SELECT + " WHERE t.task_id = %s", (task_id,))
            task = cursor.fetchone()
            if not task:
                conn.close()
                return jsonify({"error": "failed to load updated task"}), 500

            current_assigned_to = _to_int_or_none((task or {}).get('assigned_to'))
            _sync_staff_status(cursor, previous_assigned_to)
            if current_assigned_to != previous_assigned_to:
                _sync_staff_status(cursor, current_assigned_to)
            conn.commit()
        conn.close()
        return jsonify(_serialize_row(task))
    except pymysql.err.IntegrityError as exc:
        return jsonify({"error": f"integrity error: {exc}"}), 400
    except pymysql.err.DataError as exc:
        return jsonify({"error": f"invalid task data: {exc}"}), 400
    except pymysql.MySQLError as exc:
        return jsonify({"error": f"database error: {exc}"}), 400
    except Exception as exc:
        return jsonify({"error": f"internal server error: {exc}"}), 500


# ---------------------------------------------------------------------------
# DELETE /api/tasks/<task_id>  — delete task
# ---------------------------------------------------------------------------
@task_bp.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@require_auth({'Back-Office'})
def delete_task(task_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT assigned_to FROM task WHERE task_id = %s", (task_id,))
            task = cursor.fetchone()
            if not task:
                conn.close()
                return jsonify({"message": "Task already deleted"}), 200

            previous_assigned_to = _to_int_or_none(task.get('assigned_to'))
            cursor.execute("DELETE FROM task WHERE task_id = %s", (task_id,))
            _sync_staff_status(cursor, previous_assigned_to)
            conn.commit()
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({"message": "Task already deleted"}), 200
        conn.close()
        return jsonify({"message": "Task deleted successfully"})
    except Exception as exc:
        return jsonify({"error": f"internal server error: {exc}"}), 500


# ---------------------------------------------------------------------------
# GET /api/locations  — all locations (used by front-end dropdown)
# ---------------------------------------------------------------------------
@task_bp.route('/api/locations', methods=['GET'])
@require_auth({'Back-Office', 'Field-Ops'})
def get_locations():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT location_id, location_name, location_type, risk_level,
                       sector, coordinates, description
                FROM location
                ORDER BY location_id ASC
                """
            )
            rows = cursor.fetchall()
        conn.close()
        return jsonify([_serialize_row(r) for r in rows])
    except Exception:
        return jsonify({"error": "internal server error"}), 500


# ---------------------------------------------------------------------------
# POST /api/locations  — create location
# ---------------------------------------------------------------------------
@task_bp.route('/api/locations', methods=['POST'])
@require_auth({'Back-Office'})
def create_location():
    payload = request.get_json(silent=True) or {}

    location_name = (payload.get('location_name') or '').strip()
    if not location_name:
        return jsonify({"error": "location_name is required"}), 400

    location_type = (payload.get('location_type') or '').strip() or None
    sector = (payload.get('sector') or '').strip() or None
    coordinates = (payload.get('coordinates') or '').strip() or None
    description = (payload.get('description') or '').strip() or None
    risk_level = (payload.get('risk_level') or 'Low').strip()

    if risk_level not in ('Low', 'Medium', 'High'):
        return jsonify({"error": "risk_level must be Low, Medium, or High"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO location
                    (location_name, location_type, risk_level, sector, coordinates, description, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    location_name,
                    location_type,
                    risk_level,
                    sector,
                    coordinates,
                    description,
                    session.get('staff_id'),
                ),
            )
            location_id = cursor.lastrowid
            conn.commit()

            cursor.execute(
                """
                SELECT location_id, location_name, location_type, risk_level,
                       sector, coordinates, description
                FROM location
                WHERE location_id = %s
                LIMIT 1
                """,
                (location_id,),
            )
            row = cursor.fetchone()
        conn.close()
        return jsonify(_serialize_row(row)), 201
    except pymysql.err.DataError as exc:
        return jsonify({"error": f"invalid location data: {exc}"}), 400
    except pymysql.MySQLError as exc:
        return jsonify({"error": f"database error: {exc}"}), 400
    except Exception as exc:
        return jsonify({"error": f"internal server error: {exc}"}), 500


# ---------------------------------------------------------------------------
# PUT /api/locations/<location_id>  — update location
# ---------------------------------------------------------------------------
@task_bp.route('/api/locations/<int:location_id>', methods=['PUT'])
@require_auth({'Back-Office'})
def update_location(location_id):
    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"error": "request body is required"}), 400

    field_map = {
        'location_name': 'location_name',
        'location_type': 'location_type',
        'risk_level': 'risk_level',
        'sector': 'sector',
        'coordinates': 'coordinates',
        'description': 'description',
    }

    updates = []
    values = []
    for key, col in field_map.items():
        if key not in payload:
            continue

        val = payload.get(key)
        if isinstance(val, str):
            val = val.strip()

        if key == 'location_name':
            if not val:
                return jsonify({"error": "location_name cannot be empty"}), 400
        elif key == 'risk_level':
            if val not in ('Low', 'Medium', 'High'):
                return jsonify({"error": "risk_level must be Low, Medium, or High"}), 400
        else:
            if val == '':
                val = None

        updates.append(f"{col} = %s")
        values.append(val)

    if not updates:
        return jsonify({"error": "no valid fields to update"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM location WHERE location_id = %s", (location_id,))
            if not cursor.fetchone():
                conn.close()
                return jsonify({"error": "location not found"}), 404

            values.append(location_id)
            cursor.execute(
                f"UPDATE location SET {', '.join(updates)} WHERE location_id = %s",
                values,
            )
            conn.commit()

            cursor.execute(
                """
                SELECT location_id, location_name, location_type, risk_level,
                       sector, coordinates, description
                FROM location
                WHERE location_id = %s
                LIMIT 1
                """,
                (location_id,),
            )
            row = cursor.fetchone()
        conn.close()
        return jsonify(_serialize_row(row))
    except pymysql.err.DataError as exc:
        return jsonify({"error": f"invalid location data: {exc}"}), 400
    except pymysql.MySQLError as exc:
        return jsonify({"error": f"database error: {exc}"}), 400
    except Exception as exc:
        return jsonify({"error": f"internal server error: {exc}"}), 500


# ---------------------------------------------------------------------------
# DELETE /api/locations/<location_id>  — delete location
# ---------------------------------------------------------------------------
@task_bp.route('/api/locations/<int:location_id>', methods=['DELETE'])
@require_auth({'Back-Office'})
def delete_location(location_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM location WHERE location_id = %s", (location_id,))
            conn.commit()
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({"error": "location not found"}), 404
        conn.close()
        return jsonify({"message": "location deleted successfully"})
    except pymysql.MySQLError as exc:
        return jsonify({"error": f"database error: {exc}"}), 400
    except Exception as exc:
        return jsonify({"error": f"internal server error: {exc}"}), 500
