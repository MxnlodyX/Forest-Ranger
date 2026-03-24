import pytest
from unittest.mock import patch, MagicMock
from app import create_app

@pytest.fixture
def client():
    app = create_app('testing')
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@patch('app.routes.human_resource.get_db_connection')
def test_get_staff(mock_get_db, client):
    # จำลองการเชื่อมต่อ Database
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    
    # จำลองข้อมูลพนักงาน
    mock_cursor.fetchall.return_value = [
        {
            "staff_id": 1, 
            "username": "tester01", 
            "full_name": "Test User", 
            "staff_role": "Field-Ops",
            "status": "Off Duty"
        }
    ]

    response = client.get('/api/staff')
    
    # ตรวจสอบผลลัพธ์
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['username'] == 'tester01'
    assert response.json[0]['full_name'] == 'Test User'