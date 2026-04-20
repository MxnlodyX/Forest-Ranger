import os
import uuid
from flask import Blueprint, jsonify, request, current_app, url_for
from werkzeug.utils import secure_filename
from ..models import get_db_connection
import pymysql
from flask_mail import Message
from app.extensions import mail

vilager_report_bp = Blueprint('vilager_report', __name__)

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def _is_allowed_image(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

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
            # Create main table
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
            # Create image table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS public_alert_image (
                    image_id INT AUTO_INCREMENT,
                    alert_id INT NOT NULL,
                    image_url VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (image_id),
                    CONSTRAINT fk_public_alert_image_alert_id
                        FOREIGN KEY (alert_id) REFERENCES public_alert(alert_id)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            conn.commit()
        conn.close()
        return jsonify({"message": "Migration successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@vilager_report_bp.route('/api/public/alerts/upload', methods=['POST'])
def upload_public_image():
    image_file = request.files.get('image')
    if not image_file or not image_file.filename:
        return jsonify({'error': 'image file is required'}), 400

    if not _is_allowed_image(image_file.filename):
        return jsonify({'error': 'only png, jpg, jpeg, webp are allowed'}), 400

    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'public_alerts')
    os.makedirs(upload_dir, exist_ok=True)

    extension = image_file.filename.rsplit('.', 1)[1].lower()
    unique_name = f"public-{uuid.uuid4().hex}.{extension}"
    save_path = os.path.join(upload_dir, unique_name)
    image_file.save(save_path)

    image_url = url_for('static', filename=f'uploads/public_alerts/{unique_name}', _external=False)
    return jsonify({'image_url': image_url}), 201

@vilager_report_bp.route('/api/public/alerts', methods=['POST'])
def create_vilager_alert():
    payload = request.get_json(silent=True) or {}
    
    incident_type = payload.get('incident_type')
    reporter_phone = payload.get('reporter_phone')
    image_urls = payload.get('image_urls') or []

    if not incident_type or not reporter_phone:
        return jsonify({"error": "incident_type and reporter_phone are required"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO public_alert 
                    (incident_type, other_detail, urgency, location_id, 
                     reporter_name, reporter_phone, reporter_email, description, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Pending')
                """,
                (incident_type, payload.get('other_detail'), payload.get('urgency', 'normal'), 
                 payload.get('location_id'), payload.get('reporter_name'), 
                 reporter_phone, payload.get('reporter_email'), payload.get('description'))
            )
            alert_id = cursor.lastrowid

            for url in image_urls:
                cursor.execute(
                    "INSERT INTO public_alert_image (alert_id, image_url) VALUES (%s, %s)",
                    (alert_id, url)
                )
            
            conn.commit()
            
            cursor.execute("SELECT * FROM public_alert WHERE alert_id = %s", (alert_id,))
            result = _serialize_row(cursor.fetchone())
            result['image_urls'] = image_urls
            
        conn.close()
        return jsonify(result), 201
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
            alerts = cursor.fetchall()
            
            for alert in alerts:
                cursor.execute("SELECT image_url FROM public_alert_image WHERE alert_id = %s", (alert['alert_id'],))
                images = cursor.fetchall()
                alert['image_urls'] = [img['image_url'] for img in images]

        conn.close()
        return jsonify([_serialize_row(r) for r in alerts]), 200
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
            
            if row:
                cursor.execute("SELECT image_url FROM public_alert_image WHERE alert_id = %s", (alert_id,))
                images = cursor.fetchall()
                row['image_urls'] = [img['image_url'] for img in images]
                
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
            # --- จุดที่ 1: ปรับ SELECT เพื่อดึงอีเมล ---
            # สมมติว่าในตาราง public_alert มีคอลัมน์ชื่อ reporter_email
            # (ถ้าของคุณชื่ออื่น เช่น email หรือ contact_email ให้แก้ตรงนี้นะครับ)
            cursor.execute("SELECT reporter_email FROM public_alert WHERE alert_id = %s", (alert_id,))
            alert_record = cursor.fetchone()
            
            if not alert_record:
                conn.close()
                return jsonify({"error": "Alert not found"}), 404

            # เก็บค่า email เอาไว้ใช้ส่ง
            reporter_email = alert_record.get('reporter_email')

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

        # --- จุดที่ 2: ส่งอีเมลหลังจาก Commit ลง Database สำเร็จแล้ว ---
        # เช็คว่ามีการส่งอีเมลมาใน DB และมีการอัปเดต status ถึงจะส่งเมล
        if status and reporter_email:
            try:
                msg = Message(
                    subject=f"🌲 Forest Shield: อัปเดตสถานะการแจ้งเหตุ #{alert_id}",
                    recipients=[reporter_email]
                )
                
                # แนบ staff_comments ไปในเมลด้วยถ้ามีคนพิมพ์มา
                comments_html = f"<p><b>หมายเหตุจากเจ้าหน้าที่:</b> {staff_comments}</p>" if staff_comments else ""
                
                msg.html = f"""
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <h3 style="color: #2e7d32;">แจ้งเตือนการอัปเดตสถานะ</h3>
                        <p>การแจ้งเหตุหมายเลข <b>#{alert_id}</b> ของคุณได้รับการอัปเดตแล้ว</p>
                        <p>สถานะปัจจุบัน: <strong style="color: #27ae60;">{status}</strong></p>
                        {comments_html}
                        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;">
                        <p style="font-size: 12px; color: #888;">นี่คือข้อความอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ</p>
                    </div>
                """
                mail.send(msg)
                
            except Exception as email_err:
                # กรณีส่งเมลไม่ผ่าน แต่อัปเดต DB สำเร็จแล้ว
                print(f"Email Error: {email_err}")
                return jsonify({
                    "message": "Alert updated successfully, but failed to send email",
                    "email_error": str(email_err)
                }), 200

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
