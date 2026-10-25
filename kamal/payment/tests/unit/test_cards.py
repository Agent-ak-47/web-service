from datetime import datetime, timezone

import pytest

from helpers.cards import (
    is_valid_card,
    is_valid_expiry,
    mask_of,
    normalize_card_number,
)


CURRENT_YEAR = datetime.now(timezone.utc).year
PAST_EXPIRY = f'12/{CURRENT_YEAR - 1}'


def expiry_in(years=1, month=12):
    return f'{month:02d}/{CURRENT_YEAR + years}'


@pytest.mark.parametrize(
    'value, expected',
    [
        ('4111 1111 1111 1111', '4111111111111111'),
        ('4111-1111-1111-1111', '4111111111111111'),
        (' 4111111111111111 ', '4111111111111111'),
        ('', ''),
        (None, ''),
        (4111111111111111, ''),
    ],
)
def test_normalize_card_number(value, expected):
    assert normalize_card_number(value) == expected


@pytest.mark.parametrize(
    'value, expected',
    [
        ('4111111111111111', '1111'),
        ('4000000000000002', '0002'),
    ],
)
def test_mask_of_keeps_the_last_four_digits(value, expected):
    assert mask_of(value) == expected


def test_is_valid_expiry_accepts_the_current_month():
    now = datetime.now(timezone.utc)

    assert is_valid_expiry(f'{now.month:02d}/{now.year}') is True


@pytest.mark.parametrize(
    'value',
    [
        expiry_in(1),
        expiry_in(5),
        expiry_in(10),
        f'  {expiry_in(2)}  ',
    ],
)
def test_is_valid_expiry_accepts_future_dates(value):
    assert is_valid_expiry(value) is True


@pytest.mark.parametrize(
    'value',
    [
        '00/30',
        '13/30',
        PAST_EXPIRY,
        '1/30',
        '12-30',
        '12/203',
        'expired',
        '',
        None,
        1234,
    ],
)
def test_is_valid_expiry_rejects_invalid_dates(value):
    assert is_valid_expiry(value) is False


def test_is_valid_card_accepts_complete_details(future_expiry):
    assert is_valid_card('4111111111111111', future_expiry, '123') is True
    assert is_valid_card('411111111111', future_expiry, '1234') is True
    assert is_valid_card('4' * 19, future_expiry, '000') is True


@pytest.mark.parametrize(
    'card_number',
    [
        '41111111111',
        '4' * 20,
        '4111 1111 1111 1111',
        '411111111111111a',
        '',
    ],
)
def test_is_valid_card_rejects_invalid_numbers(card_number, future_expiry):
    assert is_valid_card(card_number, future_expiry, '123') is False


@pytest.mark.parametrize(
    'expiration',
    [PAST_EXPIRY, '13/30', 'bad', None],
)
def test_is_valid_card_rejects_invalid_expirations(expiration):
    assert is_valid_card('4111111111111111', expiration, '123') is False


@pytest.mark.parametrize(
    'cvv',
    ['12', '12345', 'abc', '', None, 123],
)
def test_is_valid_card_rejects_invalid_cvv(cvv, future_expiry):
    assert is_valid_card('4111111111111111', future_expiry, cvv) is False
