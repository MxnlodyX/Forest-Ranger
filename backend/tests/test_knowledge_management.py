"""
Unit Tests — Knowledge Resource API (SR_012)
รูปแบบตาม test_inventory.py ของโปรเจกต์
"""
import json
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest

from app import create_app


@pytest.fixture
def client():
    app = create_app('testing')
    app.config['TESTING'] = True
    with app.test_client() as c:
        with c.session_transaction() as sess:
            sess['staff_id'] = 1
            sess['staff_role'] = 'Back-Office'
        yield c


def _mock_db():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


# ---------------------------------------------------------------------------
# GET /api/knowledge
# ---------------------------------------------------------------------------

@patch('app.routes.knowledge_management.get_db_connection')
def test_get_knowledge_list_returns_200(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.fetchall.return_value = [
        {
            'id': 1,
            'title': 'บทความทดสอบ',
            'type': 'บทความ',
            'category': 'ระบบนิเวศ',
            'excerpt': 'ข้อความโปรย',
            'content': '{"blocks":[]}',
            'readTime': '5 นาที',
            'image': '',
            'videoUrl': '',
            'date': None,
        }
    ]

    res = client.get('/api/knowledge')

    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert data[0]['title'] == 'บทความทดสอบ'


@patch('app.routes.knowledge_management.get_db_connection')
def test_get_knowledge_list_empty(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.fetchall.return_value = []

    res = client.get('/api/knowledge')

    assert res.status_code == 200
    assert res.get_json() == []


# ---------------------------------------------------------------------------
# GET /api/knowledge/<id>
# ---------------------------------------------------------------------------

@patch('app.routes.knowledge_management.get_db_connection')
def test_get_knowledge_detail_returns_200(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.fetchone.return_value = {
        'id': 1,
        'title': 'บทความทดสอบ',
        'type': 'บทความ',
        'category': 'ระบบนิเวศ',
        'excerpt': '',
        'content': '{"blocks":[]}',
        'readTime': '5 นาที',
        'image': '',
        'videoUrl': '',
        'date': None,
    }

    res = client.get('/api/knowledge/1')

    assert res.status_code == 200
    assert res.get_json()['id'] == 1


@patch('app.routes.knowledge_management.get_db_connection')
def test_get_knowledge_detail_not_found(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.fetchone.return_value = None

    res = client.get('/api/knowledge/9999')

    assert res.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/knowledge  (multipart form)
# ---------------------------------------------------------------------------

@patch('app.routes.knowledge_management.get_db_connection')
def test_create_knowledge_success(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.lastrowid = 10

    res = client.post(
        '/api/knowledge',
        data={
            'title': 'บทความใหม่',
            'type': 'บทความ',
            'category': 'ระบบนิเวศ',
            'excerpt': 'ทดสอบ',
            'readTime': '3 นาที',
            'content': '{"blocks":[]}',
            'videoUrl': '',
            'imageUrl': '',
        },
        content_type='multipart/form-data',
    )

    assert res.status_code == 201
    assert res.get_json()['id'] == 10


@patch('app.routes.knowledge_management.get_db_connection')
def test_create_knowledge_missing_title(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn

    res = client.post(
        '/api/knowledge',
        data={'type': 'บทความ', 'category': 'ระบบนิเวศ'},
        content_type='multipart/form-data',
    )

    assert res.status_code == 400
    assert 'title' in res.get_json().get('error', '')


@patch('app.routes.knowledge_management.get_db_connection')
def test_create_knowledge_with_image(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.lastrowid = 11

    fake_image = (BytesIO(b'fake image content'), 'test.jpg')

    res = client.post(
        '/api/knowledge',
        data={
            'title': 'บทความมีรูป',
            'type': 'บทความ',
            'category': 'สัตว์ป่า',
            'excerpt': '',
            'readTime': '',
            'content': '{"blocks":[]}',
            'videoUrl': '',
            'image': fake_image,
        },
        content_type='multipart/form-data',
    )

    assert res.status_code == 201


# ---------------------------------------------------------------------------
# PUT /api/knowledge/<id>
# ---------------------------------------------------------------------------

@patch('app.routes.knowledge_management.get_db_connection')
def test_update_knowledge_success(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.rowcount = 1

    res = client.put(
        '/api/knowledge/1',
        data={
            'title': 'ชื่อที่แก้ไขแล้ว',
            'type': 'บทความ',
            'category': 'ระบบนิเวศ',
            'excerpt': '',
            'readTime': '',
            'content': '{"blocks":[]}',
            'videoUrl': '',
            'imageUrl': '',
        },
        content_type='multipart/form-data',
    )

    assert res.status_code == 200
    assert res.get_json()['message'] == 'updated'


@patch('app.routes.knowledge_management.get_db_connection')
def test_update_knowledge_not_found(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.rowcount = 0

    res = client.put(
        '/api/knowledge/9999',
        data={
            'title': 'ชื่อใหม่',
            'type': 'บทความ',
            'category': 'ระบบนิเวศ',
            'excerpt': '',
            'readTime': '',
            'content': '{"blocks":[]}',
            'videoUrl': '',
            'imageUrl': '',
        },
        content_type='multipart/form-data',
    )

    assert res.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /api/knowledge/<id>
# ---------------------------------------------------------------------------

@patch('app.routes.knowledge_management.get_db_connection')
def test_delete_knowledge_success(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.rowcount = 1

    res = client.delete('/api/knowledge/1')

    assert res.status_code == 200
    assert res.get_json()['message'] == 'deleted'


@patch('app.routes.knowledge_management.get_db_connection')
def test_delete_knowledge_not_found(mock_db, client):
    conn, cursor = _mock_db()
    mock_db.return_value = conn
    cursor.rowcount = 0

    res = client.delete('/api/knowledge/9999')

    assert res.status_code == 404


# ---------------------------------------------------------------------------
# Auth guard
# ---------------------------------------------------------------------------

def test_create_knowledge_requires_auth():
    """ผู้ใช้ที่ยังไม่ล็อกอินต้องได้รับ 401"""
    app = create_app('testing')
    with app.test_client() as anon:
        res = anon.post(
            '/api/knowledge',
            data={'title': 'test'},
            content_type='multipart/form-data',
        )
    assert res.status_code == 401
