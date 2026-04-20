import json
import os
import uuid

from flask import Blueprint, jsonify, request, current_app
from ..auth import require_auth
from ..models import get_db_connection

knowledge_bp = Blueprint('knowledge', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def _allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _save_uploaded_image(file) -> str | None:
    """บันทึกไฟล์ภาพลง static/uploads และคืน URL path ที่ใช้แสดงผล"""
    if not file or not _allowed_file(file.filename):
        return None
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))
    return f"/static/uploads/{filename}"


# ---------------------------------------------------------------------------
# GET /api/knowledge  — ดึงรายการทั้งหมด (public)
# ---------------------------------------------------------------------------
@knowledge_bp.route('/api/knowledge', methods=['GET'])
def get_knowledge_list():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    resource_id   AS id,
                    title,
                    media_type    AS type,
                    category,
                    excerpt,
                    content,
                    read_time     AS readTime,
                    image_url     AS image,
                    video_url     AS videoUrl,
                    created_at    AS date
                FROM knowledge_resource
                ORDER BY resource_id DESC
            """)
            items = cursor.fetchall()
        conn.close()
        for item in items:
            if item.get('date'):
                item['date'] = item['date'].strftime('%d %b %Y')
            # pymysql คืน JSON column เป็น string — parse ให้เป็น dict
            if isinstance(item.get('content'), str):
                try:
                    item['content'] = json.loads(item['content'])
                except (ValueError, TypeError):
                    item['content'] = {'blocks': []}
        return jsonify(items)
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


# ---------------------------------------------------------------------------
# GET /api/knowledge/<id>  — ดึงรายละเอียดรายตัว (public)
# ---------------------------------------------------------------------------
@knowledge_bp.route('/api/knowledge/<int:resource_id>', methods=['GET'])
def get_knowledge_detail(resource_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    resource_id   AS id,
                    title,
                    media_type    AS type,
                    category,
                    excerpt,
                    content,
                    read_time     AS readTime,
                    image_url     AS image,
                    video_url     AS videoUrl,
                    created_at    AS date
                FROM knowledge_resource
                WHERE resource_id = %s
            """, (resource_id,))
            item = cursor.fetchone()
        conn.close()
        if not item:
            return jsonify({'error': 'not found'}), 404
        if item.get('date'):
            item['date'] = item['date'].strftime('%d %b %Y')
        # content ถูกเก็บเป็น JSON string ใน MySQL — pymysql ไม่ auto-parse
        if isinstance(item.get('content'), str):
            item['content'] = json.loads(item['content'])
        return jsonify(item)
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


# ---------------------------------------------------------------------------
# POST /api/knowledge  — สร้างสื่อใหม่ (Back-Office)
# ---------------------------------------------------------------------------
@knowledge_bp.route('/api/knowledge', methods=['POST'])
@require_auth({'Back-Office'})
def create_knowledge():
    # รองรับทั้ง multipart (มีไฟล์) และ JSON (ไม่มีไฟล์)
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
        image_file = request.files.get('image')
        image_url = _save_uploaded_image(image_file) if image_file else data.get('imageUrl', '')
        content_str = data.get('content', '{}')
        try:
            content_obj = json.loads(content_str)
        except (ValueError, TypeError):
            content_obj = {}
    else:
        data = request.get_json(silent=True) or {}
        image_url = data.get('image', '')
        content_obj = data.get('content', {})

    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'error': 'title is required'}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO knowledge_resource
                    (title, media_type, category, excerpt, content, read_time, image_url, video_url, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                title,
                data.get('type', 'บทความ'),
                data.get('category', ''),
                data.get('excerpt', ''),
                json.dumps(content_obj, ensure_ascii=False),
                data.get('readTime', ''),
                image_url,
                data.get('videoUrl', ''),
                None,  # created_by — ยังไม่บังคับใช้ staff_id ใน MVP
            ))
            new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({'id': new_id, 'message': 'created'}), 201
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


# ---------------------------------------------------------------------------
# PUT /api/knowledge/<id>  — แก้ไขสื่อ (Back-Office)
# ---------------------------------------------------------------------------
@knowledge_bp.route('/api/knowledge/<int:resource_id>', methods=['PUT'])
@require_auth({'Back-Office'})
def update_knowledge(resource_id):
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form
        image_file = request.files.get('image')
        # อัปโหลดรูปใหม่เฉพาะเมื่อมีไฟล์ส่งมา
        new_image_url = _save_uploaded_image(image_file) if image_file else None
        image_url = new_image_url or data.get('imageUrl', '')
        content_str = data.get('content', '{}')
        try:
            content_obj = json.loads(content_str)
        except (ValueError, TypeError):
            content_obj = {}
    else:
        data = request.get_json(silent=True) or {}
        image_url = data.get('image', '')
        content_obj = data.get('content', {})

    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'error': 'title is required'}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE knowledge_resource
                SET title=%s, media_type=%s, category=%s, excerpt=%s,
                    content=%s, read_time=%s, image_url=%s, video_url=%s
                WHERE resource_id=%s
            """, (
                title,
                data.get('type', 'บทความ'),
                data.get('category', ''),
                data.get('excerpt', ''),
                json.dumps(content_obj, ensure_ascii=False),
                data.get('readTime', ''),
                image_url,
                data.get('videoUrl', ''),
                resource_id,
            ))
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({'error': 'not found'}), 404
        conn.commit()
        conn.close()
        return jsonify({'message': 'updated'}), 200
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


# ---------------------------------------------------------------------------
# DELETE /api/knowledge/<id>  — ลบสื่อ (Back-Office)
# ---------------------------------------------------------------------------
@knowledge_bp.route('/api/knowledge/<int:resource_id>', methods=['DELETE'])
@require_auth({'Back-Office'})
def delete_knowledge(resource_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                'DELETE FROM knowledge_resource WHERE resource_id=%s', (resource_id,)
            )
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({'error': 'not found'}), 404
        conn.commit()
        conn.close()
        return jsonify({'message': 'deleted'}), 200
    except Exception:
        return jsonify({'error': 'internal server error'}), 500
