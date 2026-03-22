from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
from pytest_bdd import given, scenarios, then, when

from app import create_app


scenarios("features/report_management.feature")

pytestmark = [pytest.mark.report, pytest.mark.bdd]


def _mock_conn_and_cursor():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


@given("ผู้ควบคุมกำลังพลอยู่ในหน้า มอบหมายภารกิจ", target_fixture="client")
def authenticated_report_client():
    app = create_app("testing")
    app.config["SECRET_KEY"] = "test-secret"

    with app.test_client() as test_client:
        with test_client.session_transaction() as session:
            session["staff_id"] = 1
            session["staff_role"] = "Back-Office"
        yield test_client


@when("เลือกรายชื่อเจ้าหน้าที่ และระบุภารกิจ แล้วกด Assign", target_fixture="response")
def assign_task_to_staff(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.lastrowid = 30
    cursor.fetchone.return_value = {
        "task_id": 30,
        "task_title": "ลาดตระเวนโซน A",
        "objective": "ตรวจสอบพื้นที่เสี่ยง",
        "description": "เดินลาดตระเวนตามจุดตรวจ",
        "destination": "โซน A",
        "assigned_to": 7,
        "assignee_name": "Ranger One",
        "location_id": 4,
        "location_name": "Sector A",
        "location_sector": "A",
        "location_coordinates": "14.00,100.00",
        "priority": "High",
        "status": "Todo",
        "eta": None,
        "assigned_date": "2026-03-22",
        "created_at": datetime(2026, 3, 22, 10, 0),
        "updated_at": datetime(2026, 3, 22, 10, 0),
    }

    with patch("app.routes.task.get_db_connection", return_value=conn):
        return client.post(
            "/api/tasks",
            json={
                "task_title": "ลาดตระเวนโซน A",
                "objective": "ตรวจสอบพื้นที่เสี่ยง",
                "description": "เดินลาดตระเวนตามจุดตรวจ",
                "destination": "โซน A",
                "assigned_to": 7,
                "location_id": 4,
                "priority": "High",
                "status": "Todo",
                "assigned_date": "2026-03-22",
            },
        )


@then("ระบบต้องบันทึกภารกิจที่มอบหมายให้เจ้าหน้าที่คนนั้น")
def assert_assignment_saved(response):
    assert response.status_code == 201
    body = response.get_json()
    assert body["task_id"] == 30
    assert body["assigned_to"] == 7



