from datetime import datetime, timedelta, timezone

import pytest

import controls.reservation as reservation_control
from helpers.catalog import InsufficientAvailability, ItemNotFound, ServiceUnavailable
from models import Reservation, ReservationHistory, db


def create_reservation(client, headers, **overrides):
    payload = {
        'typeItem': 'FLIGHT',
        'itemId': 10,
        'quantity': 2,
    }
    payload.update(overrides)

    return client.post('/api/reservations', json=payload, headers=headers)


def test_create_reservation_captures_the_catalog_price(client, auth_for, catalog):
    catalog.item = {
        'price': '25.50',
        'availableSeats': 5,
        'active': True,
        'airline': 'Air X',
        'flightNumber': 'AX1',
        'departureCity': 'Paris',
        'arrivalCity': 'Rome',
    }

    response = create_reservation(client, auth_for())

    assert response.status_code == 201
    data = response.get_json()['data']
    assert data['id'] == 1
    assert data['reference'] == f'RES-{datetime.now(timezone.utc).year}-000001'
    assert data['userId'] == 1
    assert data['typeItem'] == 'FLIGHT'
    assert data['itemId'] == 10
    assert data['itemLabel'] == 'Air X AX1 Paris -> Rome'
    assert data['quantity'] == 2
    assert data['unitPrice'] == 25.5
    assert data['totalAmount'] == 51.0
    assert data['status'] == 'PENDING'
    assert data['cancellationReason'] == ''
    assert data['reservationDate'].endswith('Z')
    assert catalog.fetch_calls == [('FLIGHT', 10)]
    assert catalog.reserve_calls == [('FLIGHT', 10, 2, 1)]

    history = ReservationHistory.query.one()
    assert history.status_before is None
    assert history.status_after == 'PENDING'
    assert history.actor == 'client'


def test_create_reservation_uses_the_admin_actor(client, auth_for, catalog):
    catalog.item['availableSeats'] = 10

    response = create_reservation(client, auth_for(user_id=9, role='ADMIN'), quantity=1)

    assert response.status_code == 201
    assert ReservationHistory.query.one().actor == 'admin'


@pytest.mark.parametrize(
    'item_type, item, departure_date',
    [
        (
            'FLIGHT',
            {
                'price': '25.00',
                'availableSeats': 5,
                'active': True,
                'departureTime': '2026-11-04T07:15:00Z',
            },
            '2026-11-04',
        ),
        (
            'FLIGHT',
            {
                'price': '25.00',
                'availableSeats': 5,
                'active': True,
                'departureDate': '2026-11-05T07:15:00Z',
            },
            '2026-11-05',
        ),
        (
            'PACKAGE',
            {
                'price': '25.00',
                'promoPrice': '20.00',
                'available': True,
                'startDate': '2026-11-06',
            },
            '2026-11-06',
        ),
        (
            'EXCURSION',
            {
                'price': '25.00',
                'availableSeats': 5,
                'available': True,
                'date': '2026-11-07',
            },
            '2026-11-07',
        ),
    ],
)
def test_create_reservation_captures_the_departure_date(
    client, auth_for, catalog, item_type, item, departure_date,
):
    catalog.item = item

    response = create_reservation(
        client,
        auth_for(),
        typeItem=item_type,
        itemId=7,
        quantity=1,
    )

    assert response.status_code == 201
    assert response.get_json()['data']['departureDate'] == departure_date


def test_create_package_reservation_uses_the_promo_price(client, auth_for, catalog):
    catalog.item = {
        'price': '100.00',
        'promoPrice': '80.00',
        'name': 'Rome Package',
        'available': True,
    }

    response = create_reservation(
        client,
        auth_for(),
        typeItem='PACKAGE',
        itemId=7,
        quantity=3,
    )

    assert response.status_code == 201
    data = response.get_json()['data']
    assert data['typeItem'] == 'PACKAGE'
    assert data['itemLabel'] == 'Rome Package'
    assert data['unitPrice'] == 80.0
    assert data['totalAmount'] == 240.0
    assert catalog.reserve_calls == [('PACKAGE', 7, 3, 1)]


@pytest.mark.parametrize(
    'overrides, code',
    [
        ({'typeItem': 'HOTEL'}, 'INVALID_FORMAT'),
        ({'itemId': 'abc'}, 'MISSING_FIELD'),
        ({'itemId': True}, 'MISSING_FIELD'),
        ({'quantity': 0}, 'MISSING_FIELD'),
        ({'quantity': 'two'}, 'MISSING_FIELD'),
        ({'quantity': 70000}, 'INVALID_FORMAT'),
    ],
)
def test_create_reservation_validates_the_payload(client, auth_for, overrides, code):
    response = create_reservation(client, auth_for(), **overrides)

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == code


def test_create_reservation_requires_a_json_body(client, auth_for):
    response = client.post('/api/reservations', headers=auth_for())

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'INVALID_FORMAT'


def test_create_reservation_reports_a_missing_item(client, auth_for, catalog):
    catalog.fetch_error = ItemNotFound()

    response = create_reservation(client, auth_for())

    assert response.status_code == 422
    error = response.get_json()['error']
    assert error['code'] == 'ITEM_NOT_FOUND'
    assert error['details'] == {'itemId': 10}


def test_create_reservation_reports_a_catalogue_outage(client, auth_for, catalog):
    catalog.fetch_error = ServiceUnavailable('down')

    response = create_reservation(client, auth_for())

    assert response.status_code == 502
    assert response.get_json()['error']['code'] == 'SERVICE_UNAVAILABLE'


def test_create_reservation_rejects_an_inactive_item(client, auth_for, catalog):
    catalog.item['active'] = False

    response = create_reservation(client, auth_for())

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INSUFFICIENT_AVAILABILITY'


@pytest.mark.parametrize('available_seats', [0, 1])
def test_create_reservation_rejects_insufficient_seats(client, auth_for, catalog, available_seats):
    catalog.item['availableSeats'] = available_seats

    response = create_reservation(client, auth_for(), quantity=2)

    assert response.status_code == 409
    error = response.get_json()['error']
    assert error['code'] == 'INSUFFICIENT_AVAILABILITY'
    assert error['details'] == {
        'itemId': 10,
        'requested': 2,
        'available': available_seats,
    }
    assert catalog.reserve_calls == []


def test_create_reservation_rolls_back_when_stock_conflicts(client, auth_for, catalog):
    catalog.reserve_error = InsufficientAvailability({'available': 0})

    response = create_reservation(client, auth_for())

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INSUFFICIENT_AVAILABILITY'
    assert Reservation.query.count() == 0
    assert ReservationHistory.query.count() == 0


def test_create_reservation_compensates_when_the_catalogue_is_down(client, auth_for, catalog):
    catalog.reserve_error = ServiceUnavailable('down')

    response = create_reservation(client, auth_for())

    assert response.status_code == 502
    assert Reservation.query.count() == 0
    assert catalog.release_calls == [('FLIGHT', 10, 2, 1)]


def test_create_reservation_releases_stock_when_persisting_fails(
    client, auth_for, catalog, monkeypatch,
):
    def boom(*args, **kwargs):
        raise RuntimeError('database failed')

    monkeypatch.setattr(reservation_control, '_add_history', boom)

    response = create_reservation(client, auth_for())

    assert response.status_code == 500
    assert response.get_json()['error']['code'] == 'INTERNAL_ERROR'
    assert Reservation.query.count() == 0
    assert catalog.release_calls == [('FLIGHT', 10, 2, 1)]


def test_create_reservation_rejects_a_total_that_is_too_large(client, auth_for, catalog):
    catalog.item['price'] = '99999999.99'

    response = create_reservation(client, auth_for())

    assert response.status_code == 422
    assert response.get_json()['error']['code'] == 'BUSINESS_RULE_VIOLATION'
    assert catalog.reserve_calls == []


@pytest.mark.parametrize(
    'item',
    [
        {'price': '10.00', 'active': True},
        {'price': '10.00', 'availableSeats': 'many', 'active': True},
        {'price': 'free', 'availableSeats': 5, 'active': True},
        {'price': '-1', 'availableSeats': 5, 'active': True},
    ],
)
def test_create_reservation_rejects_invalid_catalogue_data(client, auth_for, catalog, item):
    catalog.item = item

    response = create_reservation(client, auth_for())

    assert response.status_code == 502
    assert response.get_json()['error']['code'] == 'SERVICE_UNAVAILABLE'


def test_list_reservations_returns_only_the_owner_rows(
    client, auth_for, make_reservation,
):
    own = make_reservation(user_id=1)
    make_reservation(user_id=2)

    response = client.get('/api/reservations', headers=auth_for(user_id=1))

    assert response.status_code == 200
    data = response.get_json()['data']
    assert [row['id'] for row in data] == [own.id]


def test_list_reservations_returns_every_row_for_admins(
    client, auth_for, make_reservation,
):
    make_reservation(user_id=1)
    make_reservation(user_id=2)

    response = client.get('/api/reservations', headers=auth_for(user_id=99, role='ADMIN'))

    assert response.status_code == 200
    assert len(response.get_json()['data']) == 2


def test_list_reservations_is_ordered_newest_first(client, auth_for, make_reservation):
    first = make_reservation(user_id=1)
    second = make_reservation(user_id=1)
    third = make_reservation(user_id=1)

    response = client.get('/api/reservations', headers=auth_for(user_id=1))

    assert [row['id'] for row in response.get_json()['data']] == [
        third.id,
        second.id,
        first.id,
    ]


def test_get_reservation_returns_the_owner_row(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=1)

    response = client.get(
        f'/api/reservations/{reservation.id}',
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['id'] == reservation.id


def test_get_reservation_allows_admins(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=2)

    response = client.get(
        f'/api/reservations/{reservation.id}',
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 200


def test_get_reservation_hides_other_users_rows(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=2)

    response = client.get(
        f'/api/reservations/{reservation.id}',
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 403
    assert response.get_json()['error']['code'] == 'FORBIDDEN'


def test_get_reservation_returns_404_for_unknown_rows(client, auth_for):
    response = client.get('/api/reservations/999', headers=auth_for())

    assert response.status_code == 404
    assert response.get_json()['error']['code'] == 'NOT_FOUND'


def test_get_history_returns_entries_newest_first(
    client, auth_for, make_reservation, make_history,
):
    reservation = make_reservation(user_id=1)
    make_history(reservation.id, None, 'PENDING', created_at=datetime(2026, 1, 1))
    make_history(
        reservation.id,
        'PENDING',
        'CONFIRMED',
        actor='admin',
        comment='Validated',
        created_at=datetime(2026, 1, 2),
    )

    response = client.get(
        f'/api/reservations/{reservation.id}/history',
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    data = response.get_json()['data']
    assert [row['statusAfter'] for row in data] == ['CONFIRMED', 'PENDING']
    assert data[0]['actor'] == 'admin'
    assert data[0]['comment'] == 'Validated'


def test_get_history_hides_other_users_rows(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=2)

    response = client.get(
        f'/api/reservations/{reservation.id}/history',
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 403


def test_get_history_returns_404_for_unknown_rows(client, auth_for):
    response = client.get('/api/reservations/999/history', headers=auth_for())

    assert response.status_code == 404


def test_update_reservation_increases_the_quantity(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=1, quantity=2, unit_price='10.00')

    response = client.post(
        f'/api/reservations/{reservation.id}',
        json={'quantity': 3},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['quantity'] == 3
    assert data['totalAmount'] == 30.0
    assert catalog.reserve_calls == [('FLIGHT', 10, 1, reservation.id)]
    assert catalog.release_calls == []

    history = ReservationHistory.query.one()
    assert history.status_before == 'PENDING'
    assert history.status_after == 'PENDING'
    assert history.comment == 'Quantity updated'


def test_update_reservation_decreases_the_quantity(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=1, quantity=3, unit_price='10.00')

    response = client.patch(
        f'/api/reservations/{reservation.id}',
        json={'quantity': 1},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['quantity'] == 1
    assert response.get_json()['data']['totalAmount'] == 10.0
    assert catalog.release_calls == [('FLIGHT', 10, 2, reservation.id)]


def test_update_reservation_with_the_same_quantity_is_a_no_op(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=1, quantity=2, unit_price='10.00')

    response = client.post(
        f'/api/reservations/{reservation.id}',
        json={'quantity': 2},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['quantity'] == 2
    assert catalog.reserve_calls == []
    assert catalog.release_calls == []
    assert ReservationHistory.query.count() == 0


@pytest.mark.parametrize('quantity', [None, 0, -1, 'abc', 70000])
def test_update_reservation_rejects_invalid_quantities(
    client, auth_for, make_reservation, quantity,
):
    reservation = make_reservation(user_id=1)

    response = client.post(
        f'/api/reservations/{reservation.id}',
        json={'quantity': quantity},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 400


def test_update_reservation_requires_a_json_body(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=1)

    response = client.post(
        f'/api/reservations/{reservation.id}',
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'INVALID_FORMAT'


@pytest.mark.parametrize('status', ['CANCELLED', 'PAID', 'REFUNDED', 'EXPIRED'])
def test_update_reservation_rejects_non_pending_statuses(
    client, auth_for, make_reservation, status,
):
    reservation = make_reservation(user_id=1, status=status)

    response = client.post(
        f'/api/reservations/{reservation.id}',
        json={'quantity': 3},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INVALID_STATUS'


def test_update_reservation_hides_other_users_rows(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=2)

    response = client.post(
        f'/api/reservations/{reservation.id}',
        json={'quantity': 3},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 403


def test_update_reservation_allows_admins(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=2, quantity=2)

    response = client.post(
        f'/api/reservations/{reservation.id}',
        json={'quantity': 3},
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['quantity'] == 3


def test_update_reservation_rolls_back_when_stock_is_missing(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=1, quantity=2, unit_price='10.00')
    catalog.reserve_error = InsufficientAvailability({'available': 1})

    response = client.post(
        f'/api/reservations/{reservation.id}',
        json={'quantity': 3},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 409
    stored = db.session.get(Reservation, reservation.id)
    assert stored.quantity == 2
    assert stored.total_amount == 20


def test_update_reservation_compensates_after_an_increase_failure(
    client, auth_for, make_reservation, catalog, monkeypatch,
):
    reservation = make_reservation(user_id=1, quantity=2, unit_price='10.00')

    def boom(*args, **kwargs):
        raise RuntimeError('database failed')

    monkeypatch.setattr(reservation_control, '_add_history', boom)

    response = client.post(
        f'/api/reservations/{reservation.id}',
        json={'quantity': 3},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 500
    assert catalog.release_calls == [('FLIGHT', 10, 1, reservation.id)]


def test_update_reservation_compensates_after_a_decrease_failure(
    client, auth_for, make_reservation, catalog, monkeypatch,
):
    reservation = make_reservation(user_id=1, quantity=3, unit_price='10.00')

    def boom(*args, **kwargs):
        raise RuntimeError('database failed')

    monkeypatch.setattr(reservation_control, '_add_history', boom)

    response = client.post(
        f'/api/reservations/{reservation.id}',
        json={'quantity': 1},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 500
    assert catalog.release_calls == [('FLIGHT', 10, 2, reservation.id)]
    assert catalog.reserve_calls == [('FLIGHT', 10, 2, reservation.id)]


def test_update_reservation_returns_404_for_unknown_rows(client, auth_for):
    response = client.post(
        '/api/reservations/999',
        json={'quantity': 3},
        headers=auth_for(),
    )

    assert response.status_code == 404


def test_cancel_reservation_releases_the_seats(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=1, quantity=2)

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['status'] == 'CANCELLED'
    assert data['cancellationReason'] == 'Cancelled by the customer'
    assert catalog.release_calls == [('FLIGHT', 10, 2, reservation.id)]

    history = ReservationHistory.query.one()
    assert history.status_before == 'PENDING'
    assert history.status_after == 'CANCELLED'
    assert history.actor == 'client'


def test_cancel_reservation_keeps_a_custom_reason(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=1)

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={'reason': '  Trip changed  '},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['cancellationReason'] == 'Trip changed'


def test_cancel_reservation_uses_the_admin_actor(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=2)

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 200
    assert ReservationHistory.query.one().actor == 'admin'


def test_cancel_reservation_allows_a_paid_booking(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=1, status='PAID')

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['status'] == 'CANCELLED'
    assert catalog.release_calls == []


@pytest.mark.parametrize('offset', [-1, 0, 1])
def test_cancel_reservation_rejects_a_client_inside_the_notice_period(
    client, auth_for, make_reservation, catalog, offset,
):
    departure = datetime.now(timezone.utc).date() + timedelta(days=offset)
    reservation = make_reservation(user_id=1, departure_date=departure)

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 422
    error = response.get_json()['error']
    assert error['code'] == 'BUSINESS_RULE_VIOLATION'
    assert error['details'] == {
        'departureDate': departure.isoformat(),
        'minimumDays': 2,
    }
    assert catalog.release_calls == []
    assert db.session.get(Reservation, reservation.id).status == 'PENDING'


def test_cancel_reservation_allows_a_client_at_the_two_day_boundary(
    client, auth_for, make_reservation, catalog,
):
    departure = datetime.now(timezone.utc).date() + timedelta(days=2)
    reservation = make_reservation(user_id=1, departure_date=departure)

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['status'] == 'CANCELLED'


def test_cancel_reservation_allows_an_admin_inside_the_notice_period(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(
        user_id=2,
        departure_date=datetime.now(timezone.utc).date(),
    )

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['status'] == 'CANCELLED'


def test_cancel_reservation_falls_back_to_the_catalogue_departure_date(
    client, auth_for, make_reservation, catalog,
):
    departure = datetime.now(timezone.utc).date() + timedelta(days=1)
    catalog.item['departureTime'] = f'{departure.isoformat()}T07:15:00Z'
    reservation = make_reservation(user_id=1, departure_date=None)

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 422
    assert response.get_json()['error']['code'] == 'BUSINESS_RULE_VIOLATION'
    assert catalog.release_calls == []


@pytest.mark.parametrize('status', ['CANCELLED', 'REFUNDED', 'EXPIRED'])
def test_cancel_reservation_rejects_non_cancellable_statuses(
    client, auth_for, make_reservation, status,
):
    reservation = make_reservation(user_id=1, status=status)

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INVALID_STATUS'


def test_cancel_reservation_hides_other_users_rows(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=2)

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 403


def test_cancel_reservation_still_cancels_when_the_catalogue_item_is_gone(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=1)
    catalog.release_error = ItemNotFound()

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['status'] == 'CANCELLED'


def test_cancel_reservation_rolls_back_when_the_catalogue_is_down(
    client, auth_for, make_reservation, catalog,
):
    reservation = make_reservation(user_id=1, quantity=2)
    catalog.release_error = ServiceUnavailable('down')

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 502
    assert catalog.reserve_calls == []
    assert db.session.get(Reservation, reservation.id).status == 'PENDING'


def test_cancel_reservation_compensates_when_persisting_fails(
    client, auth_for, make_reservation, catalog, monkeypatch,
):
    reservation = make_reservation(user_id=1, quantity=2)

    def boom(*args, **kwargs):
        raise RuntimeError('database failed')

    monkeypatch.setattr(reservation_control, '_add_history', boom)

    response = client.post(
        f'/api/reservations/{reservation.id}/cancellation',
        json={},
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 500
    assert catalog.reserve_calls == [('FLIGHT', 10, 2, reservation.id)]
    assert db.session.get(Reservation, reservation.id).status == 'PENDING'


def test_cancel_reservation_returns_404_for_unknown_rows(client, auth_for):
    response = client.post(
        '/api/reservations/999/cancellation',
        json={},
        headers=auth_for(),
    )

    assert response.status_code == 404


def test_validate_reservation_confirms_a_pending_booking(
    client, auth_for, make_reservation,
):
    reservation = make_reservation(user_id=1)

    response = client.post(
        f'/api/reservations/{reservation.id}/validation',
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 200
    assert response.get_json()['data']['status'] == 'CONFIRMED'

    history = ReservationHistory.query.one()
    assert history.status_before == 'PENDING'
    assert history.status_after == 'CONFIRMED'
    assert history.actor == 'admin'


def test_validate_reservation_rejects_clients(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=1)

    response = client.post(
        f'/api/reservations/{reservation.id}/validation',
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 403
    assert response.get_json()['error']['code'] == 'FORBIDDEN'


@pytest.mark.parametrize('status', ['CONFIRMED', 'PAID', 'CANCELLED', 'REFUNDED'])
def test_validate_reservation_rejects_non_pending_statuses(
    client, auth_for, make_reservation, status,
):
    reservation = make_reservation(user_id=1, status=status)

    response = client.post(
        f'/api/reservations/{reservation.id}/validation',
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INVALID_STATUS'


def test_validate_reservation_returns_404_for_unknown_rows(client, auth_for):
    response = client.post(
        '/api/reservations/999/validation',
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 404


def test_every_reservation_endpoint_requires_authentication(client):
    assert client.get('/api/reservations').status_code == 401
    assert client.post('/api/reservations', json={}).status_code == 401
    assert client.get('/api/reservations/1').status_code == 401
    assert client.get('/api/reservations/1/history').status_code == 401
    assert client.post('/api/reservations/1/cancellation').status_code == 401
    assert client.post('/api/reservations/1/validation').status_code == 401


def test_health_endpoint(client):
    response = client.get('/health')

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['service'] == 'reservation'
    assert data['status'] == 'ok'


def test_unknown_route_returns_the_error_envelope(client):
    response = client.get('/api/unknown')

    assert response.status_code == 404
    assert response.get_json()['error']['code'] == 'NOT_FOUND'


def test_wrong_method_returns_the_error_envelope(client):
    response = client.delete('/api/reservations/1')

    assert response.status_code == 405
    assert response.get_json()['error']['code'] == 'METHOD_NOT_ALLOWED'
