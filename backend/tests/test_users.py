import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as c:
        yield c


def test_users_endpoint_exists(client):
    """Endpoint ต้องมีอยู่และ return JSON (500 ok เมื่อไม่มี DB จริงในการ test)"""
    res = client.get('/api/users')
    assert res.status_code in (200, 500)
    assert res.content_type == 'application/json'


def test_backoffice_sign_in_endpoint_exists(client):
    """Endpoint ต้องมีอยู่และ return JSON (401/500 ได้ตามสภาพแวดล้อมการทดสอบ)"""
    res = client.post('/api/backoffice-portal/sign_in', json={'username': 'x', 'password': 'y'})
    assert res.status_code in (200, 401, 500)
    assert res.content_type == 'application/json'


def test_fieldops_sign_in_endpoint_exists(client):
    """Endpoint ต้องมีอยู่และ return JSON (401/500 ได้ตามสภาพแวดล้อมการทดสอบ)"""
    res = client.post('/api/fieldops-portal/sign_in', json={'username': 'x', 'password': 'y'})
    assert res.status_code in (200, 401, 500)
    assert res.content_type == 'application/json'
