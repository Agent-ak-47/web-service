"""INT-SEC-001: authentication, authorisation and internal stock contract."""

import pytest


def _error(response):
    return response.json()["error"]


@pytest.mark.parametrize(
    "service,method,path,payload",
    (
        ("reservation", "POST", "/api/reservations", {"typeItem": "FLIGHT", "itemId": 1, "quantity": 1}),
        ("payment", "POST", "/api/reservations/1/payment", {"method": "CARD"}),
        ("reservation", "GET", "/api/reservations", None),
    ),
)
def test_booking_endpoints_require_authentication(api, service, method, path, payload):
    response = api[service].request(method, path, json=payload)
    assert response.status_code == 401
    assert _error(response)["code"] == "UNAUTHENTICATED"


def test_client_cannot_refund(api, client, flight, book):
    reservation = book(client["token"], "FLIGHT", flight["id"], 1)
    response = api["payment"].post(
        f"/api/reservations/{reservation['id']}/refund",
        token=client["token"],
        json={},
    )
    assert response.status_code == 403
    assert _error(response)["code"] == "FORBIDDEN"


def test_client_cannot_manage_flight_catalogue(api, client):
    response = api["flight"].post("/api/flights", token=client["token"], json={})
    assert response.status_code == 403
    assert _error(response)["code"] == "FORBIDDEN"


def test_client_cannot_manage_package_catalogue(api, client):
    response = api["package"].post("/api/packages", token=client["token"], json={})
    assert response.status_code == 403
    assert _error(response)["code"] == "FORBIDDEN"


def test_internal_stock_contract_reserves_and_releases(api, flight, availability):
    before = availability("FLIGHT", flight["id"])
    reserved = api["flight"].post(
        f"/api/internal/flights/{flight['id']}/reserve",
        json={"quantity": 1, "reservationId": 999999},
    )
    assert reserved.status_code == 200, reserved.text
    assert availability("FLIGHT", flight["id"]) == before - 1

    released = api["flight"].post(
        f"/api/internal/flights/{flight['id']}/release",
        json={"quantity": 1, "reservationId": 999999},
    )
    assert released.status_code == 200, released.text
    assert availability("FLIGHT", flight["id"]) == before


def test_internal_stock_contract_rejects_overflow(api, flight):
    response = api["flight"].post(
        f"/api/internal/flights/{flight['id']}/reserve",
        json={"quantity": int(flight["availableSeats"]) + 1, "reservationId": 999999},
    )
    assert response.status_code == 409
    assert _error(response)["code"] == "INSUFFICIENT_AVAILABILITY"


def test_internal_stock_contract_rejects_bad_quantity(api, flight):
    response = api["flight"].post(
        f"/api/internal/flights/{flight['id']}/reserve",
        json={"quantity": 0, "reservationId": 999999},
    )
    assert response.status_code == 400
    assert _error(response)["code"] == "INVALID_FORMAT"


def test_missing_reservation_returns_404(api, admin):
    response = api["reservation"].get("/api/reservations/999999", token=admin["token"])
    assert response.status_code == 404
    assert _error(response)["code"] == "NOT_FOUND"


def test_expired_or_forged_token_is_rejected(api):
    response = api["reservation"].get(
        "/api/reservations",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert response.status_code == 401
    assert _error(response)["code"] == "UNAUTHENTICATED"
