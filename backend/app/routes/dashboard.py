import pymysql
from flask import Blueprint, jsonify
from ..models import get_db_connection

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 1. นับสถิติพนักงาน (On Duty, Off Duty, Active)
            cursor.execute("""
                SELECT status, COUNT(*) as count 
                FROM staff 
                WHERE COALESCE(staff_role, '') <> 'Back-Office'
                GROUP BY status
            """)
            staff_stats_raw = cursor.fetchall()

            cursor.execute("""
                SELECT staff_id, username, full_name, title_role, status
                FROM staff
                WHERE COALESCE(staff_role, '') <> 'Back-Office'
                ORDER BY full_name ASC
            """)
            staff_rows = cursor.fetchall()
            
            # 2. นับสถิติอุปกรณ์ (Available, In Use, Maintenance)
            cursor.execute("""
                SELECT inventory_status, COUNT(*) as count 
                FROM inventory 
                GROUP BY inventory_status
            """)
            inventory_stats_raw = cursor.fetchall()

        conn.close()

        # --- จัดรูปแบบข้อมูลให้ตรงกับที่ Recharts (กราฟ) ต้องการ ---
        
        # จัดรูปแบบพนักงาน (ใช้สีตามสถานะ)
        # ค่าสถานะจาก SQL: 'On Duty', 'Off Duty', 'Active'
        staff_data = {item['status']: item['count'] for item in staff_stats_raw}
        # รองรับข้อมูลเก่าที่อาจยังเป็น Leave ให้ถูกรวมเป็น Active
        staff_data['Active'] = staff_data.get('Active', 0) + staff_data.get('Leave', 0)
        status_config = [
            {"key": "On Duty", "name": "ทำงานอยู่ (On Duty)", "fill": "#10b981"},
            {"key": "Off Duty", "name": "กำลังว่าง (Off Duty)", "fill": "#6b7280"},
            {"key": "Active", "name": "พร้อมปฏิบัติงาน (Active)", "fill": "#f59e0b"},
        ]

        staff_members_by_status = {conf["key"]: [] for conf in status_config}
        for row in staff_rows:
            status_key = row.get('status')
            if status_key == 'Leave':
                status_key = 'Active'
            if status_key not in staff_members_by_status:
                staff_members_by_status[status_key] = []
            staff_members_by_status[status_key].append({
                "staffId": row.get('staff_id'),
                "username": row.get('username'),
                "fullName": row.get('full_name'),
                "titleRole": row.get('title_role')
            })

        formatted_staff_chart = [
            {
                "status": conf["key"],
                "name": conf["name"],
                "value": staff_data.get(conf["key"], 0),
                "fill": conf["fill"],
            }
            for conf in status_config
        ]

        # จัดรูปแบบอุปกรณ์ (ใช้สีแดง/น้ำเงิน/เขียว)
        inv_data = {item['inventory_status']: item['count'] for item in inventory_stats_raw}
        formatted_inv_chart = [
            {"name": "พร้อมใช้", "value": inv_data.get('Available', 0), "fill": "#10b981"}, # สีเขียว
            {"name": "ถูกเบิก", "value": inv_data.get('In Use', 0), "fill": "#3b82f6"},    # สีน้ำเงิน
            {"name": "ส่งซ่อม", "value": inv_data.get('Maintenance', 0), "fill": "#ef4444"} # สีแดง
        ]
        
        # คำนวณยอดรวม
        total_staff = sum(staff_data.values())
        total_inv = sum(inv_data.values())

        return jsonify({
            "totalStaff": total_staff,
            "onDutyStaff": staff_data.get('On Duty', 0),
            "totalInventory": total_inv,
            "staffChartData": formatted_staff_chart,
            "inventoryChartData": formatted_inv_chart,
            "staffMembersByStatus": staff_members_by_status
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500