from decimal import Decimal

import pytest

from helpers.catalog import (
    ServiceUnavailable,
    available_seats_of,
    is_item_active,
    label_of,
    price_of,
)


@pytest.mark.parametrize(
    'item_type, item, expected',
    [
        ('FLIGHT', {'price': '120.50'}, Decimal('120.50')),
        ('EXCURSION', {'price': 99}, Decimal('99.00')),
        ('PACKAGE', {'price': '100.00', 'promoPrice': '80.00'}, Decimal('80.00')),
        ('PACKAGE', {'price': '100.00'}, Decimal('100.00')),
        ('PACKAGE', {'price': '100.00', 'promoPrice': None}, Decimal('100.00')),
    ],
)
def test_price_of_selects_the_correct_price(item_type, item, expected):
    assert price_of(item_type, item) == expected


def test_price_of_rounds_half_up():
    assert price_of('FLIGHT', {'price': '10.005'}) == Decimal('10.01')


@pytest.mark.parametrize(
    'item_type, item',
    [
        ('FLIGHT', {}),
        ('FLIGHT', {'price': 'free'}),
        ('FLIGHT', {'price': None}),
        ('FLIGHT', {'price': '-1'}),
        ('PACKAGE', {'price': '10.00', 'promoPrice': 'oops'}),
    ],
)
def test_price_of_rejects_invalid_prices(item_type, item):
    with pytest.raises(ServiceUnavailable):
        price_of(item_type, item)


@pytest.mark.parametrize(
    'item_type, item, expected',
    [
        ('PACKAGE', {'price': '10.00'}, None),
        ('FLIGHT', {'availableSeats': 12}, 12),
        ('FLIGHT', {'availableSeats': '12'}, 12),
        ('EXCURSION', {'availableSeats': 0}, 0),
    ],
)
def test_available_seats_of(item_type, item, expected):
    assert available_seats_of(item_type, item) == expected


@pytest.mark.parametrize(
    'item_type, item',
    [
        ('FLIGHT', {}),
        ('FLIGHT', {'availableSeats': 'many'}),
        ('EXCURSION', {'availableSeats': None}),
    ],
)
def test_available_seats_of_rejects_invalid_values(item_type, item):
    with pytest.raises(ServiceUnavailable):
        available_seats_of(item_type, item)


@pytest.mark.parametrize(
    'item_type, item, expected',
    [
        ('FLIGHT', {}, True),
        ('FLIGHT', {'active': False}, False),
        ('PACKAGE', {}, True),
        ('PACKAGE', {'available': False}, False),
        ('EXCURSION', {'available': True}, True),
    ],
)
def test_is_item_active(item_type, item, expected):
    assert is_item_active(item_type, item) is expected


@pytest.mark.parametrize(
    'item_type, item, expected',
    [
        (
            'FLIGHT',
            {
                'airline': 'Air X',
                'flightNumber': 'AX1',
                'departureCity': 'Paris',
                'arrivalCity': 'Rome',
            },
            'Air X AX1 Paris -> Rome',
        ),
        ('PACKAGE', {'name': 'Rome Package'}, 'Rome Package'),
        ('EXCURSION', {'title': 'Desert Tour', 'location': 'Merzouga'}, 'Desert Tour (Merzouga)'),
        ('EXCURSION', {'title': 'Desert Tour'}, 'Desert Tour'),
    ],
)
def test_label_of(item_type, item, expected):
    assert label_of(item_type, item) == expected


def test_label_of_is_limited_to_160_characters():
    label = label_of('PACKAGE', {'name': 'x' * 500})

    assert len(label) == 160
    assert label == 'x' * 160
