import pytest
from unittest.mock import patch, MagicMock
from app import create_app

# สร้างตัวจำลอง Server สำหรับเทส (Test Client)
@pytest.fixture
def client():
    app = create_app('testing')
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

# เทส GET /api/inventory
@patch('app.routes.inventory.get_db_connection') # จำลอง Database
def test_get_inventory(mock_get_db, client):
    # จำลองค่าที่จะได้จาก Database
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    
    # จำลองข้อมูลอุปกรณ์ 1 ชิ้น
    mock_cursor.fetchall.return_value = [
        {
            "id": 1, 
            "assetId": "MASK-999", 
            "name": "N95 Test", 
            "category": "PPE", 
            "status": "Available", 
            "assignee": None, 
            "notes": ""
        }
    ]

    # ยิง API สั่ง GET ข้อมูล
    response = client.get('/api/inventory')
    
    # ตรวจสอบผลลัพธ์ว่าถูกต้องไหม
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['assetId'] == 'MASK-999'

# เทส POST /api/inventory
@patch('app.routes.inventory.get_db_connection')
def test_add_inventory(mock_get_db, client):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_db.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    # ข้อมูลจำลองที่ React จะส่งมา
    new_item = {
        "assetId": "TEST-001",
        "name": "Test Item",
        "category": "Tools",
        "status": "Available",
        "notes": "Testing"
    }

    # ยิง API สั่ง POST ข้อมูล
    response = client.post('/api/inventory', json=new_item)
    
    # ตรวจสอบว่า API ตอบกลับว่าสำเร็จ (201 Created)
    assert response.status_code == 201
    assert response.json['message'] == 'Item added successfully!'
    # ตรวจสอบว่ามีการสั่ง execute ลง Database จริง
    assert mock_cursor.execute.called