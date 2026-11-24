"""INT-STACK-001: service readiness, envelopes and edge routing."""

import os

import pytest

HEALTHY = ("user", "flight", "excursion", "reservation", "payment")


@pytest.mark.parametrize("service", HEALTHY)
def test_health_endpoint(api, service):
    response = api[service].get("/health")
    assert response.status_code == 200, response.text
    body = response.json()
    data = body.get("data", body)
    assert data.get("status") == "ok"
    if service != "user":
        assert data.get("service")


def test_package_service_ready(api):
    response = api["package"].get("/api/packages", params={"page": 1, "size": 1})
    assert response.status_code == 200, response.text
    body = response.json()["data"]
    assert body["page"] == 1
    assert isinstance(body["data"], list)


def test_frontend_is_served(api):
    response = api["frontend"].get("/")
    assert response.status_code == 200
    assert "kz-root" in response.text
    assert response.headers.get("X-Frame-Options") == "DENY"


def test_frontend_origin_is_allowed(api):
    origin = os.getenv("INTEGRATION_FRONTEND_ORIGIN", "http://localhost:4200")
    response = api["reservation"].request(
        "OPTIONS",
        "/api/reservations",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code in (200, 204)
    allowed = response.headers.get("Access-Control-Allow-Origin")
    assert allowed in (origin, "*")


@pytest.mark.parametrize("service", ("reservation", "payment", "flight"))
def test_unknown_route_uses_error_envelope(api, service):
    response = api[service].get("/api/this-route-does-not-exist")
    assert response.status_code == 404
    error = response.json()["error"]
    assert error["code"] == "NOT_FOUND"
    assert error["message"]
