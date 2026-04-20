"""
BDD Tests — Monthly Report Summary Generation (SR_009)
"""
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from pytest_bdd import given, scenarios, then, when

from app import create_app

scenarios('features/monthly_report.feature')

pytestmark = [pytest.mark.monthly_report, pytest.mark.bdd]


def _mock_conn_and_cursor():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


# ---------------------------------------------------------------------------
# Background
# ---------------------------------------------------------------------------

@given('ผู้ควบคุมกำลังพลได้ล็อกอินเข้าสู่ระบบแล้ว', target_fixture='client')
def authenticated_monthly_report_client():
    app = create_app('testing')
    app.config['SECRET_KEY'] = 'test-secret'
    with app.test_client() as c:
        with c.session_transaction() as sess:
            sess['staff_id'] = 1
            sess['staff_role'] = 'Back-Office'
        yield c


# ---------------------------------------------------------------------------
# Scenario: ดึงข้อมูลเหตุการณ์รายเดือนสำเร็จ
# ---------------------------------------------------------------------------

@when('ร้องขอข้อมูลเหตุการณ์เดือน 1 ปี 2026', target_fixture='monthly_response')
def request_monthly_incidents(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = [
        {
            'incident_id': 1,
            'incident_title': 'พบกับดักสัตว์',
            'description': 'พบกับดักสัตว์บริเวณเส้นทาง A',
            'incident_type': 'Trap',
            'location_name': 'Sector A',
            'reporter_name': 'Narin Kittisak',
            'created_at': datetime(2026, 1, 15, 9, 0),
        }
    ]
    with patch('app.routes.monthly_report.get_db_connection', return_value=conn):
        return client.get('/api/reports/monthly?year=2026&month=1')


@then('ระบบต้องส่งข้อมูลเหตุการณ์กลับมาพร้อมจำนวนเหตุการณ์')
def assert_monthly_incidents(monthly_response):
    assert monthly_response.status_code == 200
    body = monthly_response.get_json()
    assert body['year'] == 2026
    assert body['month'] == 1
    assert 'count' in body
    assert 'reports' in body
    assert body['count'] == 1


# ---------------------------------------------------------------------------
# Scenario: สร้างรายงานสรุปประจำเดือนด้วย AI สำเร็จ
# ---------------------------------------------------------------------------

@when('ส่งคำขอสร้างรายงานสรุปเดือน 1 ปี 2026 พร้อม Gemini API key ที่ถูกต้อง', target_fixture='generate_response')
def generate_monthly_summary(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = []

    mock_gemini_response = MagicMock()
    mock_gemini_response.text = '# รายงานสรุปประจำเดือนมกราคม พ.ศ. 2569\n\nไม่มีเหตุการณ์ในเดือนนี้'

    mock_client_instance = MagicMock()
    mock_client_instance.models.generate_content.return_value = mock_gemini_response

    with patch('app.routes.monthly_report.get_db_connection', return_value=conn), \
         patch.dict('os.environ', {'GEMINI_API_KEY': 'fake-test-key'}), \
         patch('google.genai.Client', return_value=mock_client_instance):
        return client.post(
            '/api/reports/monthly-summary',
            json={'year': 2026, 'month': 1},
        )


@then('ระบบต้องส่งรายงานสรุปกลับมาในรูปแบบ Markdown')
def assert_summary_markdown(generate_response):
    assert generate_response.status_code == 200
    body = generate_response.get_json()
    assert 'summary_markdown' in body
    assert body['year'] == 2026
    assert body['month'] == 1
    assert 'total_incidents' in body
    assert isinstance(body['summary_markdown'], str)
    assert len(body['summary_markdown']) > 0


# ---------------------------------------------------------------------------
# Scenario: ดึงสรุปรายงานที่บันทึกไว้แล้วสำเร็จ
# ---------------------------------------------------------------------------

@when('ร้องขอดูสรุปรายงานที่บันทึกแล้วเดือน 2 ปี 2026', target_fixture='cached_response')
def request_cached_summary(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchone.return_value = {
        'summary_id': 1,
        'year': 2026,
        'month': 2,
        'total_incidents': 3,
        'summary_markdown': '# รายงานสรุป\n\nสรุปประจำเดือน',
        'generated_by': 1,
        'generated_at': datetime(2026, 3, 1, 10, 0),
    }
    with patch('app.routes.monthly_report.get_db_connection', return_value=conn):
        return client.get('/api/reports/monthly-summary?year=2026&month=2')


@then('ระบบต้องส่งสรุปที่บันทึกไว้กลับมา')
def assert_cached_summary(cached_response):
    assert cached_response.status_code == 200
    body = cached_response.get_json()
    assert body['exists'] is True
    assert body['year'] == 2026
    assert body['month'] == 2
    assert 'summary_markdown' in body
    assert 'generated_at' in body
