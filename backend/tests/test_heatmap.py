from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from app import create_app


pytestmark = [pytest.mark.heatmap]


@pytest.fixture
def client():
    app = create_app('testing')
    app.config['SECRET_KEY'] = 'test-secret'
    with app.test_client() as test_client:
        with test_client.session_transaction() as session:
            session['staff_id'] = 1
            session['staff_role'] = 'Back-Office'
        yield test_client


def _mock_conn_and_cursor():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


def test_heatmap_create_is_not_available(client):
    response = client.post('/api/heatmap/points', json={})
    assert response.status_code == 405


def test_heatmap_update_is_not_available(client):
    response = client.put('/api/heatmap/points/9', json={})
    assert response.status_code == 404


def test_get_heatmap_points_by_area_requires_area_id(client):
    response = client.get('/api/heatmap/points/by-area')
    assert response.status_code == 400
    assert response.get_json()['error'] == 'area_id is required'


def test_get_heatmap_points_by_area_success(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = [
        {
            'incident_id': 10,
            'incident_title': 'Wild boar sighting',
            'description': 'Near stream',
            'incident_type': 'Wildlife',
            'created_at': datetime(2026, 4, 9, 8, 0),
            'location_name': 'Sector A Point',
            'sector': 'Zone A',
            'coordinates': '14.5000, 101.3000',
            'reporter_name': 'Alice',
        }
    ]

    with patch('app.routes.heatmap.get_db_connection', return_value=conn):
        response = client.get('/api/heatmap/points/by-area?area_id=Zone%20A')

    assert response.status_code == 200
    body = response.get_json()
    assert body['count'] == 1
    assert body['items'][0]['incident_id'] == 10
    assert body['items'][0]['area_id'] == 'Zone A'


def test_get_heatmap_points_all_areas_success(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = [
        {
            'incident_id': 11,
            'incident_title': 'Fence Damage',
            'description': None,
            'incident_type': 'Damage',
            'created_at': datetime(2026, 4, 10, 9, 0),
            'location_name': 'Sector B Point',
            'sector': 'Zone B',
            'coordinates': '14.6000, 101.4000',
            'reporter_name': 'Bob',
        }
    ]

    with patch('app.routes.heatmap.get_db_connection', return_value=conn):
        response = client.get('/api/heatmap/points?page=1&page_size=10')

    assert response.status_code == 200
    body = response.get_json()
    assert body['total'] == 1
    assert body['count'] == 1
    assert body['items'][0]['incident_id'] == 11


def test_get_heatmap_points_skips_invalid_coordinates(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = [
        {
            'incident_id': 12,
            'incident_title': 'Bad point',
            'description': None,
            'incident_type': 'Wildlife',
            'created_at': datetime(2026, 4, 10, 9, 0),
            'location_name': 'Unknown',
            'sector': 'Zone C',
            'coordinates': 'bad-coordinate',
            'reporter_name': 'Chris',
        }
    ]

    with patch('app.routes.heatmap.get_db_connection', return_value=conn):
        response = client.get('/api/heatmap/points?page=1&page_size=10')

    assert response.status_code == 200
    body = response.get_json()
    assert body['total'] == 0
    assert body['count'] == 0
