"""INT-RES-001 / INT-PAY-001: booking, payment, cancellation and refund flows."""

import pytest

VALID_CARD = {
    "method": "CARD",
    "cardNumber": "4242 4242 4242 4242",
    "expiration": "12/2030",
    "cvv": "123",
}
DECLINED_CARD = {
    "method": "CARD",
    "cardNumber": "4242 4242 4242 4242 0002",
    "expiration": "12/2030",
    "cvv": "123",
}


def _error(response):
    return response.json()["error"]


def _pay(api, token, reservation_id, card=None):
    return api["payment"].post(
        f"/api/reservations/{reservation_id}/payment",
        token=token,
        json=card or VALID_CARD,
    )


def _history(api, token, reservation_id):
    response = api["reservation"].get(
        f"/api/reservations/{reservation_id}/history",
        token=token,
    )
    assert response.status_code == 200, response.text
    return response.json()["data"]


def test_flight_reservation_holds_stock(api, client, flight, book, availability):
    before = availability("FLIGHT", flight["id"])
    reservation = book(client["token"], "FLIGHT", flight["id"], 2)

    assert reservation["status"] == "PENDING"
    assert reservation["reference"].startswith("RES-")
    assert reservation["typeItem"] == "FLIGHT"
    assert reservation["itemId"] == flight["id"]
    assert reservation["unitPrice"] == pytest.approx(flight["price"])
    assert reservation["totalAmount"] == pytest.approx(flight["price"] * 2)

    assert availability("FLIGHT", flight["id"]) == before - 2

    history = _history(api, client["token"], reservation["id"])
    assert [entry["statusAfter"] for entry in history] == ["PENDING"]

    listing = api["reservation"].get(
        "/api/reservations",
        token=client["token"],
        params={"search": reservation["reference"]},
    )
    assert listing.status_code == 200
    assert reservation["id"] in [row["id"] for row in listing.json()["data"]]


def test_payment_then_refund_restores_stock(api, admin, client, flight, book, availability):
    before = availability("FLIGHT", flight["id"])
    reservation = book(client["token"], "FLIGHT", flight["id"], 1)

    payment = _pay(api, client["token"], reservation["id"])
    assert payment.status_code == 200, payment.text
    paid = payment.json()["data"]
    assert paid["payment"]["status"] == "SUCCEEDED"
    assert paid["payment"]["amount"] == pytest.approx(reservation["totalAmount"])
    assert paid["reservation"]["status"] == "PAID"

    replay = _pay(api, client["token"], reservation["id"])
    assert replay.status_code == 200
    assert replay.json()["data"]["payment"]["id"] == paid["payment"]["id"]

    statuses = [entry["statusAfter"] for entry in _history(api, client["token"], reservation["id"])]
    assert "PAID" in statuses

    refund = api["payment"].post(
        f"/api/reservations/{reservation['id']}/refund",
        token=admin["token"],
        json={},
    )
    assert refund.status_code == 200, refund.text
    refunded = refund.json()["data"]
    assert refunded["reservation"]["status"] == "REFUNDED"
    assert refunded["payment"]["status"] == "REFUNDED"
    assert refunded["refundedAmount"] == pytest.approx(reservation["totalAmount"])
    assert availability("FLIGHT", flight["id"]) == before

    again = api["payment"].post(
        f"/api/reservations/{reservation['id']}/refund",
        token=admin["token"],
        json={},
    )
    assert again.status_code == 200
    assert again.json()["data"]["refundedAmount"] == pytest.approx(reservation["totalAmount"])


def test_declined_payment_keeps_reservation_pending(api, client, flight, book):
    reservation = book(client["token"], "FLIGHT", flight["id"], 1)

    declined = _pay(api, client["token"], reservation["id"], DECLINED_CARD)
    assert declined.status_code == 402, declined.text
    error = _error(declined)
    assert error["code"] == "PAYMENT_DECLINED"
    assert error["details"]["paymentId"]

    current = api["reservation"].get(
        f"/api/reservations/{reservation['id']}",
        token=client["token"],
    )
    assert current.json()["data"]["status"] == "PENDING"

    retry = _pay(api, client["token"], reservation["id"])
    assert retry.status_code == 200
    assert retry.json()["data"]["reservation"]["status"] == "PAID"


def test_client_cancel_releases_stock(api, client, flight, book, availability):
    before = availability("FLIGHT", flight["id"])
    reservation = book(client["token"], "FLIGHT", flight["id"], 2)

    cancel = api["reservation"].post(
        f"/api/reservations/{reservation['id']}/cancellation",
        token=client["token"],
        json={"reason": "changed plans"},
    )
    assert cancel.status_code == 200, cancel.text
    assert cancel.json()["data"]["status"] == "CANCELLED"
    assert cancel.json()["data"]["cancellationReason"] == "changed plans"
    assert availability("FLIGHT", flight["id"]) == before

    statuses = [entry["statusAfter"] for entry in _history(api, client["token"], reservation["id"])]
    assert "CANCELLED" in statuses

    second = api["reservation"].post(
        f"/api/reservations/{reservation['id']}/cancellation",
        token=client["token"],
        json={},
    )
    assert second.status_code == 409
    assert _error(second)["code"] == "INVALID_STATUS"


def test_quantity_update_resizes_the_hold(api, client, flight, book, availability):
    before = availability("FLIGHT", flight["id"])
    reservation = book(client["token"], "FLIGHT", flight["id"], 1)

    grown = api["reservation"].patch(
        f"/api/reservations/{reservation['id']}",
        token=client["token"],
        json={"quantity": 3},
    )
    assert grown.status_code == 200, grown.text
    assert grown.json()["data"]["quantity"] == 3
    assert availability("FLIGHT", flight["id"]) == before - 3

    shrunk = api["reservation"].patch(
        f"/api/reservations/{reservation['id']}",
        token=client["token"],
        json={"quantity": 1},
    )
    assert shrunk.status_code == 200, shrunk.text
    assert shrunk.json()["data"]["quantity"] == 1
    assert availability("FLIGHT", flight["id"]) == before - 1


def test_insufficient_availability_is_rejected(api, client, flight):
    requested = int(flight["availableSeats"]) + 1
    response = api["reservation"].post(
        "/api/reservations",
        token=client["token"],
        json={"typeItem": "FLIGHT", "itemId": flight["id"], "quantity": requested},
    )
    assert response.status_code == 409
    error = _error(response)
    assert error["code"] == "INSUFFICIENT_AVAILABILITY"
    assert error["details"]["available"] == flight["availableSeats"]


def test_invalid_item_type_and_quantity_are_rejected(api, client):
    bad_type = api["reservation"].post(
        "/api/reservations",
        token=client["token"],
        json={"typeItem": "HOTEL", "itemId": 1, "quantity": 1},
    )
    assert bad_type.status_code == 400
    assert _error(bad_type)["code"] == "INVALID_FORMAT"

    bad_quantity = api["reservation"].post(
        "/api/reservations",
        token=client["token"],
        json={"typeItem": "FLIGHT", "itemId": 1, "quantity": 0},
    )
    assert bad_quantity.status_code == 400
    assert _error(bad_quantity)["code"] == "MISSING_FIELD"


def test_admin_validation_confirms_pending_booking(api, admin, client, flight, book):
    reservation = book(client["token"], "FLIGHT", flight["id"], 1)

    response = api["reservation"].post(
        f"/api/reservations/{reservation['id']}/validation",
        token=admin["token"],
        json={},
    )
    assert response.status_code == 200, response.text
    assert response.json()["data"]["status"] == "CONFIRMED"

    payment = _pay(api, client["token"], reservation["id"])
    assert payment.status_code == 200
    assert payment.json()["data"]["reservation"]["status"] == "PAID"


def test_excursion_reservation_releases_on_cancel(api, client, excursion, book, availability):
    before = availability("EXCURSION", excursion["id"])
    reservation = book(client["token"], "EXCURSION", excursion["id"], 2)

    assert reservation["typeItem"] == "EXCURSION"
    assert reservation["unitPrice"] == pytest.approx(excursion["price"])
    assert availability("EXCURSION", excursion["id"]) == before - 2

    cancel = api["reservation"].post(
        f"/api/reservations/{reservation['id']}/cancellation",
        token=client["token"],
        json={},
    )
    assert cancel.status_code == 200, cancel.text
    assert availability("EXCURSION", excursion["id"]) == before


def test_package_reservation_uses_promo_price(api, client, package, book):
    reservation = book(client["token"], "PACKAGE", package["id"], 1)
    expected = package["promoPrice"] if package.get("promoPrice") is not None else package["price"]

    assert reservation["typeItem"] == "PACKAGE"
    assert reservation["itemLabel"]
    assert reservation["unitPrice"] == pytest.approx(float(expected))


def test_reservation_is_private_to_its_owner(api, admin, client, other_client, flight, book):
    reservation = book(client["token"], "FLIGHT", flight["id"], 1)

    forbidden = api["reservation"].get(
        f"/api/reservations/{reservation['id']}",
        token=other_client["token"],
    )
    assert forbidden.status_code == 403
    assert _error(forbidden)["code"] == "FORBIDDEN"

    cancel = api["reservation"].post(
        f"/api/reservations/{reservation['id']}/cancellation",
        token=other_client["token"],
        json={},
    )
    assert cancel.status_code == 403

    listing = api["reservation"].get("/api/reservations", token=other_client["token"])
    assert reservation["id"] not in [row["id"] for row in listing.json()["data"]]

    as_admin = api["reservation"].get(
        f"/api/reservations/{reservation['id']}",
        token=admin["token"],
    )
    assert as_admin.status_code == 200
    assert as_admin.json()["data"]["id"] == reservation["id"]
