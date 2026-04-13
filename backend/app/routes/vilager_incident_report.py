from flask import Blueprint, jsonify, request
from ..models import get_db_connection
import pymysql

vilager_report_bp = Blueprint('vilager_report', __name__)

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

@vilager_report_bp.route('/api/internal/migrate', methods=['GET'])
def migrate_db():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS public_alert (
                    alert_id INT AUTO_INCREMENT,
                    incident_type ENUM('fire', 'flood', 'wildlife', 'other') NOT NULL,
                    other_detail TEXT,
                    urgency ENUM('normal', 'urgent', 'emergency') DEFAULT 'normal',
                    location_id INT,
                    reporter_name VARCHAR(255),
                    reporter_phone VARCHAR(50) NOT NULL,
                    reporter_email VARCHAR(255),
                    description TEXT,
                    status ENUM('Pending', 'Received', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending',
                    staff_comments TEXT,
                    handled_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (alert_id),
                    KEY idx_public_alert_location (location_id),
                    KEY idx_public_alert_handled_by (handled_by),
                    CONSTRAINT fk_public_alert_location
                        FOREIGN KEY (location_id) REFERENCES location(location_id)
                        ON DELETE SET NULL
                        ON UPDATE CASCADE,
                    CONSTRAINT fk_public_alert_handled_by
                        FOREIGN KEY (handled_by) REFERENCES staff(staff_id)
                        ON DELETE SET NULL
                        ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            conn.commit()
        conn.close()
        return jsonify({"message": "Migration successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@vilager_report_bp.route('/api/public/alerts', methods=['POST'])
def create_vilager_alert():
    payload = request.get_json(silent=True) or {}
    
    # Check if bulk (list) or single (dict)
    is_bulk = isinstance(payload, list)
    alerts_to_process = payload if is_bulk else [payload]
    results = []

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            for item in alerts_to_process:
                incident_type = item.get('incident_type')
                other_detail = item.get('other_detail')
                urgency = item.get('urgency') or 'normal'
                location_id = item.get('location_id')
                reporter_name = item.get('reporter_name')
                reporter_phone = item.get('reporter_phone')
                reporter_email = item.get('reporter_email')
                description = item.get('description')

                if not incident_type or not reporter_phone:
                    if is_bulk: continue # skip invalid ones in bulk
                    else: return jsonify({"error": "incident_type and reporter_phone are required"}), 400

                cursor.execute(
                    """
                    INSERT INTO public_alert 
                        (incident_type, other_detail, urgency, location_id, 
                         reporter_name, reporter_phone, reporter_email, description, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Pending')
                    """,
                    (incident_type, other_detail, urgency, location_id, 
                     reporter_name, reporter_phone, reporter_email, description)
                )
                alert_id = cursor.lastrowid
                cursor.execute("SELECT * FROM public_alert WHERE alert_id = %s", (alert_id,))
                results.append(_serialize_row(cursor.fetchone()))
            
            conn.commit()
        conn.close()
        return jsonify(results if is_bulk else results[0]), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@vilager_report_bp.route('/api/alerts', methods=['GET'])
def list_alerts():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT pa.*, l.location_name, l.coordinates, s.full_name as handler_name
                FROM public_alert pa
                LEFT JOIN location l ON pa.location_id = l.location_id
                LEFT JOIN staff s ON pa.handled_by = s.staff_id
                ORDER BY pa.created_at DESC
            """)
            rows = cursor.fetchall()
        conn.close()
        return jsonify([_serialize_row(r) for r in rows]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@vilager_report_bp.route('/api/alerts/<int:alert_id>', methods=['GET'])
def get_alert(alert_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT pa.*, l.location_name, s.full_name as handler_name
                FROM public_alert pa
                LEFT JOIN location l ON pa.location_id = l.location_id
                LEFT JOIN staff s ON pa.handled_by = s.staff_id
                WHERE pa.alert_id = %s
            """, (alert_id,))
            row = cursor.fetchone()
        conn.close()
        if not row:
            return jsonify({"error": "Alert not found"}), 404
        return jsonify(_serialize_row(row)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@vilager_report_bp.route('/api/alerts/<int:alert_id>', methods=['PUT'])
def update_alert(alert_id):
    payload = request.get_json(silent=True) or {}
    status = payload.get('status')
    staff_comments = payload.get('staff_comments')
    handled_by = payload.get('handled_by')

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM public_alert WHERE alert_id = %s", (alert_id,))
            if not cursor.fetchone():
                conn.close()
                return jsonify({"error": "Alert not found"}), 404

            updates = []
            params = []
            if status:
                updates.append("status = %s")
                params.append(status)
            if staff_comments is not None:
                updates.append("staff_comments = %s")
                params.append(staff_comments)
            if handled_by:
                updates.append("handled_by = %s")
                params.append(handled_by)

            if not updates:
                conn.close()
                return jsonify({"message": "No changes provided"}), 400

            params.append(alert_id)
            query = f"UPDATE public_alert SET {', '.join(updates)} WHERE alert_id = %s"
            cursor.execute(query, tuple(params))
            conn.commit()
        conn.close()
        return jsonify({"message": "Alert updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@vilager_report_bp.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM public_alert WHERE alert_id = %s", (alert_id,))
            conn.commit()
        conn.close()
        return jsonify({"message": "Alert deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
