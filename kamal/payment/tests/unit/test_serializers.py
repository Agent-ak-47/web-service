from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace

from helpers.serializers import iso_datetime, payment_json, reservation_json


def test_iso_datetime_handles_none():
    assert iso_datetime(None) == ''


def test_iso_datetime_marks_naive_values_as_utc():
    assert iso_datetime(datetime(2026, 2, 3, 4, 5, 6)) == '2026-02-03T04:05:06Z'


def test_iso_datetime_converts_aware_values_to_utc():
    value = datetime(2026, 2, 3, 6, 5, 6, tzinfo=timezone(timedelta(hours=2)))

    assert iso_datetime(value) == '2026-02-03T04:05:06Z'


def _reservation(**overrides):
    values = {
        'id': 42,
        'reference': 'RES-2026-000042',
        'user_id': 2,
        'item_type': 'FLIGHT',
        'item_id': 4,
        'item_label': 'Air X AX1 Paris -> Rome',
        'quantity': 2,
        'unit_price': Decimal('25.00'),
        'total_amount': Decimal('50.00'),
        'status': 'PENDING',
        'reservation_date': datetime(2026, 1, 1, 12, 0, 0),
        'departure_date': date(2026, 2, 3),
        'cancellation_reason': None,
    }
    values.update(overrides)

    return SimpleNamespace(**values)


def test_reservation_json_serializes_departure_date():
    payload = reservation_json(_reservation())

    assert payload['departureDate'] == '2026-02-03'
    assert payload['reservationDate'] == '2026-01-01T12:00:00Z'
    assert payload['cancellationReason'] == ''


def test_reservation_json_handles_missing_departure_date():
    payload = reservation_json(_reservation(departure_date=None))

    assert payload['departureDate'] == ''


def test_payment_json_serializes_all_public_fields():
    payment = SimpleNamespace(
        id=5,
        reservation_id=7,
        amount=Decimal('50.00'),
        method='CARD',
        status='SUCCEEDED',
        payment_date=datetime(2026, 1, 1, 12, 0, 0),
        transaction_ref='PAY-ABC',
        card_mask='1111',
        error_code=None,
    )

    assert payment_json(payment) == {
        'id': 5,
        'reservationId': 7,
        'amount': 50.0,
        'method': 'CARD',
        'status': 'SUCCEEDED',
        'paymentDate': '2026-01-01T12:00:00Z',
        'transactionRef': 'PAY-ABC',
        'cardMask': '1111',
        'errorCode': '',
    }


def test_payment_json_handles_missing_values():
    payment = SimpleNamespace(
        id=1,
        reservation_id=1,
        amount=None,
        method='CASH',
        status='FAILED',
        payment_date=None,
        transaction_ref=None,
        card_mask=None,
        error_code='PAYMENT_DECLINED',
    )

    payload = payment_json(payment)

    assert payload['amount'] == 0.0
    assert payload['paymentDate'] == ''
    assert payload['transactionRef'] == ''
    assert payload['cardMask'] == ''
    assert payload['errorCode'] == 'PAYMENT_DECLINED'
