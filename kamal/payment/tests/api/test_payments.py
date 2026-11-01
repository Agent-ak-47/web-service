from datetime import date, datetime, timezone

import pytest

from helpers.catalog import ItemNotFound, ServiceUnavailable
from models import Payment, Reservation, ReservationHistory, db

CURRENT_YEAR = datetime.now(timezone.utc).year
VALID_EXPIRY = f'12/{CURRENT_YEAR + 5}'
PAST_EXPIRY = f'12/{CURRENT_YEAR - 1}'


def pay(client, headers, reservation_id, **payload):
    return client.post(
        f'/api/reservations/{reservation_id}/payment',
        json=payload,
        headers=headers,
    )


def refund(client, headers, reservation_id):
    return client.post(
        f'/api/reservations/{reservation_id}/refund',
        headers=headers,
    )


def card_payload(expiration, number='4111111111111111', cvv='123'):
    return {
        'method': 'CARD',
        'cardNumber': number,
        'expiration': expiration,
        'cvv': cvv,
    }


def test_card_payment_succeeds(client, auth_for, make_reservation, future_expiry):
    reservation = make_reservation(user_id=1, quantity=2, unit_price='25.00')

    response = pay(
        client,
        auth_for(user_id=1),
        reservation.id,
        **card_payload(future_expiry),
    )

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['reservation']['status'] == 'PAID'
    assert data['payment']['status'] == 'SUCCEEDED'
    assert data['payment']['amount'] == 50.0
    assert data['payment']['method'] == 'CARD'
    assert data['payment']['cardMask'] == '1111'
    assert data['payment']['transactionRef'].startswith('PAY-')
    assert data['payment']['errorCode'] == ''
    assert '4111111111111111' not in response.get_data(as_text=True)

    stored = db.session.get(Reservation, reservation.id)
    assert stored.status == 'PAID'
    assert Payment.query.count() == 1

    history = ReservationHistory.query.one()
    assert history.status_before == 'PENDING'
    assert history.status_after == 'PAID'
    assert history.actor == 'client'
    assert history.comment == 'Payment accepted (CARD)'


def test_payment_answer_returns_the_reservation_departure_date(
    client, auth_for, make_reservation,
):
    reservation = make_reservation(user_id=1, departure_date=date(2026, 2, 3))

    response = pay(client, auth_for(user_id=1), reservation.id, method='CASH')

    assert response.status_code == 200
    assert response.get_json()['data']['reservation']['departureDate'] == '2026-02-03'


def test_confirmed_reservation_can_be_paid(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=1, status='CONFIRMED')

    response = pay(client, auth_for(user_id=1), reservation.id, method='CASH')

    assert response.status_code == 200
    assert response.get_json()['data']['reservation']['status'] == 'PAID'


@pytest.mark.parametrize('method', ['CASH', 'BANK_TRANSFER', 'PAYPAL'])
def test_non_card_methods_do_not_require_card_details(
    client, auth_for, make_reservation, method,
):
    reservation = make_reservation(user_id=1)

    response = pay(client, auth_for(user_id=1), reservation.id, method=method)

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['payment']['method'] == method
    assert data['payment']['cardMask'] == ''
    assert data['reservation']['status'] == 'PAID'


def test_payment_method_is_case_insensitive(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=1)

    response = pay(client, auth_for(user_id=1), reservation.id, method='cash')

    assert response.status_code == 200
    assert response.get_json()['data']['payment']['method'] == 'CASH'


def test_declined_card_is_recorded_and_does_not_pay(
    client, auth_for, make_reservation, future_expiry,
):
    reservation = make_reservation(user_id=1)

    response = pay(
        client,
        auth_for(user_id=1),
        reservation.id,
        **card_payload(future_expiry, number='4000000000000002'),
    )

    assert response.status_code == 402
    error = response.get_json()['error']
    assert error['code'] == 'PAYMENT_DECLINED'
    assert error['details']['paymentId']

    payment = db.session.get(Payment, error['details']['paymentId'])
    assert payment.status == 'FAILED'
    assert payment.error_code == 'PAYMENT_DECLINED'
    assert payment.card_mask == '0002'
    assert db.session.get(Reservation, reservation.id).status == 'PENDING'
    assert ReservationHistory.query.count() == 0


@pytest.mark.parametrize(
    'payload',
    [
        {'method': 'CARD', 'cardNumber': '4111', 'expiration': VALID_EXPIRY, 'cvv': '123'},
        {'method': 'CARD', 'cardNumber': '4111111111111111', 'expiration': PAST_EXPIRY, 'cvv': '123'},
        {'method': 'CARD', 'cardNumber': '4111111111111111', 'expiration': VALID_EXPIRY, 'cvv': '12'},
        {'method': 'CARD', 'cardNumber': '4111111111111111', 'expiration': VALID_EXPIRY, 'cvv': 123},
    ],
)
def test_invalid_card_details_are_rejected(client, auth_for, make_reservation, payload):
    reservation = make_reservation(user_id=1)

    response = pay(client, auth_for(user_id=1), reservation.id, **payload)

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'INVALID_FORMAT'
    assert Payment.query.count() == 0


@pytest.mark.parametrize(
    'payload',
    [
        {},
        {'method': 'CRYPTO'},
        {'method': None},
    ],
)
def test_invalid_payment_methods_are_rejected(client, auth_for, make_reservation, payload):
    reservation = make_reservation(user_id=1)

    response = pay(client, auth_for(user_id=1), reservation.id, **payload)

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'INVALID_FORMAT'


def test_payment_requires_a_json_body(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=1)

    response = client.post(
        f'/api/reservations/{reservation.id}/payment',
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'INVALID_FORMAT'


def test_paying_twice_returns_the_existing_payment(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=1)
    headers = auth_for(user_id=1)

    first = pay(client, headers, reservation.id, method='CASH')
    second = pay(client, headers, reservation.id, method='CASH')

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.get_json()['data']['payment']['id'] == first.get_json()['data']['payment']['id']
    assert Payment.query.count() == 1
    assert ReservationHistory.query.count() == 1


def test_paid_reservation_without_a_successful_payment_is_rejected(
    client, auth_for, make_reservation,
):
    reservation = make_reservation(user_id=1, status='PAID')

    response = pay(client, auth_for(user_id=1), reservation.id, method='CASH')

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INVALID_STATUS'


@pytest.mark.parametrize('status', ['CANCELLED', 'REFUNDED', 'EXPIRED'])
def test_non_payable_statuses_are_rejected(client, auth_for, make_reservation, status):
    reservation = make_reservation(user_id=1, status=status)

    response = pay(client, auth_for(user_id=1), reservation.id, method='CASH')

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INVALID_STATUS'


def test_zero_amount_reservations_cannot_be_paid(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=1, unit_price='0.00')

    response = pay(client, auth_for(user_id=1), reservation.id, method='CASH')

    assert response.status_code == 422
    assert response.get_json()['error']['code'] == 'BUSINESS_RULE_VIOLATION'


def test_payment_hides_other_users_reservations(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=2)

    response = pay(client, auth_for(user_id=1), reservation.id, method='CASH')

    assert response.status_code == 403
    assert response.get_json()['error']['code'] == 'FORBIDDEN'
    assert Payment.query.count() == 0


def test_admins_can_pay_any_reservation(client, auth_for, make_reservation):
    reservation = make_reservation(user_id=2)

    response = pay(
        client,
        auth_for(user_id=99, role='ADMIN'),
        reservation.id,
        method='CASH',
    )

    assert response.status_code == 200
    assert ReservationHistory.query.one().actor == 'admin'


def test_payment_returns_404_for_unknown_reservations(client, auth_for):
    response = pay(client, auth_for(), 999, method='CASH')

    assert response.status_code == 404
    assert response.get_json()['error']['code'] == 'NOT_FOUND'


def test_payment_requires_authentication(client, make_reservation):
    reservation = make_reservation(user_id=1)

    response = pay(client, {}, reservation.id, method='CASH')

    assert response.status_code == 401


def test_refund_requires_an_admin(client, auth_for, make_reservation, make_payment):
    reservation = make_reservation(user_id=1, status='PAID')
    make_payment(reservation.id)

    response = refund(client, auth_for(user_id=1), reservation.id)

    assert response.status_code == 403
    assert response.get_json()['error']['code'] == 'FORBIDDEN'


def test_refund_releases_stock_and_records_the_payment(
    client, auth_for, make_reservation, make_payment, catalog,
):
    reservation = make_reservation(user_id=1, status='PAID', quantity=2, unit_price='25.00')
    original = make_payment(
        reservation.id,
        status='SUCCEEDED',
        amount='50.00',
        method='CARD',
        card_mask='4242',
    )

    response = refund(client, auth_for(user_id=99, role='ADMIN'), reservation.id)

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['refundedAmount'] == 50.0
    assert data['reservation']['status'] == 'REFUNDED'
    assert data['payment']['status'] == 'REFUNDED'
    assert data['payment']['amount'] == 50.0
    assert data['payment']['method'] == 'CARD'
    assert data['payment']['cardMask'] == '4242'
    assert data['payment']['transactionRef'].startswith('REF-')
    assert catalog.release_calls == [('FLIGHT', 10, 2, reservation.id)]

    assert db.session.get(Reservation, reservation.id).status == 'REFUNDED'
    assert Payment.query.count() == 2
    assert db.session.get(Payment, original.id).status == 'SUCCEEDED'

    history = ReservationHistory.query.one()
    assert history.status_before == 'PAID'
    assert history.status_after == 'REFUNDED'
    assert history.actor == 'admin'
    assert history.comment == 'Refund issued'


def test_cancelled_reservation_with_a_payment_can_be_refunded(
    client, auth_for, make_reservation, make_payment,
):
    reservation = make_reservation(user_id=1, status='CANCELLED')
    make_payment(reservation.id, status='SUCCEEDED')

    response = refund(client, auth_for(user_id=99, role='ADMIN'), reservation.id)

    assert response.status_code == 200
    assert response.get_json()['data']['reservation']['status'] == 'REFUNDED'


@pytest.mark.parametrize('status', ['PENDING', 'CONFIRMED', 'EXPIRED'])
def test_non_refundable_statuses_are_rejected(
    client, auth_for, make_reservation, make_payment, catalog, status,
):
    reservation = make_reservation(user_id=1, status=status)
    make_payment(reservation.id, status='SUCCEEDED')

    response = refund(client, auth_for(user_id=99, role='ADMIN'), reservation.id)

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INVALID_STATUS'
    assert catalog.release_calls == []


def test_refund_is_idempotent(
    client, auth_for, make_reservation, make_payment, catalog,
):
    reservation = make_reservation(user_id=1, status='REFUNDED')
    existing = make_payment(reservation.id, status='REFUNDED', amount='50.00')

    response = refund(client, auth_for(user_id=99, role='ADMIN'), reservation.id)

    assert response.status_code == 200
    assert response.get_json()['data']['payment']['id'] == existing.id
    assert response.get_json()['data']['refundedAmount'] == 50.0
    assert catalog.release_calls == []


def test_refund_without_a_successful_payment_is_rejected(
    client, auth_for, make_reservation,
):
    reservation = make_reservation(user_id=1, status='PAID')

    response = refund(client, auth_for(user_id=99, role='ADMIN'), reservation.id)

    assert response.status_code == 422
    assert response.get_json()['error']['code'] == 'BUSINESS_RULE_VIOLATION'


def test_refunded_reservation_without_a_refund_record_is_rejected(
    client, auth_for, make_reservation, make_payment,
):
    reservation = make_reservation(user_id=1, status='REFUNDED')
    make_payment(reservation.id, status='SUCCEEDED')

    response = refund(client, auth_for(user_id=99, role='ADMIN'), reservation.id)

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INVALID_STATUS'


def test_refund_still_completes_when_the_catalogue_item_is_gone(
    client, auth_for, make_reservation, make_payment, catalog,
):
    reservation = make_reservation(user_id=1, status='PAID')
    make_payment(reservation.id, status='SUCCEEDED')
    catalog.release_error = ItemNotFound()

    response = refund(client, auth_for(user_id=99, role='ADMIN'), reservation.id)

    assert response.status_code == 200
    assert response.get_json()['data']['reservation']['status'] == 'REFUNDED'
    assert Payment.query.count() == 2


def test_refund_rolls_back_when_the_catalogue_is_down(
    client, auth_for, make_reservation, make_payment, catalog,
):
    reservation = make_reservation(user_id=1, status='PAID')
    make_payment(reservation.id, status='SUCCEEDED')
    catalog.release_error = ServiceUnavailable('down')

    response = refund(client, auth_for(user_id=99, role='ADMIN'), reservation.id)

    assert response.status_code == 502
    assert response.get_json()['error']['code'] == 'SERVICE_UNAVAILABLE'
    assert db.session.get(Reservation, reservation.id).status == 'PAID'
    assert Payment.query.count() == 1
    assert ReservationHistory.query.count() == 0


def test_refund_rolls_back_on_an_unexpected_catalogue_error(
    client, auth_for, make_reservation, make_payment, catalog,
):
    reservation = make_reservation(user_id=1, status='PAID')
    make_payment(reservation.id, status='SUCCEEDED')
    catalog.release_error = RuntimeError('boom')

    response = refund(client, auth_for(user_id=99, role='ADMIN'), reservation.id)

    assert response.status_code == 500
    assert response.get_json()['error']['code'] == 'INTERNAL_ERROR'
    assert db.session.get(Reservation, reservation.id).status == 'PAID'
    assert Payment.query.count() == 1


def test_refund_returns_404_for_unknown_reservations(client, auth_for):
    response = refund(client, auth_for(user_id=99, role='ADMIN'), 999)

    assert response.status_code == 404
    assert response.get_json()['error']['code'] == 'NOT_FOUND'


def test_refund_requires_authentication(client, make_reservation):
    reservation = make_reservation(user_id=1, status='PAID')

    response = refund(client, {}, reservation.id)

    assert response.status_code == 401


def test_refund_by_payment_id(client, auth_for, make_reservation, make_payment):
    reservation = make_reservation(user_id=1, status='PAID')
    original = make_payment(reservation.id, status='SUCCEEDED')

    response = client.post(
        f'/api/payments/{original.id}/refund',
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['reservation']['status'] == 'REFUNDED'
    assert data['payment']['status'] == 'REFUNDED'
    assert db.session.get(Payment, original.id).status == 'SUCCEEDED'


def test_refund_by_payment_id_returns_404_for_unknown_payments(client, auth_for):
    response = client.post(
        '/api/payments/999/refund',
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 404
    assert response.get_json()['error']['code'] == 'NOT_FOUND'


def test_failed_payments_cannot_be_refunded(
    client, auth_for, make_reservation, make_payment,
):
    reservation = make_reservation(user_id=1, status='PAID')
    failed = make_payment(reservation.id, status='FAILED', error_code='PAYMENT_DECLINED')

    response = client.post(
        f'/api/payments/{failed.id}/refund',
        headers=auth_for(user_id=99, role='ADMIN'),
    )

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'INVALID_STATUS'


def test_refund_by_payment_id_requires_an_admin(
    client, auth_for, make_reservation, make_payment,
):
    reservation = make_reservation(user_id=1, status='PAID')
    original = make_payment(reservation.id, status='SUCCEEDED')

    response = client.post(
        f'/api/payments/{original.id}/refund',
        headers=auth_for(user_id=1),
    )

    assert response.status_code == 403


def test_refunding_by_payment_id_twice_is_idempotent(
    client, auth_for, make_reservation, make_payment, catalog,
):
    reservation = make_reservation(user_id=1, status='PAID')
    original = make_payment(reservation.id, status='SUCCEEDED')
    headers = auth_for(user_id=99, role='ADMIN')

    first = client.post(f'/api/payments/{original.id}/refund', headers=headers)
    second = client.post(f'/api/payments/{original.id}/refund', headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.get_json()['data']['payment']['status'] == 'REFUNDED'
    assert Payment.query.count() == 2
    assert catalog.release_calls == [('FLIGHT', 10, 2, reservation.id)]


def test_health_endpoint(client):
    response = client.get('/health')

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['service'] == 'payment'
    assert data['status'] == 'ok'


def test_unknown_route_returns_the_error_envelope(client):
    response = client.get('/api/unknown')

    assert response.status_code == 404
    assert response.get_json()['error']['code'] == 'NOT_FOUND'


def test_wrong_method_returns_the_error_envelope(client):
    response = client.get('/api/payments/1/refund')

    assert response.status_code == 405
    assert response.get_json()['error']['code'] == 'METHOD_NOT_ALLOWED'
