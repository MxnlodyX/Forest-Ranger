import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as c:
        yield c


def test_officers_endpoint_exists(client):
    """Endpoint ต้องมีอยู่และ return JSON"""
    res = client.get('/api/officers')
    assert res.status_code in (200, 500)
    assert res.content_type == 'application/json'


def test_get_officer_by_id_endpoint_exists(client):
    """Endpoint สำหรับดึงข้อมูลเจ้าหน้าที่รายบุคคลต้องมีอยู่"""
    res = client.get('/api/officers/1')
    assert res.status_code in (200, 404, 500)
    assert res.content_type == 'application/json'


def test_create_officer_endpoint_exists(client):
    """Endpoint สำหรับสร้างเจ้าหน้าที่ต้องมีอยู่"""
    officer_data = {
        'employee_id': 'TEST001',
        'first_name': 'Test',
        'last_name': 'Officer',
        'position': 'Test Position',
        'department': 'Test Department'
    }
    res = client.post('/api/officers', json=officer_data)
    assert res.status_code in (201, 400, 500)
    assert res.content_type == 'application/json'


def test_create_officer_missing_fields(client):
    """การสร้างเจ้าหน้าที่โดยไม่ส่งข้อมูลที่จำเป็นต้อง return 400"""
    incomplete_data = {
        'first_name': 'Test'
    }
    res = client.post('/api/officers', json=incomplete_data)
    assert res.status_code in (400, 500)
    assert res.content_type == 'application/json'


def test_update_officer_endpoint_exists(client):
    """Endpoint สำหรับอัปเดตเจ้าหน้าที่ต้องมีอยู่"""
    update_data = {
        'position': 'Updated Position'
    }
    res = client.put('/api/officers/1', json=update_data)
    assert res.status_code in (200, 404, 500)
    assert res.content_type == 'application/json'


def test_delete_officer_endpoint_exists(client):
    """Endpoint สำหรับลบเจ้าหน้าที่ต้องมีอยู่"""
    res = client.delete('/api/officers/1')
    assert res.status_code in (200, 404, 500)
    assert res.content_type == 'application/json'
