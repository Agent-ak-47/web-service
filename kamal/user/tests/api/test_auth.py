from datetime import datetime, timedelta, timezone

import jwt
import pytest

from config import Config
from helpers.security import create_token, hash_token
from models import Session, User, db


def register(client, email='client@example.com', password='Password123!'):
    return client.post('/api/auth/register', json={
        'email': email,
        'password': password,
    })


def login(client, email='client@example.com', password='Password123!'):
    return client.post('/api/auth/login', json={
        'email': email,
        'password': password,
    })


def test_register_creates_a_client_and_opens_a_session(client):
    response = register(client, ' New.User@Example.com ')

    assert response.status_code == 201
    data = response.get_json()['data']
    assert data['jeton']
    assert data['expiration'].endswith('Z')
    assert data['user'] == {
        'id': 1,
        'name': '',
        'email': 'new.user@example.com',
        'role': 'CLIENT',
        'phone': '',
        'address': '',
    }
    assert 'password' not in data['user']
    assert Session.query.count() == 1


def test_register_rejects_a_duplicate_email_case_insensitively(client):
    assert register(client, 'client@example.com').status_code == 201

    response = register(client, 'CLIENT@EXAMPLE.COM')

    assert response.status_code == 409
    assert response.get_json()['error']['code'] == 'DUPLICATE'


def test_register_requires_a_json_body(client):
    response = client.post('/api/auth/register')

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'INVALID_FORMAT'


@pytest.mark.parametrize(
    'payload, code',
    [
        ({'password': 'Password123!'}, 'MISSING_FIELD'),
        ({'email': 'client@example.com'}, 'MISSING_FIELD'),
        ({'email': 'not-an-email', 'password': 'Password123!'}, 'INVALID_FORMAT'),
        ({'email': 'client@example.com', 'password': 'short'}, 'INVALID_FORMAT'),
        ({'email': 'client@example.com', 'password': 12345678}, 'INVALID_FORMAT'),
    ],
)
def test_register_validates_the_payload(client, payload, code):
    response = client.post('/api/auth/register', json=payload)

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == code


def test_login_returns_a_session_for_valid_credentials(client, make_user):
    make_user(email='client@example.com', password='Password123!')

    response = login(client, ' CLIENT@Example.com ', 'Password123!')

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['jeton']
    assert data['user']['email'] == 'client@example.com'
    assert Session.query.count() == 1


def test_login_rejects_a_wrong_password(client, make_user):
    make_user()

    response = login(client, password='WrongPassword!')

    assert response.status_code == 401
    assert response.get_json()['error']['code'] == 'UNAUTHENTICATED'


def test_login_rejects_an_unknown_email(client):
    response = login(client, 'nobody@example.com')

    assert response.status_code == 401


def test_login_rejects_an_inactive_account(client, make_user):
    make_user(active=False)

    response = login(client)

    assert response.status_code == 401


@pytest.mark.parametrize(
    'payload',
    [
        {},
        {'email': 'client@example.com'},
        {'password': 'Password123!'},
    ],
)
def test_login_requires_email_and_password(client, payload):
    response = client.post('/api/auth/login', json=payload)

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'MISSING_FIELD'


def test_login_requires_a_json_body(client):
    response = client.post('/api/auth/login')

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'INVALID_FORMAT'


def test_login_removes_expired_sessions(client, make_user):
    user = make_user()
    db.session.add(Session(
        user_id=user.id,
        token_hash=hash_token('stale-token'),
        expires_at=datetime(2000, 1, 1),
    ))
    db.session.commit()

    response = login(client)

    assert response.status_code == 200
    assert Session.query.count() == 1


def test_me_requires_authentication(client):
    response = client.get('/api/auth/me')

    assert response.status_code == 401
    assert response.get_json()['error']['code'] == 'UNAUTHENTICATED'


def test_me_returns_the_current_user(client, make_user, auth_for):
    user = make_user(email='me@example.com', role='ADMIN', name='Me')

    response = client.get('/api/auth/me', headers=auth_for(user))

    assert response.status_code == 200
    assert response.get_json()['data']['email'] == 'me@example.com'
    assert response.get_json()['data']['role'] == 'ADMIN'


def test_me_rejects_a_token_without_a_session_row(client, make_user):
    user = make_user()
    token, _ = create_token(user)

    response = client.get(
        '/api/auth/me',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 401


def test_me_rejects_an_expired_session(client, make_user, auth_for):
    user = make_user()

    response = client.get(
        '/api/auth/me',
        headers=auth_for(user, expires_in_minutes=-1),
    )

    assert response.status_code == 401


def test_me_rejects_an_expired_token(client):
    token = jwt.encode(
        {
            'sub': '1',
            'role': 'CLIENT',
            'exp': datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        Config.JWT_SECRET,
        algorithm=Config.JWT_ALGORITHM,
    )

    response = client.get(
        '/api/auth/me',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 401
    assert response.get_json()['error']['code'] == 'TOKEN_EXPIRED'


@pytest.mark.parametrize(
    'header',
    [
        {},
        {'Authorization': 'Token abc'},
        {'Authorization': 'Bearer '},
        {'Authorization': 'Bearer not-a-jwt'},
    ],
)
def test_me_rejects_invalid_authorization_headers(client, header):
    response = client.get('/api/auth/me', headers=header)

    assert response.status_code == 401


def test_me_rejects_an_inactive_user(client, make_user, auth_for):
    user = make_user(active=False)

    response = client.get('/api/auth/me', headers=auth_for(user))

    assert response.status_code == 401


def test_logout_revokes_the_session(client, make_user, auth_for):
    user = make_user()
    headers = auth_for(user)

    response = client.post('/api/auth/logout', headers=headers)

    assert response.status_code == 200
    assert response.get_json()['data'] == {'success': True}
    assert Session.query.count() == 0
    assert client.get('/api/auth/me', headers=headers).status_code == 401


def test_logout_requires_authentication(client):
    response = client.post('/api/auth/logout')

    assert response.status_code == 401


def test_update_me_changes_the_profile(client, make_user, auth_for):
    user = make_user()
    headers = auth_for(user)

    response = client.post('/api/auth/me', json={
        'name': '  Alice  ',
        'phone': '0612345678',
        'address': '1 Main Street',
    }, headers=headers)

    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['user']['name'] == 'Alice'
    assert data['user']['phone'] == '0612345678'
    assert data['user']['address'] == '1 Main Street'
    assert data['jeton']
    assert data['expiration'].endswith('Z')

    stored = db.session.get(User, user.id)
    assert stored.name == 'Alice'
    assert stored.phone == '0612345678'
    assert stored.address == '1 Main Street'


def test_update_me_requires_a_json_body(client, make_user, auth_for):
    user = make_user()

    response = client.post('/api/auth/me', headers=auth_for(user))

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'INVALID_FORMAT'


def test_update_me_requires_a_name(client, make_user, auth_for):
    user = make_user()

    response = client.post(
        '/api/auth/me',
        json={'name': '   ', 'phone': '', 'address': ''},
        headers=auth_for(user),
    )

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'MISSING_FIELD'


@pytest.mark.parametrize(
    'payload',
    [
        {'name': 'a' * 81},
        {'name': 'Alice', 'phone': '1' * 31},
        {'name': 'Alice', 'address': 'a' * 256},
    ],
)
def test_update_me_rejects_values_that_are_too_long(client, make_user, auth_for, payload):
    user = make_user()

    response = client.post('/api/auth/me', json=payload, headers=auth_for(user))

    assert response.status_code == 400
    assert response.get_json()['error']['code'] == 'INVALID_FORMAT'


def test_update_me_requires_authentication(client):
    response = client.post('/api/auth/me', json={'name': 'Alice'})

    assert response.status_code == 401


def test_health_endpoint(client):
    response = client.get('/health')

    assert response.status_code == 200
    assert response.get_json() == {'status': 'ok'}


def test_unknown_route_returns_the_error_envelope(client):
    response = client.get('/api/unknown')

    assert response.status_code == 404
    assert response.get_json()['error']['code'] == 'NOT_FOUND'


def test_wrong_method_returns_the_error_envelope(client):
    response = client.delete('/api/auth/login')

    assert response.status_code == 405
    assert response.get_json()['error']['code'] == 'METHOD_NOT_ALLOWED'
