"""
Unit Tests — Monthly Report Summary (SR_009)
ครอบคลุม: validation, prompt builder, GET monthly, GET/POST summary
"""
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from app import create_app
from app.routes.monthly_report import build_prompt, _fetch_reports_for_month


pytestmark = [pytest.mark.monthly_report]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    app = create_app('testing')
    app.config['SECRET_KEY'] = 'test-secret'
    with app.test_client() as c:
        with c.session_transaction() as sess:
            sess['staff_id'] = 1
            sess['staff_role'] = 'Back-Office'
        yield c


@pytest.fixture
def unauth_client():
    app = create_app('testing')
    app.config['SECRET_KEY'] = 'test-secret'
    with app.test_client() as c:
        yield c


def _mock_conn_and_cursor():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


# ---------------------------------------------------------------------------
# build_prompt helpers
# ---------------------------------------------------------------------------

def test_build_prompt_contains_month_name():
    prompt = build_prompt(2026, 4, [])
    assert 'เมษายน' in prompt


def test_build_prompt_empty_reports_uses_placeholder():
    prompt = build_prompt(2026, 1, [])
    assert 'ไม่มีรายงานเหตุการณ์' in prompt


def test_build_prompt_with_reports_includes_incident_title():
    reports = [
        {
            'incident_id': 1,
            'incident_title': 'พบกับดักสัตว์',
            'description': 'รายละเอียด',
            'incident_type': 'Trap',
            'location_name': 'Sector A',
            'reporter_name': 'Alice',
            'created_at': '2026-01-15T09:00:00',
        }
    ]
    prompt = build_prompt(2026, 1, reports)
    assert 'พบกับดักสัตว์' in prompt
    assert 'Sector A' in prompt
    assert 'Trap' in prompt


def test_build_prompt_converts_to_thai_year():
    prompt = build_prompt(2026, 1, [])
    # 2026 + 543 = 2569
    assert '2569' in prompt


# ---------------------------------------------------------------------------
# GET /api/reports/monthly — validation
# ---------------------------------------------------------------------------

def test_get_monthly_missing_params_returns_400(client):
    response = client.get('/api/reports/monthly')
    assert response.status_code == 400
    assert 'error' in response.get_json()


def test_get_monthly_invalid_month_returns_400(client):
    response = client.get('/api/reports/monthly?year=2026&month=13')
    assert response.status_code == 400


def test_get_monthly_requires_auth(unauth_client):
    response = unauth_client.get('/api/reports/monthly?year=2026&month=1')
    assert response.status_code == 401


def test_get_monthly_success(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = [
        {
            'incident_id': 5,
            'incident_title': 'Fire Sighting',
            'description': None,
            'incident_type': 'Fire',
            'location_name': 'Zone B',
            'reporter_name': 'Bob',
            'created_at': datetime(2026, 1, 10, 8, 0),
        }
    ]
    with patch('app.routes.monthly_report.get_db_connection', return_value=conn):
        response = client.get('/api/reports/monthly?year=2026&month=1')

    assert response.status_code == 200
    body = response.get_json()
    assert body['year'] == 2026
    assert body['month'] == 1
    assert body['count'] == 1
    assert body['reports'][0]['incident_id'] == 5


# ---------------------------------------------------------------------------
# GET /api/reports/monthly-summary
# ---------------------------------------------------------------------------

def test_get_summary_not_found_returns_404(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchone.return_value = None
    with patch('app.routes.monthly_report.get_db_connection', return_value=conn):
        response = client.get('/api/reports/monthly-summary?year=2026&month=3')
    assert response.status_code == 404
    assert response.get_json()['exists'] is False


def test_get_summary_found(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchone.return_value = {
        'summary_id': 1,
        'year': 2026,
        'month': 3,
        'total_incidents': 5,
        'summary_markdown': '# สรุปรายงาน\n\nมีเหตุการณ์ทั้งหมด 5 รายการ',
        'generated_by': 1,
        'generated_at': datetime(2026, 4, 1, 12, 0),
    }
    with patch('app.routes.monthly_report.get_db_connection', return_value=conn):
        response = client.get('/api/reports/monthly-summary?year=2026&month=3')

    assert response.status_code == 200
    body = response.get_json()
    assert body['exists'] is True
    assert body['total_incidents'] == 5
    assert 'summary_markdown' in body
    assert body['generated_at'] == '2026-04-01T12:00:00'


# ---------------------------------------------------------------------------
# POST /api/reports/monthly-summary
# ---------------------------------------------------------------------------

def test_generate_summary_no_api_key_returns_503(client):
    with patch.dict('os.environ', {'GEMINI_API_KEY': ''}, clear=False):
        response = client.post(
            '/api/reports/monthly-summary',
            json={'year': 2026, 'month': 1},
        )
    assert response.status_code == 503
    assert 'GEMINI_API_KEY' in response.get_json()['error']


def test_generate_summary_missing_body_returns_400(client):
    response = client.post('/api/reports/monthly-summary', json={})
    assert response.status_code == 400


def test_generate_summary_invalid_month_returns_400(client):
    response = client.post(
        '/api/reports/monthly-summary',
        json={'year': 2026, 'month': 0},
    )
    assert response.status_code == 400


def test_generate_summary_requires_auth(unauth_client):
    response = unauth_client.post(
        '/api/reports/monthly-summary',
        json={'year': 2026, 'month': 1},
    )
    assert response.status_code == 401


def test_generate_summary_success(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = []

    mock_gemini_response = MagicMock()
    mock_gemini_response.text = '# รายงานสรุป\n\nไม่มีเหตุการณ์ในเดือนนี้'
    mock_client_instance = MagicMock()
    mock_client_instance.models.generate_content.return_value = mock_gemini_response

    with patch('app.routes.monthly_report.get_db_connection', return_value=conn), \
         patch.dict('os.environ', {'GEMINI_API_KEY': 'fake-key'}), \
         patch('google.genai.Client', return_value=mock_client_instance):
        response = client.post(
            '/api/reports/monthly-summary',
            json={'year': 2026, 'month': 1},
        )

    assert response.status_code == 200
    body = response.get_json()
    assert body['year'] == 2026
    assert body['month'] == 1
    assert body['total_incidents'] == 0
    assert '# รายงานสรุป' in body['summary_markdown']


def test_generate_summary_llm_failure_returns_502(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = []

    mock_client_instance = MagicMock()
    mock_client_instance.models.generate_content.side_effect = Exception('API quota exceeded')

    with patch('app.routes.monthly_report.get_db_connection', return_value=conn), \
         patch.dict('os.environ', {'GEMINI_API_KEY': 'fake-key'}), \
         patch('google.genai.Client', return_value=mock_client_instance):
        response = client.post(
            '/api/reports/monthly-summary',
            json={'year': 2026, 'month': 1},
        )

    assert response.status_code == 502
    assert 'LLM generation failed' in response.get_json()['error']
