from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from pytest_bdd import given, scenarios, then, when

from app import create_app


scenarios('features/heatmap.feature')

pytestmark = [pytest.mark.heatmap, pytest.mark.bdd]


def _mock_conn_and_cursor():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


@given('ผู้ควบคุมกำลังพลอยู่ในหน้า HeatMap Management', target_fixture='client')
def authenticated_heatmap_client():
    app = create_app('testing')
    app.config['SECRET_KEY'] = 'test-secret'
    with app.test_client() as test_client:
        with test_client.session_transaction() as session:
            session['staff_id'] = 1
            session['staff_role'] = 'Back-Office'
        yield test_client


@when('เรียก API ดึงข้อมูล HeatMap รายพื้นที่ Zone A', target_fixture='area_response')
def request_heatmap_points_by_area(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = [
        {
        'incident_id': 90,
        'incident_title': 'Wildlife spot',
        'description': 'BDD',
        'incident_type': 'Wildlife',
        'recorded_at': datetime(2026, 4, 9, 8, 0),
        'created_at': datetime(2026, 4, 9, 8, 0),
        'location_name': 'Sector A Point',
        'sector': 'Zone A',
        'coordinates': '14.5100, 101.3100',
        'reporter_name': 'Admin',
        }
    ]

    with patch('app.routes.heatmap.get_db_connection', return_value=conn):
        return client.get('/api/heatmap/points/by-area?area_id=Zone%20A')


@then('ระบบต้องส่งข้อมูล HeatMap จาก Incident Report ของพื้นที่นั้นกลับ')
def assert_heatmap_by_area(area_response):
    assert area_response.status_code == 200
    body = area_response.get_json()
    assert body['count'] == 1
    assert body['items'][0]['incident_id'] == 90


@given('เจ้าหน้าที่ภาคสนามล็อกอินอยู่ในระบบ', target_fixture='field_ops_client')
def field_ops_heatmap_client():
    app = create_app('testing')
    app.config['SECRET_KEY'] = 'test-secret'
    with app.test_client() as test_client:
        with test_client.session_transaction() as session:
            session['staff_id'] = 7
            session['staff_role'] = 'Field-Ops'
        yield test_client


@when('เรียก API ดึงข้อมูล HeatMap ทุกพื้นที่', target_fixture='all_response')
def request_heatmap_points_all_areas(field_ops_client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = [
        {
        'incident_id': 101,
        'incident_title': 'Fence Damage',
        'description': 'Near gate',
        'incident_type': 'Damage',
        'created_at': datetime(2026, 4, 9, 8, 0),
        'location_name': 'Sector B Point',
        'sector': 'Zone B',
        'coordinates': '14.6000, 101.4000',
        'reporter_name': 'Ranger One',
        }
    ]

    with patch('app.routes.heatmap.get_db_connection', return_value=conn):
        return field_ops_client.get('/api/heatmap/points?page=1&page_size=50')


@then('ระบบต้องส่งข้อมูล HeatMap จาก Incident Report กลับ')
def assert_heatmap_all_response(all_response):
    assert all_response.status_code == 200
    body = all_response.get_json()
    assert body['count'] == 1
    assert body['items'][0]['incident_id'] == 101
