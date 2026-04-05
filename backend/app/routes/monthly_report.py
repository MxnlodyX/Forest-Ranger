"""
SR_009: Monthly Report Summary — Backend Route
GET  /api/reports/monthly               ดึง Incident Reports รายเดือน (context สำหรับ LLM)
GET  /api/reports/monthly-summary       ดึงสรุปที่เคย Generate ไว้แล้ว
POST /api/reports/monthly-summary       Generate สรุปใหม่ด้วย Gemini แล้วบันทึกลง DB
"""

import os

from flask import Blueprint, jsonify, request, session

from ..auth import require_auth
from ..models import get_db_connection

monthly_report_bp = Blueprint('monthly_report', __name__)

_MONTH_NAMES_TH = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fetch_reports_for_month(cursor, year: int, month: int) -> list[dict]:
    """ดึง Incident Reports ของเดือนที่ระบุ พร้อม JOIN location และ staff"""
    cursor.execute(
        """
        SELECT
            ir.incident_id,
            ir.incident_title,
            ir.description,
            ir.incident_type,
            l.location_name,
            s.full_name   AS reporter_name,
            ir.created_at
        FROM incident_report ir
        LEFT JOIN location l ON ir.location_id = l.location_id
        LEFT JOIN staff   s ON ir.reported_by  = s.staff_id
        WHERE YEAR(ir.created_at) = %s AND MONTH(ir.created_at) = %s
        ORDER BY ir.created_at ASC
        """,
        (year, month),
    )
    rows = cursor.fetchall()
    for row in rows:
        if row.get('created_at'):
            row['created_at'] = row['created_at'].isoformat()
    return rows


def build_prompt(year: int, month: int, reports: list[dict]) -> str:
    """สร้าง Prompt ให้ Gemini สรุปรายงานประจำเดือน"""
    month_name = _MONTH_NAMES_TH[month - 1]
    th_year = year + 543

    if not reports:
        report_text = "ไม่มีรายงานเหตุการณ์ในเดือนนี้"
    else:
        lines = []
        for r in reports:
            date_str = r['created_at'][:10] if r.get('created_at') else 'ไม่ระบุวันที่'
            line = (
                f"- [{date_str}] {r.get('incident_title', 'ไม่ระบุ')} "
                f"(ประเภท: {r.get('incident_type') or 'ไม่ระบุ'}, "
                f"พื้นที่: {r.get('location_name') or 'ไม่ระบุ'}, "
                f"ผู้รายงาน: {r.get('reporter_name') or 'ไม่ระบุ'})"
            )
            if r.get('description'):
                line += f"\n  รายละเอียด: {r['description']}"
            lines.append(line)
        report_text = "\n".join(lines)

    return f"""คุณคือผู้ช่วยเขียนรายงานสรุปประจำเดือนสำหรับระบบ Forest Ranger (ระบบจัดการป่าไม้และอนุรักษ์ธรรมชาติ)

จงสร้างรายงานสรุปประจำเดือน{month_name} พ.ศ. {th_year} จากข้อมูลเหตุการณ์ที่เกิดขึ้นต่อไปนี้:

{report_text}

**รูปแบบรายงานที่ต้องการ (ตอบกลับเป็น Markdown เท่านั้น):**
1. หัวข้อรายงาน: "รายงานสรุปประจำเดือน{month_name} พ.ศ. {th_year}"
2. สรุปภาพรวม (จำนวนเหตุการณ์ทั้งหมด, ประเภทหลัก, พื้นที่ที่เกิดเหตุการณ์มากที่สุด)
3. รายละเอียดเหตุการณ์แยกตามประเภท
4. การวิเคราะห์แนวโน้มและข้อสังเกต
5. ข้อเสนอแนะและมาตรการป้องกัน

ใช้ภาษาไทย ชัดเจน กระชับ เป็นทางการ"""


# ---------------------------------------------------------------------------
# GET /api/reports/monthly
# ---------------------------------------------------------------------------

@monthly_report_bp.route('/api/reports/monthly', methods=['GET'])
@require_auth({'Back-Office'})
def get_monthly_reports():
    """ดึงรายการ Incident Reports ของเดือนที่ระบุ (สำหรับ preview ก่อน generate)"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    if not year or not month or not (1 <= month <= 12):
        return jsonify({'error': 'year and month (1-12) are required'}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            reports = _fetch_reports_for_month(cursor, year, month)
        conn.close()
        return jsonify({'year': year, 'month': month, 'count': len(reports), 'reports': reports})
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


# ---------------------------------------------------------------------------
# GET /api/reports/monthly-summary
# ---------------------------------------------------------------------------

@monthly_report_bp.route('/api/reports/monthly-summary', methods=['GET'])
@require_auth({'Back-Office'})
def get_monthly_summary():
    """ดึงสรุปที่เคย Generate และบันทึกไว้แล้ว"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    if not year or not month or not (1 <= month <= 12):
        return jsonify({'error': 'year and month (1-12) are required'}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT summary_id, year, month, total_incidents,
                       summary_markdown, generated_by, generated_at
                FROM monthly_report_summary
                WHERE year = %s AND month = %s
                LIMIT 1
                """,
                (year, month),
            )
            row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'exists': False}), 404

        if row.get('generated_at'):
            row['generated_at'] = row['generated_at'].isoformat()

        return jsonify({'exists': True, **row})
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


# ---------------------------------------------------------------------------
# POST /api/reports/monthly-summary
# ---------------------------------------------------------------------------

@monthly_report_bp.route('/api/reports/monthly-summary', methods=['POST'])
@require_auth({'Back-Office'})
def generate_monthly_summary():
    """Generate สรุปรายเดือนด้วย Gemini แล้วบันทึกลง DB (UPSERT)"""
    payload = request.get_json(silent=True) or {}
    year = payload.get('year')
    month = payload.get('month')

    if not year or not month:
        return jsonify({'error': 'year and month are required'}), 400

    try:
        year, month = int(year), int(month)
    except (TypeError, ValueError):
        return jsonify({'error': 'year and month must be integers'}), 400

    if not (1 <= month <= 12):
        return jsonify({'error': 'month must be between 1 and 12'}), 400

    api_key = os.environ.get('GEMINI_API_KEY', '').strip()
    if not api_key or api_key == 'your-gemini-api-key-here':
        return jsonify({'error': 'GEMINI_API_KEY is not configured on the server'}), 503

    # ── 1. ดึงข้อมูล Incident Reports ────────────────────────────────────
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            reports = _fetch_reports_for_month(cursor, year, month)
        conn.close()
    except Exception:
        return jsonify({'error': 'internal server error'}), 500

    # ── 2. เรียก Gemini API ───────────────────────────────────────────────
    try:
        from google import genai  # lazy import — ไม่ block startup ถ้าไม่ได้ใช้

        client = genai.Client(api_key=api_key)
        prompt = build_prompt(year, month, reports)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        summary_text = response.text
    except Exception as exc:
        return jsonify({'error': f'LLM generation failed: {str(exc)}'}), 502

    # ── 3. บันทึก / อัปเดต Summary ลง DB ────────────────────────────────
    generated_by = session.get('staff_id')
    saved = False
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO monthly_report_summary
                    (year, month, total_incidents, summary_markdown, generated_by)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    total_incidents  = VALUES(total_incidents),
                    summary_markdown = VALUES(summary_markdown),
                    generated_by     = VALUES(generated_by),
                    generated_at     = CURRENT_TIMESTAMP
                """,
                (year, month, len(reports), summary_text, generated_by),
            )
            conn.commit()
        conn.close()
        saved = True
    except Exception:
        pass  # ยังคืนผลลัพธ์ให้ Frontend แม้บันทึกไม่สำเร็จ

    return jsonify({
        'year': year,
        'month': month,
        'total_incidents': len(reports),
        'summary_markdown': summary_text,
        'saved': saved,
    })
