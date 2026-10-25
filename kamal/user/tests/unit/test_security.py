import hashlib
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from config import Config
from helpers.security import (
    create_token,
    hash_password,
    hash_token,
    iso_datetime,
    verify_password,
)


class FakeUser:
    id = 42
    role = 'ADMIN'
    email = 'admin@example.com'


def test_hash_password_returns_pbkdf2_envelope():
    encoded = hash_password('Password123!')
    algorithm, iterations, salt, digest = encoded.split('$')

    assert algorithm == 'pbkdf2_sha256'
    assert iterations == '100000'
    assert len(salt) == 32
    assert len(digest) == 64


def test_hash_password_uses_a_random_salt():
    assert hash_password('Password123!') != hash_password('Password123!')


def test_verify_password_accepts_the_original_password():
    encoded = hash_password('Password123!')

    assert verify_password('Password123!', encoded) is True
    assert verify_password('password123!', encoded) is False


@pytest.mark.parametrize(
    'encoded',
    [
        None,
        '',
        'pbkdf2_sha256',
        'pbkdf2_sha256$not-a-number$salt$digest',
        'pbkdf2_sha256$100000$salt',
        'bcrypt$100000$salt$digest',
    ],
)
def test_verify_password_rejects_malformed_hashes(encoded):
    assert verify_password('Password123!', encoded) is False


def test_hash_token_is_sha256_hex():
    assert hash_token('token') == hashlib.sha256(b'token').hexdigest()


def test_iso_datetime_handles_none():
    assert iso_datetime(None) == ''


def test_iso_datetime_marks_naive_values_as_utc():
    assert iso_datetime(datetime(2026, 1, 2, 3, 4, 5)) == '2026-01-02T03:04:05Z'


def test_iso_datetime_converts_aware_values_to_utc():
    value = datetime(2026, 1, 2, 5, 4, 5, tzinfo=timezone(timedelta(hours=2)))

    assert iso_datetime(value) == '2026-01-02T03:04:05Z'


def test_create_token_contains_the_user_identity_and_ttl():
    before = datetime.now(timezone.utc)
    token, expires_at = create_token(FakeUser())
    payload = jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALGORITHM])

    assert payload['sub'] == '42'
    assert payload['role'] == 'ADMIN'
    assert payload['email'] == 'admin@example.com'
    assert expires_at.tzinfo is not None
    assert expires_at - datetime.now(timezone.utc) <= timedelta(
        minutes=Config.JWT_TTL_MINUTES,
    )
    assert expires_at >= before
