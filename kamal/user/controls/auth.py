from datetime import datetime, timezone

from flask import Blueprint, g, request
from sqlalchemy.exc import IntegrityError

from helpers.auth import login_required
from helpers.responses import error, success
from helpers.security import (
    create_token,
    hash_password,
    hash_token,
    iso_datetime,
    utcnow,
    verify_password,
)
from helpers.validators import clean, is_email, is_password
from models import Session, User, db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

MAX_NAME_LENGTH = 80
MAX_PHONE_LENGTH = 30
MAX_ADDRESS_LENGTH = 255


def _body():
    payload = request.get_json(silent=True)

    return payload if isinstance(payload, dict) else None


def _session_payload(user, token, expires_at):
    return {
        'jeton': token,
        'expiration': iso_datetime(expires_at),
        'user': user.to_json(),
    }


def _open_session(user):
    token, expires_at = create_token(user)
    db.session.add(Session(
        user_id=user.id,
        token_hash=hash_token(token),
        ip_address=request.remote_addr,
        expires_at=expires_at.astimezone(timezone.utc).replace(tzinfo=None),
    ))

    return token, expires_at


@auth_bp.post('/register')
def register():
    body = _body()

    if body is None:
        return error('INVALID_FORMAT', 'A JSON body is required.')

    email = clean(body.get('email')).lower()
    password = body.get('password')

    if not email or not password:
        return error('MISSING_FIELD', 'Email and password are required.')

    if not is_email(email):
        return error('INVALID_FORMAT', 'The email address is invalid.')

    if not is_password(password):
        return error('INVALID_FORMAT', 'The password must contain at least 8 characters.')

    if User.query.filter_by(email=email).first() is not None:
        return error('DUPLICATE', 'This email is already used.', 409)

    user = User(
        name='',
        email=email,
        password_hash=hash_password(password),
        role='CLIENT',
        phone='',
        address='',
        active=True,
    )
    db.session.add(user)

    try:
        db.session.flush()
        token, expires_at = _open_session(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

        return error('DUPLICATE', 'This email is already used.', 409)

    return success(_session_payload(user, token, expires_at), 201)


@auth_bp.post('/login')
def login():
    body = _body()

    if body is None:
        return error('INVALID_FORMAT', 'A JSON body is required.')

    email = clean(body.get('email')).lower()
    password = body.get('password')

    if not email or not password:
        return error('MISSING_FIELD', 'Email and password are required.')

    user = User.query.filter_by(email=email, active=True).first()

    if user is None or not verify_password(password, user.password_hash):
        return error('UNAUTHENTICATED', 'The email or password is incorrect.', 401)

    Session.query.filter(Session.expires_at <= utcnow()).delete(synchronize_session=False)

    token, expires_at = _open_session(user)
    db.session.commit()

    return success(_session_payload(user, token, expires_at))


@auth_bp.post('/logout')
@login_required
def logout():
    Session.query.filter_by(token_hash=hash_token(g.token)).delete(synchronize_session=False)
    db.session.commit()

    return success({'success': True})


@auth_bp.get('/me')
@login_required
def read_me():
    user = db.session.get(User, g.user_id)

    if user is None or not user.active:
        return error('UNAUTHENTICATED', 'The session is invalid.', 401)

    return success(user.to_json())


@auth_bp.post('/me')
@login_required
def update_me():
    body = _body()

    if body is None:
        return error('INVALID_FORMAT', 'A JSON body is required.')

    name = clean(body.get('name'))
    phone = clean(body.get('phone'))
    address = clean(body.get('address'))

    if not name:
        return error('MISSING_FIELD', 'The name is required.')

    if len(name) > MAX_NAME_LENGTH:
        return error('INVALID_FORMAT', 'The name is too long.')

    if len(phone) > MAX_PHONE_LENGTH:
        return error('INVALID_FORMAT', 'The phone number is too long.')

    if len(address) > MAX_ADDRESS_LENGTH:
        return error('INVALID_FORMAT', 'The address is too long.')

    user = db.session.get(User, g.user_id)

    if user is None or not user.active:
        return error('UNAUTHENTICATED', 'The session is invalid.', 401)

    user.name = name
    user.phone = phone
    user.address = address
    db.session.commit()

    expires_at = datetime.fromtimestamp(int(g.token_expiration), tz=timezone.utc)

    return success(_session_payload(user, g.token, expires_at))
