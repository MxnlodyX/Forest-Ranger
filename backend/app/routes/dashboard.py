import pymysql
from flask import Blueprint, jsonify
from ..models import get_db_connection

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 1. นับสถิติพนักงาน (On Duty, Off Duty, Leave)
            cursor.execute("""
                SELECT status, COUNT(*) as count 
                FROM staff 
                GROUP BY status
            """)
            staff_stats_raw = cursor.fetchall()
            
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
        # ค่าสถานะจาก SQL: 'On Duty', 'Off Duty', 'Leave'
        staff_data = {item['status']: item['count'] for item in staff_stats_raw}
        formatted_staff_chart = [
            {"name": "ทำงานอยู่ (On Duty)", "value": staff_data.get('On Duty', 0), "fill": "#10b981"}, # สีเขียว Emerald
            {"name": "กำลังว่าง (Off Duty)", "value": staff_data.get('Off Duty', 0), "fill": "#6b7280"}, # สีเทา
            {"name": "ลาพัก (Leave)", "value": staff_data.get('Leave', 0), "fill": "#f59e0b"}  # สีส้ม Amber
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
            "inventoryChartData": formatted_inv_chart
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500