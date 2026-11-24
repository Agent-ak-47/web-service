"""INT-CATALOG-001: public catalogue contracts and their availability endpoints."""

FLIGHT_KEYS = {
    "id",
    "airline",
    "flightNumber",
    "departureCity",
    "arrivalCity",
    "departureTime",
    "arrivalTime",
    "totalSeats",
    "availableSeats",
    "price",
    "active",
}
EXCURSION_KEYS = {
    "id",
    "title",
    "location",
    "date",
    "dureeMinutes",
    "capacity",
    "availableSeats",
    "price",
    "available",
}
PACKAGE_KEYS = {
    "id",
    "name",
    "destination",
    "startDate",
    "endDate",
    "price",
    "promoPrice",
    "available",
    "active",
}


def test_flight_list_and_availability_agree(api, flight):
    assert FLIGHT_KEYS <= flight.keys()
    assert isinstance(flight["price"], (int, float))
    assert flight["availableSeats"] > 0

    response = api["flight"].get(f"/api/flights/{flight['id']}/availability")
    assert response.status_code == 200
    availability = response.json()["data"]
    assert availability["availableSeats"] == flight["availableSeats"]
    assert availability["totalSeats"] == flight["totalSeats"]


def test_flight_detail_matches_list(api, flight):
    response = api["flight"].get(f"/api/flights/{flight['id']}")
    assert response.status_code == 200
    detail = response.json()["data"]
    assert detail["id"] == flight["id"]
    assert detail["flightNumber"] == flight["flightNumber"]
    assert detail["price"] == flight["price"]


def test_excursion_list_and_availability_agree(api, excursion):
    assert EXCURSION_KEYS <= excursion.keys()
    response = api["excursion"].get(f"/api/excursions/{excursion['id']}/availability")
    assert response.status_code == 200
    availability = response.json()["data"]
    assert availability["availableSeats"] == excursion["availableSeats"]


def test_excursion_detail_matches_list(api, excursion):
    response = api["excursion"].get(f"/api/excursions/{excursion['id']}")
    assert response.status_code == 200
    detail = response.json()["data"]
    assert detail["id"] == excursion["id"]
    assert detail["title"] == excursion["title"]
    assert detail["price"] == excursion["price"]


def test_package_list_contains_pricing_and_flags(api, package):
    assert PACKAGE_KEYS <= package.keys()
    expected = package["promoPrice"] if package.get("promoPrice") is not None else package["price"]
    assert float(expected) <= float(package["price"])


def test_package_detail_and_availability(api, package):
    detail_response = api["package"].get(f"/api/packages/{package['id']}")
    assert detail_response.status_code == 200
    detail = detail_response.json()["data"]
    assert detail["id"] == package["id"]
    assert detail["name"] == package["name"]

    availability_response = api["package"].get(f"/api/packages/{package['id']}/availability")
    assert availability_response.status_code == 200
    availability = availability_response.json()["data"]
    assert availability["itemId"] == package["id"]
    assert availability["available"] is True
    assert availability["availableSeats"] is None or availability["availableSeats"] >= 0


def test_package_composition_exposes_components(api, package):
    response = api["package"].get(
        "/api/packages",
        params={"page": 1, "size": 100, "withComposition": "true"},
    )
    assert response.status_code == 200
    rows = response.json()["data"]["data"]
    selected = next((row for row in rows if row["id"] == package["id"]), None)
    assert selected is not None
    composition = selected.get("composition")
    assert composition is None or {
        "flights",
        "excursions",
    } <= composition.keys()


def test_missing_catalogue_items_return_404(api):
    for service, path in (
        ("flight", "/api/flights/999999"),
        ("excursion", "/api/excursions/999999"),
        ("package", "/api/packages/999999"),
    ):
        response = api[service].get(path)
        assert response.status_code == 404, (service, response.text)
        assert response.json()["error"]["code"] == "NOT_FOUND"
