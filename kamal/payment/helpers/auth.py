from functools import wraps

import jwt
from flask import g, request

from config import Config
from helpers.responses import error
from helpers.security import hash_token, utcnow
from models import Session


def _identity():
    header = request.headers.get('Authorization', '')

    if not header.startswith('Bearer '):
        return None, error('UNAUTHENTICATED', 'Authentication is required.', 401)

    token = header.removeprefix('Bearer ').strip()

    if not token:
        return None, error('UNAUTHENTICATED', 'Authentication is required.', 401)

    try:
        payload = jwt.decode(
            token,
            Config.JWT_SECRET,
            algorithms=[Config.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        return None, error('TOKEN_EXPIRED', 'The session has expired.', 401)
    except jwt.InvalidTokenError:
        return None, error('UNAUTHENTICATED', 'The session is invalid.', 401)

    session = Session.query.filter_by(token_hash=hash_token(token)).first()

    if session is None or session.expires_at <= utcnow():
        return None, error('UNAUTHENTICATED', 'The session is invalid.', 401)

    try:
        user_id = int(payload.get('sub', '0'))
    except (TypeError, ValueError):
        return None, error('UNAUTHENTICATED', 'The session is invalid.', 401)

    if user_id <= 0:
        return None, error('UNAUTHENTICATED', 'The session is invalid.', 401)

    return {
        'user_id': user_id,
        'role': payload.get('role', 'CLIENT'),
    }, None


def _apply(identity):
    g.user_id = identity['user_id']
    g.role = identity['role']


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        identity, failure = _identity()

        if failure is not None:
            return failure

        _apply(identity)

        return view(*args, **kwargs)

    return wrapped


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        identity, failure = _identity()

        if failure is not None:
            return failure

        if identity['role'] != 'ADMIN':
            return error('FORBIDDEN', 'Administrator access is required.', 403)

        _apply(identity)

        return view(*args, **kwargs)

    return wrapped
