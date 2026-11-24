"""Shared fixtures for the cross-service integration suite."""

import os
import time
import uuid
from datetime import date, datetime

import pytest
import requests

DEFAULT_URLS = {
    "user": "http://localhost:8083",
    "flight": "http://localhost:8081",
    "package": "http://localhost:8082",
    "excursion": "http://localhost:8084",
    "reservation": "http://localhost:8085",
    "payment": "http://localhost:8086",
    "frontend": "http://localhost:4200",
}

READY_PATHS = {
    "user": "/health",
    "flight": "/health",
    "package": "/api/packages?page=1&size=1",
    "excursion": "/health",
    "reservation": "/health",
    "payment": "/health",
    "frontend": "/",
}

RESOURCES = {
    "FLIGHT": ("flight", "flights"),
    "PACKAGE": ("package", "packages"),
    "EXCURSION": ("excursion", "excursions"),
}

TIMEOUT = float(os.getenv("INTEGRATION_TIMEOUT", "10"))
ADMIN_EMAIL = os.getenv("INTEGRATION_ADMIN_EMAIL", "admin@agency.travel")
ADMIN_PASSWORD = os.getenv("INTEGRATION_ADMIN_PASSWORD", "Password123!")
CLIENT_PASSWORD = os.getenv("INTEGRATION_CLIENT_PASSWORD", "Password123!")


class Service:
    def __init__(self, name, base_url, session):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.session = session

    def request(self, method, path, token=None, **kwargs):
        headers = dict(kwargs.pop("headers", None) or {})
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return self.session.request(
            method,
            f"{self.base_url}{path}",
            headers=headers,
            timeout=TIMEOUT,
            **kwargs,
        )

    def get(self, path, token=None, **kwargs):
        return self.request("GET", path, token=token, **kwargs)

    def post(self, path, token=None, **kwargs):
        return self.request("POST", path, token=token, **kwargs)

    def patch(self, path, token=None, **kwargs):
        return self.request("PATCH", path, token=token, **kwargs)

    def delete(self, path, token=None, **kwargs):
        return self.request("DELETE", path, token=token, **kwargs)


def _probe(url, path):
    try:
        response = requests.get(f"{url}{path}", timeout=3)
    except requests.RequestException:
        return False
    return response.status_code < 500


def _register_client(api):
    email = f"it-{uuid.uuid4().hex}@agency.travel"
    response = api["user"].post(
        "/api/auth/register",
        json={"email": email, "password": CLIENT_PASSWORD},
    )
    assert response.status_code == 201, response.text
    payload = response.json()["data"]
    return {
        "email": email,
        "password": CLIENT_PASSWORD,
        "token": payload["jeton"],
        "user": payload["user"],
    }


def _login(api, email, password):
    response = api["user"].post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    payload = response.json()["data"]
    return {"email": email, "password": password, "token": payload["jeton"], "user": payload["user"]}


def _date_of(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _status_of(api, token, reservation_id):
    response = api["reservation"].get(f"/api/reservations/{reservation_id}", token=token)
    if response.status_code != 200:
        return None
    return response.json()["data"]["status"]


def _cleanup(api, admin_token, tracked):
    for reservation_id, owner_token in tracked:
        status = _status_of(api, owner_token, reservation_id)
        if status in ("PAID", "CANCELLED"):
            api["payment"].post(
                f"/api/reservations/{reservation_id}/refund",
                token=admin_token,
                json={},
            )
        elif status in ("PENDING", "CONFIRMED"):
            api["reservation"].post(
                f"/api/reservations/{reservation_id}/cancellation",
                token=owner_token,
                json={"reason": "integration cleanup"},
            )


@pytest.fixture(scope="session")
def api():
    urls = {
        name: os.getenv(f"INTEGRATION_{name.upper()}_URL", default)
        for name, default in DEFAULT_URLS.items()
    }
    missing = [name for name, url in urls.items() if not _probe(url, READY_PATHS[name])]

    if missing and os.getenv("INTEGRATION_REQUIRED") == "1":
        pytest.fail(
            "Services not reachable: "
            + ", ".join(f"{name} ({urls[name]})" for name in missing)
            + ". Start the stack with: docker compose up -d --build"
        )

    if missing:
        pytest.skip(
            "Integration stack not reachable ("
            + ", ".join(missing)
            + "). Start it with: docker compose up -d --build"
        )

    session = requests.Session()
    services = {name: Service(name, url, session) for name, url in urls.items()}
    yield services
    session.close()


@pytest.fixture(scope="session")
def admin(api):
    return _login(api, ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture
def client(api):
    return _register_client(api)


@pytest.fixture
def other_client(api):
    return _register_client(api)


@pytest.fixture
def availability(api):
    def _availability(item_type, item_id):
        service, resource = RESOURCES[item_type]
        response = api[service].get(f"/api/{resource}/{item_id}/availability")
        assert response.status_code == 200, response.text
        return response.json()["data"]["availableSeats"]

    return _availability


@pytest.fixture
def flight(api):
    response = api["flight"].get("/api/flights")
    assert response.status_code == 200, response.text
    today = date.today()
    rows = [
        row
        for row in response.json()["data"]
        if row.get("active")
        and int(row.get("availableSeats") or 0) >= 3
        and (_date_of(row.get("departureTime")) or today) >= today
    ]
    if not rows:
        pytest.skip("No future, active flight with enough seats is seeded.")
    return sorted(rows, key=lambda row: row["id"])[0]


@pytest.fixture
def excursion(api):
    response = api["excursion"].get("/api/excursions")
    assert response.status_code == 200, response.text
    today = date.today()
    rows = [
        row
        for row in response.json()["data"]
        if row.get("available")
        and int(row.get("availableSeats") or 0) >= 3
        and (_date_of(row.get("date")) or today) >= today
    ]
    if not rows:
        pytest.skip("No future, active excursion with enough seats is seeded.")
    return sorted(rows, key=lambda row: row["id"])[0]


@pytest.fixture
def package(api):
    response = api["package"].get("/api/packages", params={"page": 1, "size": 100})
    assert response.status_code == 200, response.text
    rows = response.json()["data"]["data"]
    today = date.today()

    for row in sorted(rows, key=lambda item: item["id"]):
        if not row.get("active") or not row.get("available"):
            continue
        if (_date_of(row.get("startDate")) or today) < today:
            continue
        availability_response = api["package"].get(f"/api/packages/{row['id']}/availability")
        assert availability_response.status_code == 200, availability_response.text
        seats = availability_response.json()["data"]["availableSeats"]
        if seats is not None and seats < 3:
            continue
        return row

    pytest.skip("No bookable package is seeded.")


@pytest.fixture
def book(api, admin):
    tracked = []

    def _book(token, item_type, item_id, quantity=1):
        response = api["reservation"].post(
            "/api/reservations",
            token=token,
            json={"typeItem": item_type, "itemId": item_id, "quantity": quantity},
        )
        assert response.status_code == 201, response.text
        reservation = response.json()["data"]
        tracked.append((reservation["id"], token))
        return reservation

    yield _book

    _cleanup(api, admin["token"], tracked)
