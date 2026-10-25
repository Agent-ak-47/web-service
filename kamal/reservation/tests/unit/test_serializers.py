from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace

from helpers.serializers import history_json, iso_datetime, reservation_json


def test_iso_datetime_handles_none():
    assert iso_datetime(None) == ''


def test_iso_datetime_marks_naive_values_as_utc():
    assert iso_datetime(datetime(2026, 2, 3, 4, 5, 6)) == '2026-02-03T04:05:06Z'


def test_iso_datetime_converts_aware_values_to_utc():
    value = datetime(2026, 2, 3, 6, 5, 6, tzinfo=timezone(timedelta(hours=2)))

    assert iso_datetime(value) == '2026-02-03T04:05:06Z'


def test_reservation_json_serializes_all_public_fields():
    reservation = SimpleNamespace(
        id=7,
        reference='RES-2026-000007',
        user_id=3,
        item_type='FLIGHT',
        item_id=42,
        item_label=None,
        quantity=2,
        unit_price=Decimal('25.50'),
        total_amount=Decimal('51.00'),
        status='PENDING',
        reservation_date=datetime(2026, 1, 1, 12, 0, 0),
        departure_date=date(2026, 1, 2),
        cancellation_reason=None,
    )

    assert reservation_json(reservation) == {
        'id': 7,
        'reference': 'RES-2026-000007',
        'userId': 3,
        'typeItem': 'FLIGHT',
        'itemId': 42,
        'itemLabel': '',
        'quantity': 2,
        'unitPrice': 25.5,
        'totalAmount': 51.0,
        'status': 'PENDING',
        'reservationDate': '2026-01-01T12:00:00Z',
        'departureDate': '2026-01-02',
        'cancellationReason': '',
    }


def test_reservation_json_handles_missing_amounts():
    reservation = SimpleNamespace(
        id=1,
        reference='RES-2026-000001',
        user_id=1,
        item_type='PACKAGE',
        item_id=2,
        item_label='Trip',
        quantity=1,
        unit_price=None,
        total_amount=None,
        status='CANCELLED',
        reservation_date=None,
        departure_date=None,
        cancellation_reason='Changed my mind',
    )

    payload = reservation_json(reservation)

    assert payload['unitPrice'] == 0.0
    assert payload['totalAmount'] == 0.0
    assert payload['reservationDate'] == ''
    assert payload['departureDate'] == ''
    assert payload['cancellationReason'] == 'Changed my mind'


def test_history_json_serializes_all_public_fields():
    entry = SimpleNamespace(
        id=5,
        reservation_id=7,
        status_before=None,
        status_after='PENDING',
        comment=None,
        actor=None,
        created_at=datetime(2026, 1, 1, 12, 0, 0),
    )

    assert history_json(entry) == {
        'id': 5,
        'reservationId': 7,
        'statusBefore': '',
        'statusAfter': 'PENDING',
        'comment': '',
        'actor': '',
        'createdAt': '2026-01-01T12:00:00Z',
    }
