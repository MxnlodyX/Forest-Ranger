from unittest.mock import MagicMock, patch

import pytest
from pytest_bdd import given, parsers, scenarios, then, when

from app import create_app


scenarios("features/human_resource.feature")

pytestmark = [pytest.mark.hrm, pytest.mark.bdd]


def _mock_conn_and_cursor():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


@given("ผู้ดูแลระบบอยู่ที่หน้า จัดการข้อมูลเจ้าหน้าที่", target_fixture="client")
def authenticated_client():
    app = create_app("testing")
    app.config["SECRET_KEY"] = "test-secret"

    with app.test_client() as test_client:
        with test_client.session_transaction() as session:
            session["staff_id"] = 1
            session["staff_role"] = "Back-Office"
        yield test_client


@when("กรอกข้อมูลเจ้าหน้าที่ครบถ้วนแล้วกดบันทึก", target_fixture="response")
def submit_valid_new_staff_payload(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.lastrowid = 11
    cursor.fetchone.return_value = {
        "staff_id": 11,
        "username": "alice",
        "full_name": "Alice Doe",
        "contact_number": "0999999999",
        "title_role": "Officer",
        "staff_role": "Back-Office",
        "area": "North",
        "status": "Active",
        "profile_image": None,
    }

    with patch("app.routes.human_resource.get_db_connection", return_value=conn):
        return client.post(
            "/api/add_new_staff",
            json={
                "username": "alice",
                "password": "secret",
                "full_name": "Alice Doe",
                "contact_number": "0999999999",
                "title_role": "Officer",
                "staff_role": "backoffice",
                "area": "North",
                "status": "Active",
            },
        )


@then("ระบบต้องบันทึกข้อมูลลงฐานข้อมูล")
def assert_saved_to_database(response):
    assert response.status_code == 201
    body = response.get_json()
    assert body["message"] == "New staff added successfully!"
    assert body["staff"]["staff_id"] == 11


@then("ระบบต้องส่งข้อมูลเจ้าหน้าที่ใหม่กลับมาเพื่อแสดงในตารางทันที")
def assert_new_staff_payload_returned(response):
    body = response.get_json()
    assert body["staff"]["username"] == "alice"
    assert body["staff"]["full_name"] == "Alice Doe"
