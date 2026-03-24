from unittest.mock import MagicMock, patch
from datetime import date, datetime

import pytest

from app import create_app


pytestmark = [pytest.mark.task]


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def backoffice_client():
    """Client authenticated as Back-Office staff."""
    app = create_app("testing")
    app.config["SECRET_KEY"] = "test-secret"
    with app.test_client() as c:
        with c.session_transaction() as sess:
            sess["staff_id"] = 1
            sess["staff_role"] = "Back-Office"
        yield c


@pytest.fixture
def fieldops_client():
    """Client authenticated as Field-Ops staff."""
    app = create_app("testing")
    app.config["SECRET_KEY"] = "test-secret"
    with app.test_client() as c:
        with c.session_transaction() as sess:
            sess["staff_id"] = 2
            sess["staff_role"] = "Field-Ops"
        yield c


@pytest.fixture
def anon_client():
    """Unauthenticated client."""
    app = create_app("testing")
    app.config["SECRET_KEY"] = "test-secret"
    with app.test_client() as c:
        yield c


def _mock_conn_and_cursor():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


SAMPLE_TASK_ROW = {
    "task_id": 1,
    "task_title": "Patrol checkpoint 04",
    "objective": "Check fence",
    "description": "Full sweep",
    "destination": "Northern Gate",
    "assigned_to": 2,
    "assignee_name": "Narin Kittisak",
    "location_id": 1,
    "location_name": "Haew Suwat Waterfall Patrol Point",
    "location_sector": "Khao Yai - Central Zone",
    "location_coordinates": "14.540700, 101.373600",
    "priority": "High",
    "status": "Todo",
    "eta": "2h 30m",
    "assigned_date": date(2026, 3, 19),
    "created_at": datetime(2026, 3, 19, 8, 0, 0),
    "updated_at": datetime(2026, 3, 19, 8, 0, 0),
}


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH GUARD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestTaskAuthGuard:

    def test_unauthenticated_get_tasks_returns_401(self, anon_client):
        resp = anon_client.get("/api/tasks")
        assert resp.status_code == 401

    def test_fieldops_cannot_get_all_tasks(self, fieldops_client):
        resp = fieldops_client.get("/api/tasks")
        assert resp.status_code == 403

    def test_fieldops_cannot_create_task(self, fieldops_client):
        resp = fieldops_client.post("/api/tasks", json={"task_title": "x"})
        assert resp.status_code == 403

    def test_fieldops_cannot_delete_task(self, fieldops_client):
        resp = fieldops_client.delete("/api/tasks/1")
        assert resp.status_code == 403

    def test_unauthenticated_cannot_update_task(self, anon_client):
        resp = anon_client.put("/api/tasks/1", json={"status": "Done"})
        assert resp.status_code == 401

    def test_fieldops_can_access_assigned_tasks(self, fieldops_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.fetchall.return_value = []
        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = fieldops_client.get("/api/tasks/assigned/2")
        assert resp.status_code == 200

    def test_fieldops_can_update_task(self, fieldops_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.rowcount = 1
        cursor.fetchone.return_value = {**SAMPLE_TASK_ROW, "status": "Done"}
        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = fieldops_client.put("/api/tasks/1", json={"status": "Done"})
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# GET /api/tasks
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetTasks:

    def test_returns_list_of_tasks(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.fetchall.return_value = [SAMPLE_TASK_ROW]

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.get("/api/tasks")

        assert resp.status_code == 200
        body = resp.get_json()
        assert isinstance(body, list)
        assert len(body) == 1
        assert body[0]["task_id"] == 1
        assert body[0]["task_title"] == "Patrol checkpoint 04"
        conn.close.assert_called_once()

    def test_serializes_dates_as_iso(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.fetchall.return_value = [SAMPLE_TASK_ROW]

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.get("/api/tasks")

        body = resp.get_json()
        assert body[0]["assigned_date"] == "2026-03-19"
        assert "T" in body[0]["created_at"]

    def test_returns_empty_list_when_no_tasks(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.fetchall.return_value = []

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.get("/api/tasks")

        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_returns_500_on_db_error(self, backoffice_client):
        with patch("app.routes.task.get_db_connection", side_effect=Exception("db down")):
            resp = backoffice_client.get("/api/tasks")

        assert resp.status_code == 500
        assert "error" in resp.get_json()


# ═══════════════════════════════════════════════════════════════════════════════
# GET /api/tasks/assigned/<staff_id>
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetAssignedTasks:

    def test_returns_tasks_for_staff(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.fetchall.return_value = [SAMPLE_TASK_ROW]

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.get("/api/tasks/assigned/2")

        assert resp.status_code == 200
        body = resp.get_json()
        assert len(body) == 1
        assert body[0]["assigned_to"] == 2

    def test_returns_empty_for_unassigned_staff(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.fetchall.return_value = []

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.get("/api/tasks/assigned/999")

        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_returns_500_on_db_error(self, backoffice_client):
        with patch("app.routes.task.get_db_connection", side_effect=Exception("db down")):
            resp = backoffice_client.get("/api/tasks/assigned/2")

        assert resp.status_code == 500


# ═══════════════════════════════════════════════════════════════════════════════
# POST /api/tasks
# ═══════════════════════════════════════════════════════════════════════════════

class TestCreateTask:

    def test_create_task_success(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.lastrowid = 10
        cursor.fetchone.return_value = {
            **SAMPLE_TASK_ROW,
            "task_id": 10,
        }

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.post("/api/tasks", json={
                "task_title": "Patrol checkpoint 04",
                "objective": "Check fence",
                "priority": "High",
                "status": "Todo",
                "assigned_date": "2026-03-19",
            })

        assert resp.status_code == 201
        body = resp.get_json()
        assert body["task_id"] == 10
        conn.commit.assert_called_once()
        conn.close.assert_called_once()

    def test_create_task_minimal_fields(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.lastrowid = 11
        cursor.fetchone.return_value = {
            **SAMPLE_TASK_ROW,
            "task_id": 11,
            "objective": None,
            "destination": None,
        }

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.post("/api/tasks", json={
                "task_title": "Quick patrol",
            })

        assert resp.status_code == 201

    def test_create_task_missing_title_returns_400(self, backoffice_client):
        resp = backoffice_client.post("/api/tasks", json={})
        assert resp.status_code == 400
        assert "task_title" in resp.get_json()["error"]

    def test_create_task_blank_title_returns_400(self, backoffice_client):
        resp = backoffice_client.post("/api/tasks", json={"task_title": "   "})
        assert resp.status_code == 400

    def test_create_task_invalid_priority_returns_400(self, backoffice_client):
        resp = backoffice_client.post("/api/tasks", json={
            "task_title": "Test",
            "priority": "Urgent",
        })
        assert resp.status_code == 400
        assert "priority" in resp.get_json()["error"]

    def test_create_task_invalid_status_returns_400(self, backoffice_client):
        resp = backoffice_client.post("/api/tasks", json={
            "task_title": "Test",
            "status": "Cancelled",
        })
        assert resp.status_code == 400
        assert "status" in resp.get_json()["error"]

    def test_create_task_db_error_returns_500(self, backoffice_client):
        with patch("app.routes.task.get_db_connection", side_effect=Exception("db")):
            resp = backoffice_client.post("/api/tasks", json={
                "task_title": "Test",
            })
        assert resp.status_code == 500


# ═══════════════════════════════════════════════════════════════════════════════
# PUT /api/tasks/<task_id>
# ═══════════════════════════════════════════════════════════════════════════════

class TestUpdateTask:

    def test_update_single_field(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.rowcount = 1
        cursor.fetchone.return_value = {**SAMPLE_TASK_ROW, "status": "In Progress"}

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.put("/api/tasks/1", json={"status": "In Progress"})

        assert resp.status_code == 200
        assert resp.get_json()["status"] == "In Progress"
        conn.commit.assert_called_once()

    def test_update_multiple_fields(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.rowcount = 1
        updated = {**SAMPLE_TASK_ROW, "priority": "Low", "eta": "1h"}
        cursor.fetchone.return_value = updated

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.put("/api/tasks/1", json={
                "priority": "Low",
                "eta": "1h",
            })

        assert resp.status_code == 200
        body = resp.get_json()
        assert body["priority"] == "Low"
        assert body["eta"] == "1h"

    def test_update_empty_string_sets_null(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.rowcount = 1
        cursor.fetchone.return_value = {**SAMPLE_TASK_ROW, "destination": None}

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.put("/api/tasks/1", json={"destination": ""})

        assert resp.status_code == 200
        # Verify the SQL param was None not empty string
        execute_calls = cursor.execute.call_args_list
        update_call_args = execute_calls[0].args[1]
        assert None in update_call_args

    def test_update_no_fields_returns_400(self, backoffice_client):
        resp = backoffice_client.put("/api/tasks/1", json={})
        assert resp.status_code == 400
        assert "No valid fields" in resp.get_json()["error"]

    def test_update_invalid_priority_returns_400(self, backoffice_client):
        resp = backoffice_client.put("/api/tasks/1", json={"priority": "Urgent"})
        assert resp.status_code == 400

    def test_update_invalid_status_returns_400(self, backoffice_client):
        resp = backoffice_client.put("/api/tasks/1", json={"status": "Cancelled"})
        assert resp.status_code == 400

    def test_update_nonexistent_task_returns_404(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.rowcount = 0

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.put("/api/tasks/999", json={"status": "Done"})

        assert resp.status_code == 404
        assert "not found" in resp.get_json()["error"].lower()

    def test_update_db_error_returns_500(self, backoffice_client):
        with patch("app.routes.task.get_db_connection", side_effect=Exception("db")):
            resp = backoffice_client.put("/api/tasks/1", json={"status": "Done"})
        assert resp.status_code == 500

    def test_ignored_fields_are_rejected(self, backoffice_client):
        """Sending only unknown fields should return 400."""
        resp = backoffice_client.put("/api/tasks/1", json={"hacker": "drop table"})
        assert resp.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# DELETE /api/tasks/<task_id>
# ═══════════════════════════════════════════════════════════════════════════════

class TestDeleteTask:

    def test_delete_task_success(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.rowcount = 1

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.delete("/api/tasks/1")

        assert resp.status_code == 200
        assert "deleted" in resp.get_json()["message"].lower()
        conn.commit.assert_called_once()
        conn.close.assert_called_once()

    def test_delete_nonexistent_task_returns_404(self, backoffice_client):
        conn, cursor = _mock_conn_and_cursor()
        cursor.rowcount = 0

        with patch("app.routes.task.get_db_connection", return_value=conn):
            resp = backoffice_client.delete("/api/tasks/999")

        assert resp.status_code == 404

    def test_delete_db_error_returns_500(self, backoffice_client):
        with patch("app.routes.task.get_db_connection", side_effect=Exception("db")):
            resp = backoffice_client.delete("/api/tasks/1")
        assert resp.status_code == 500
