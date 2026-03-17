from flask import Blueprint, jsonify, request
from ..models import get_db_connection

officers_bp = Blueprint('officers', __name__)


@officers_bp.route('/api/officers', methods=['GET'])
def get_officers():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM officers ORDER BY created_at DESC")
            officers = cursor.fetchall()
        conn.close()
        return jsonify(officers)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@officers_bp.route('/api/officers/<int:officer_id>', methods=['GET'])
def get_officer(officer_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM officers WHERE id = %s", (officer_id,))
            officer = cursor.fetchone()
        conn.close()

        if officer:
            return jsonify(officer)
        else:
            return jsonify({"error": "Officer not found"}), 404
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@officers_bp.route('/api/officers', methods=['POST'])
def create_officer():
    try:
        data = request.get_json()

        required_fields = ['employee_id', 'first_name', 'last_name', 'position', 'department']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO officers (employee_id, first_name, last_name, position, department,
                                     rank, phone, email, hire_date, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                data['employee_id'],
                data['first_name'],
                data['last_name'],
                data['position'],
                data['department'],
                data.get('rank'),
                data.get('phone'),
                data.get('email'),
                data.get('hire_date'),
                data.get('status', 'active')
            ))
            conn.commit()
            officer_id = cursor.lastrowid
        conn.close()

        return jsonify({"id": officer_id, "message": "Officer created successfully"}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@officers_bp.route('/api/officers/<int:officer_id>', methods=['PUT'])
def update_officer(officer_id):
    try:
        data = request.get_json()

        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM officers WHERE id = %s", (officer_id,))
            if not cursor.fetchone():
                conn.close()
                return jsonify({"error": "Officer not found"}), 404

            update_fields = []
            values = []

            allowed_fields = ['employee_id', 'first_name', 'last_name', 'position', 'department',
                            'rank', 'phone', 'email', 'hire_date', 'status']

            for field in allowed_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    values.append(data[field])

            if not update_fields:
                conn.close()
                return jsonify({"error": "No fields to update"}), 400

            values.append(officer_id)
            sql = f"UPDATE officers SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(sql, values)
            conn.commit()
        conn.close()

        return jsonify({"message": "Officer updated successfully"})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@officers_bp.route('/api/officers/<int:officer_id>', methods=['DELETE'])
def delete_officer(officer_id):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM officers WHERE id = %s", (officer_id,))
            if not cursor.fetchone():
                conn.close()
                return jsonify({"error": "Officer not found"}), 404

            cursor.execute("DELETE FROM officers WHERE id = %s", (officer_id,))
            conn.commit()
        conn.close()

        return jsonify({"message": "Officer deleted successfully"})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
