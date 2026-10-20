import pytest

from helpers.validators import clean, is_email, is_password


@pytest.mark.parametrize(
    'value, expected',
    [
        ('  hello  ', 'hello'),
        ('hello', 'hello'),
        ('', ''),
        ('   ', ''),
        (None, ''),
        (123, ''),
        (['x'], ''),
    ],
)
def test_clean(value, expected):
    assert clean(value) == expected


@pytest.mark.parametrize(
    'value',
    [
        'client@example.com',
        'first.last@sub.example.co',
        'a@b.c',
    ],
)
def test_is_email_accepts_valid_addresses(value):
    assert is_email(value) is True


@pytest.mark.parametrize(
    'value',
    [
        'plainaddress',
        '@example.com',
        'client@',
        'client@example',
        'cli ent@example.com',
        'client@exa mple.com',
        '',
    ],
)
def test_is_email_rejects_invalid_addresses(value):
    assert is_email(value) is False


@pytest.mark.parametrize(
    'value',
    [
        '12345678',
        'Password123!',
        'a' * 200,
    ],
)
def test_is_password_accepts_minimum_length(value):
    assert is_password(value) is True


@pytest.mark.parametrize(
    'value',
    [
        'short',
        '1234567',
        '',
        None,
        12345678,
    ],
)
def test_is_password_rejects_invalid_values(value):
    assert is_password(value) is False
