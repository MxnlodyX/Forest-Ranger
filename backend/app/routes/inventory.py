import pymysql
from flask import Blueprint, jsonify, request
from ..models import get_db_connection

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/api/inventory', methods=['GET'])
def get_inventory():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # เพิ่ม i.use_by as assigneeId เพื่อส่ง ID กลับไปให้ React รู้ว่าใครเบิกอยู่
            cursor.execute("""
                SELECT 
                    i.inventory_id as id, 
                    i.unique_id as assetId, 
                    i.item_name as name, 
                    i.inventory_type as category, 
                    i.inventory_status as status, 
                    s.full_name as assignee,
                    i.use_by as assigneeId, 
                    i.notes
                FROM inventory i
                LEFT JOIN staff s ON i.use_by = s.staff_id
                ORDER BY i.inventory_id DESC
            """)
            items = cursor.fetchall()
        conn.close()
        return jsonify(items)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@inventory_bp.route('/api/inventory', methods=['POST'])
def add_inventory():
    data = request.get_json(silent=True) or {}
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # เพิ่มคอลัมน์ use_by
            cursor.execute("""
                INSERT INTO inventory (unique_id, item_name, inventory_type, inventory_status, use_by, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                data.get('assetId'), data.get('name'), data.get('category'), 
                data.get('status'), data.get('assigneeId') or None, data.get('notes')
            ))
        conn.commit()
        conn.close()
        return jsonify({"message": "Item added successfully!"}), 201
    except pymysql.err.IntegrityError:
        return jsonify({"error": "รหัสอุปกรณ์นี้ (Unique ID) มีอยู่ในระบบแล้ว"}), 409
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@inventory_bp.route('/api/inventory/<int:item_id>', methods=['PUT'])
def update_inventory(item_id):
    data = request.get_json(silent=True) or {}
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # เพิ่มการอัปเดต use_by
            cursor.execute("""
                UPDATE inventory
                SET unique_id=%s, item_name=%s, inventory_type=%s, inventory_status=%s, use_by=%s, notes=%s
                WHERE inventory_id=%s
            """, (
                data.get('assetId'), data.get('name'), data.get('category'), 
                data.get('status'), data.get('assigneeId') or None, data.get('notes'), item_id
            ))
        conn.commit()
        conn.close()
        return jsonify({"message": "Item updated successfully!"}), 200
    except pymysql.err.IntegrityError:
        return jsonify({"error": "รหัสอุปกรณ์นี้ (Unique ID) มีอยู่ในระบบแล้ว"}), 409
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@inventory_bp.route('/api/inventory/<int:item_id>', methods=['DELETE'])
def delete_inventory(item_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM inventory WHERE inventory_id=%s", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Item deleted successfully!"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500