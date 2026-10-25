import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from config import Config

PBKDF2_ALGORITHM = 'pbkdf2_sha256'
PBKDF2_ITERATIONS = 100000


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso_datetime(value):
    if value is None:
        return ''

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        PBKDF2_ITERATIONS,
    )

    return f'{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${salt}${digest.hex()}'


def verify_password(password, encoded):
    if not isinstance(encoded, str):
        return False

    try:
        algorithm, iterations, salt, expected = encoded.split('$', 3)
        digest = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            int(iterations),
        )
    except (ValueError, TypeError):
        return False

    return algorithm == PBKDF2_ALGORITHM and hmac.compare_digest(digest.hex(), expected)


def hash_token(token):
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def create_token(user):
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(minutes=Config.JWT_TTL_MINUTES)
    payload = {
        'sub': str(user.id),
        'role': user.role,
        'email': user.email,
        'iat': issued_at,
        'exp': expires_at,
    }
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)

    return token, expires_at
