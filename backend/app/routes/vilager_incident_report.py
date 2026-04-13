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
    
    incident_type = payload.get('incident_type')
    other_detail = payload.get('other_detail')
    urgency = payload.get('urgency') or 'normal'
    location_id = payload.get('location_id')
    reporter_name = payload.get('reporter_name')
    reporter_phone = payload.get('reporter_phone')
    reporter_email = payload.get('reporter_email')
    description = payload.get('description')

    # Basic validation
    if not incident_type:
        return jsonify({"error": "incident_type is required"}), 400
    if not reporter_phone:
        return jsonify({"error": "reporter_phone is required"}), 400
    
    # Optional: validate location_id if provided
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            if location_id:
                cursor.execute("SELECT 1 FROM location WHERE location_id = %s", (location_id,))
                if not cursor.fetchone():
                    conn.close()
                    return jsonify({"error": "location_id not found"}), 404

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
            conn.commit()

            cursor.execute("SELECT * FROM public_alert WHERE alert_id = %s", (alert_id,))
            row = cursor.fetchone()
        conn.close()
        return jsonify(_serialize_row(row)), 201
    except pymysql.MySQLError as exc:
        return jsonify({"error": f"database error: {exc}"}), 400
    except Exception as exc:
        return jsonify({"error": f"internal server error: {exc}"}), 500

@vilager_report_bp.route('/api/alerts', methods=['GET'])
def list_alerts():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT pa.*, l.location_name, s.full_name as handler_name
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
