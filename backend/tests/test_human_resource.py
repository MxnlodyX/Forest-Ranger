import io
from unittest.mock import MagicMock, patch

import pymysql
import pytest

from app import create_app
from app.routes.human_resource import _is_allowed_image, _normalize_staff_role


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


def test_normalize_staff_role_aliases():
    assert _normalize_staff_role("backoffice") == "Back-Office"
    assert _normalize_staff_role("Field-Ops") == "Field-Ops"
    assert _normalize_staff_role("") == ""


def test_is_allowed_image_checks_extension():
    assert _is_allowed_image("photo.JPG") is True
    assert _is_allowed_image("avatar.webp") is True
    assert _is_allowed_image("script.exe") is False


def test_get_staff_list_success(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.fetchall.return_value = [{"staff_id": 1, "username": "alice"}]

    with patch("app.routes.human_resource.get_db_connection", return_value=conn):
        response = client.get("/api/staff")

    assert response.status_code == 200
    assert response.get_json() == [{"staff_id": 1, "username": "alice"}]
    conn.close.assert_called_once()


def test_add_new_staff_validates_required_fields(client):
    response = client.post("/api/add_new_staff", json={"username": "alice"})

    assert response.status_code == 400
    assert "required" in response.get_json()["error"]


def test_add_new_staff_success(client):
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
        response = client.post(
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

    assert response.status_code == 201
    body = response.get_json()
    assert body["message"] == "New staff added successfully!"
    assert body["staff"]["staff_id"] == 11

    insert_query, insert_params = cursor.execute.call_args_list[0].args
    assert "INSERT INTO staff" in insert_query
    assert insert_params[5] == "Back-Office"


def test_add_new_staff_duplicate_username_returns_409(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.execute.side_effect = pymysql.err.IntegrityError()

    with patch("app.routes.human_resource.get_db_connection", return_value=conn):
        response = client.post(
            "/api/add_new_staff",
            json={
                "username": "alice",
                "password": "secret",
                "full_name": "Alice Doe",
                "contact_number": "0999999999",
                "title_role": "Officer",
                "staff_role": "Back-Office",
                "status": "Active",
            },
        )

    assert response.status_code == 409
    assert response.get_json()["error"] == "username already exists"


def test_edit_staff_rejects_non_integer_staff_id(client):
    response = client.put(
        "/api/edit_staff",
        json={
            "staff_id": "not-number",
            "username": "alice",
            "full_name": "Alice Doe",
            "contact_number": "0999999999",
            "title_role": "Officer",
            "staff_role": "Back-Office",
            "status": "Active",
        },
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "staff_id must be an integer"


def test_delete_staff_not_found_returns_404(client):
    conn, cursor = _mock_conn_and_cursor()
    cursor.rowcount = 0

    with patch("app.routes.human_resource.get_db_connection", return_value=conn):
        response = client.delete("/api/delete_staff/999")

    assert response.status_code == 404
    assert response.get_json()["error"] == "staff not found"


def test_upload_profile_image_rejects_invalid_extension(client):
    data = {"image": (io.BytesIO(b"abc"), "bad.txt")}

    response = client.post(
        "/api/upload_profile_image",
        data=data,
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "only png, jpg, jpeg, webp are allowed"
