import pymysql
from flask import Blueprint, jsonify, request
from ..models import get_db_connection

task_bp = Blueprint('task', __name__)

# ---------------------------------------------------------------------------
# Helper: serialize DATE / DATETIME fields that pymysql returns as Python objects
# ---------------------------------------------------------------------------
def _serialize_row(row: dict) -> dict:
    result = {}
    for key, val in row.items():
        if hasattr(val, 'isoformat'):
            result[key] = val.isoformat()
        else:
            result[key] = val
    return result


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
def get_tasks():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(_TASK_SELECT + " ORDER BY t.task_id DESC")
            rows = cursor.fetchall()
        conn.close()
        return jsonify([_serialize_row(r) for r in rows])
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# GET /api/tasks/assigned/<staff_id>  — tasks for a specific ranger
# ---------------------------------------------------------------------------
@task_bp.route('/api/tasks/assigned/<int:staff_id>', methods=['GET'])
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
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# POST /api/tasks  — create task
# ---------------------------------------------------------------------------
@task_bp.route('/api/tasks', methods=['POST'])
def create_task():
    payload = request.get_json(silent=True) or {}
    task_title = (payload.get('task_title') or '').strip()
    if not task_title:
        return jsonify({"error": "task_title is required"}), 400

    objective     = payload.get('objective') or None
    description   = payload.get('description') or None
    destination   = payload.get('destination') or None
    assigned_to   = payload.get('assigned_to') or None
    location_id   = payload.get('location_id') or None
    priority      = payload.get('priority') or 'Medium'
    status        = payload.get('status') or 'Todo'
    eta           = payload.get('eta') or None
    assigned_date = payload.get('assigned_date') or None

    if priority not in ('Low', 'Medium', 'High'):
        return jsonify({"error": "priority must be Low, Medium, or High"}), 400
    if status not in ('Todo', 'In Progress', 'Done'):
        return jsonify({"error": "status must be Todo, In Progress, or Done"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
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
            conn.commit()
            task_id = cursor.lastrowid
            cursor.execute(_TASK_SELECT + " WHERE t.task_id = %s", (task_id,))
            task = cursor.fetchone()
        conn.close()
        return jsonify(_serialize_row(task)), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# PUT /api/tasks/<task_id>  — update task
# ---------------------------------------------------------------------------
@task_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    payload = request.get_json(silent=True) or {}

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
            cursor.execute(
                f"UPDATE task SET {', '.join(fields)} WHERE task_id = %s",
                values,
            )
            conn.commit()
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({"error": "Task not found"}), 404
            cursor.execute(_TASK_SELECT + " WHERE t.task_id = %s", (task_id,))
            task = cursor.fetchone()
        conn.close()
        return jsonify(_serialize_row(task))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# DELETE /api/tasks/<task_id>  — delete task
# ---------------------------------------------------------------------------
@task_bp.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM task WHERE task_id = %s", (task_id,))
            conn.commit()
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({"error": "Task not found"}), 404
        conn.close()
        return jsonify({"message": "Task deleted successfully"})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# GET /api/locations  — all locations (used by front-end dropdown)
# ---------------------------------------------------------------------------
@task_bp.route('/api/locations', methods=['GET'])
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
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
