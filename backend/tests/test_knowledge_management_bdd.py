"""
BDD Tests — Knowledge Resource Management (SR_012)
รูปแบบตาม test_report_management_bdd.py ของโปรเจกต์
"""
from unittest.mock import MagicMock, patch

import pytest
from pytest_bdd import given, scenarios, then, when

from app import create_app

scenarios('features/knowledge_management.feature')

pytestmark = [pytest.mark.knowledge, pytest.mark.bdd]


def _mock_conn_and_cursor():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


# ---------------------------------------------------------------------------
# Background
# ---------------------------------------------------------------------------

@given('เจ้าหน้าที่ Back-Office ได้ล็อกอินเข้าสู่ระบบแล้ว', target_fixture='client')
def authenticated_knowledge_client():
    app = create_app('testing')
    app.config['SECRET_KEY'] = 'test-secret'
    with app.test_client() as c:
        with c.session_transaction() as sess:
            sess['staff_id'] = 1
            sess['staff_role'] = 'Back-Office'
        yield c


# ---------------------------------------------------------------------------
# Scenario: สร้างสื่อความรู้ประเภทบทความสำเร็จ
# ---------------------------------------------------------------------------

@when('ส่งข้อมูลบทความใหม่ที่มีชื่อเรื่อง และหมวดหมู่ครบถ้วน', target_fixture='response')
def create_article(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.lastrowid = 5
    with patch('app.routes.knowledge_management.get_db_connection', return_value=conn):
        return client.post(
            '/api/knowledge',
            data={
                'title': 'ไฟป่าและการป้องกัน',
                'type': 'บทความ',
                'category': 'ภัยพิบัติ',
                'excerpt': 'สาเหตุและวิธีป้องกันไฟป่า',
                'readTime': '10 นาที',
                'content': '{"blocks":[]}',
                'videoUrl': '',
                'imageUrl': '',
            },
            content_type='multipart/form-data',
        )


@then('ระบบต้องบันทึกบทความและตอบกลับ 201')
def assert_article_created(response):
    assert response.status_code == 201
    assert response.get_json()['id'] == 5


# ---------------------------------------------------------------------------
# Scenario: สร้างสื่อโดยไม่ระบุชื่อเรื่อง
# ---------------------------------------------------------------------------

@when('ส่งข้อมูลที่ไม่มีชื่อเรื่อง', target_fixture='response')
def create_article_no_title(client):
    conn, cursor = _mock_conn_and_cursor()
    with patch('app.routes.knowledge_management.get_db_connection', return_value=conn):
        return client.post(
            '/api/knowledge',
            data={'type': 'บทความ', 'category': 'ระบบนิเวศ'},
            content_type='multipart/form-data',
        )


@then('ระบบต้องตอบกลับ 400 พร้อมข้อความแจ้งเตือน')
def assert_400_on_missing_title(response):
    assert response.status_code == 400
    assert response.get_json().get('error') is not None


# ---------------------------------------------------------------------------
# Scenario: อ่านรายการสื่อความรู้ทั้งหมด
# ---------------------------------------------------------------------------

@given('มีสื่อความรู้อยู่ในระบบ 2 รายการ', target_fixture='seeded_client')
def knowledge_client_with_data(client):
    return client


@when('ส่ง request GET /api/knowledge', target_fixture='response')
def get_knowledge_list(seeded_client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = [
        {'id': 1, 'title': 'บทความ 1', 'type': 'บทความ', 'category': 'ระบบนิเวศ',
         'excerpt': '', 'content': '{"blocks":[]}', 'readTime': '', 'image': '', 'videoUrl': '', 'date': None},
        {'id': 2, 'title': 'วิดีโอ 1', 'type': 'วิดีโอ', 'category': 'สัตว์ป่า',
         'excerpt': '', 'content': '{"blocks":[]}', 'readTime': '', 'image': '', 'videoUrl': '', 'date': None},
    ]
    with patch('app.routes.knowledge_management.get_db_connection', return_value=conn):
        return seeded_client.get('/api/knowledge')


@then('ระบบต้องตอบกลับรายการทั้ง 2 รายการ')
def assert_list_has_two(response):
    assert response.status_code == 200
    assert len(response.get_json()) == 2


# ---------------------------------------------------------------------------
# Scenario: แก้ไขสื่อความรู้ที่มีอยู่
# ---------------------------------------------------------------------------

@given('มีสื่อความรู้ที่มี id เท่ากับ 1', target_fixture='existing_client')
def knowledge_client_with_item(client):
    return client


@when('ส่งข้อมูลแก้ไขชื่อเรื่องใหม่', target_fixture='response')
def update_knowledge(existing_client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.rowcount = 1
    with patch('app.routes.knowledge_management.get_db_connection', return_value=conn):
        return existing_client.put(
            '/api/knowledge/1',
            data={
                'title': 'ชื่อที่อัปเดตแล้ว',
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


@then('ระบบต้องบันทึกการแก้ไขและตอบกลับ 200')
def assert_update_success(response):
    assert response.status_code == 200
    assert response.get_json()['message'] == 'updated'


# ---------------------------------------------------------------------------
# Scenario: ลบสื่อความรู้ที่มีอยู่
# ---------------------------------------------------------------------------

@when('ส่ง request DELETE /api/knowledge/1', target_fixture='response')
def delete_knowledge(existing_client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.rowcount = 1
    with patch('app.routes.knowledge_management.get_db_connection', return_value=conn):
        return existing_client.delete('/api/knowledge/1')


@then('ระบบต้องลบรายการและตอบกลับ 200')
def assert_delete_success(response):
    assert response.status_code == 200
    assert response.get_json()['message'] == 'deleted'


# ---------------------------------------------------------------------------
# Scenario: ลบสื่อความรู้ที่ไม่มีอยู่
# ---------------------------------------------------------------------------

@when('ส่ง request DELETE /api/knowledge/9999', target_fixture='response')
def delete_nonexistent(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.rowcount = 0
    with patch('app.routes.knowledge_management.get_db_connection', return_value=conn):
        return client.delete('/api/knowledge/9999')


@then('ระบบต้องตอบกลับ 404')
def assert_404(response):
    assert response.status_code == 404
