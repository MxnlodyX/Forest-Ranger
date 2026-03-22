from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from app import create_app
from app.routes.report_management import _serialize_row


pytestmark = [pytest.mark.report]


@pytest.fixture
def client():
    app = create_app("testing")
    app.config["SECRET_KEY"] = "test-secret"
    with app.test_client() as test_client:
        with test_client.session_transaction() as session:
            session["staff_id"] = 1
            session["staff_role"] = "Back-Office"
        yield test_client


def _mock_conn_and_cursor():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = cursor
    return conn, cursor


def test_serialize_row_converts_datetime_and_sets_image_urls():
    row = {
        "incident_id": 1,
        "created_at": datetime(2026, 1, 1, 10, 30),
        "incident_title": "Fire",
    }

    result = _serialize_row(row)

    assert result["created_at"] == "2026-01-01T10:30:00"
    assert result["image_urls"] == []


def test_get_reports_success(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.side_effect = [
        [
            {
                "incident_id": 10,
                "incident_title": "Fence Damage",
                "description": None,
                "incident_type": "Damage",
                "location_id": 4,
                "location_name": "Sector A",
                "reported_by": 1,
                "reporter_name": "Alice",
                "created_at": datetime(2026, 2, 1, 9, 0),
                "updated_at": datetime(2026, 2, 1, 9, 10),
            }
        ],
        [{"incident_id": 10, "image_url": "/static/uploads/1.jpg"}],
    ]

    with patch("app.routes.report_management.get_db_connection", return_value=conn):
        response = client.get("/api/reports")

    assert response.status_code == 200
    body = response.get_json()
    assert body[0]["incident_id"] == 10
    assert body[0]["image_urls"] == ["/static/uploads/1.jpg"]


def test_get_reports_supports_reported_by_filter(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.side_effect = [[], []]

    with patch("app.routes.report_management.get_db_connection", return_value=conn):
        response = client.get("/api/reports?reported_by=7")

    assert response.status_code == 200
    query, params = cursor.execute.call_args_list[0].args
    assert "WHERE ir.reported_by = %s" in query
    assert params == [7]


def test_create_report_validates_required_title(client):
    response = client.post(
        "/api/reports",
        json={"incident_type": "Fire"},
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "incident_title is required"


def test_create_report_rejects_non_array_image_urls(client):
    response = client.post(
        "/api/reports",
        json={
            "incident_title": "Fire",
            "incident_type": "Fire",
            "image_urls": "not-a-list",
        },
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "image_urls must be an array"


def test_create_report_success(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.lastrowid = 20
    cursor.fetchone.return_value = {
        "incident_id": 20,
        "incident_title": "Fire",
        "description": "Small fire",
        "incident_type": "Emergency",
        "location_id": 1,
        "location_name": "Watchtower",
        "reported_by": 1,
        "reporter_name": "Alice",
        "created_at": datetime(2026, 3, 1, 12, 0),
        "updated_at": datetime(2026, 3, 1, 12, 0),
    }
    cursor.fetchall.return_value = [{"incident_id": 20, "image_url": "/static/uploads/f1.jpg"}]

    with patch("app.routes.report_management.get_db_connection", return_value=conn):
        response = client.post(
            "/api/reports",
            json={
                "incident_title": "Fire",
                "description": "Small fire",
                "incident_type": "Emergency",
                "location_id": 1,
                "reported_by": 1,
                "image_urls": ["/static/uploads/f1.jpg"],
            },
        )

    assert response.status_code == 201
    body = response.get_json()
    assert body["incident_id"] == 20
    assert body["image_urls"] == ["/static/uploads/f1.jpg"]


def test_update_report_requires_valid_payload(client):
    response = client.put("/api/reports/2", json={})

    assert response.status_code == 400
    assert response.get_json()["error"] == "No valid fields to update"


def test_update_report_returns_404_when_not_found(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchone.return_value = None

    with patch("app.routes.report_management.get_db_connection", return_value=conn):
        response = client.put("/api/reports/999", json={"incident_title": "Updated"})

    assert response.status_code == 404
    assert response.get_json()["error"] == "Report not found"


def test_delete_report_returns_success(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.rowcount = 1

    with patch("app.routes.report_management.get_db_connection", return_value=conn):
        response = client.delete("/api/reports/3")

    assert response.status_code == 200
    assert response.get_json()["message"] == "Report deleted successfully"
