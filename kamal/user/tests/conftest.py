import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from sqlalchemy import BigInteger, Integer
from sqlalchemy.pool import StaticPool

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long'

os.environ['SECRET_KEY'] = 'test-flask-secret'
os.environ['JWT_SECRET'] = JWT_SECRET
os.environ['JWT_TTL_MINUTES'] = '120'
os.environ['DB_PASSWORD'] = 'test-password'

import config

config.Config.SQLALCHEMY_DATABASE_URI = 'sqlite://'
config.Config.SQLALCHEMY_ENGINE_OPTIONS = {
    'connect_args': {'check_same_thread': False},
    'poolclass': StaticPool,
}

from helpers.security import create_token, hash_password, hash_token
from index import create_app
from models import Session, User, db

for table in db.metadata.tables.values():
    for column in table.primary_key.columns:
        if isinstance(column.type, BigInteger):
            column.type = Integer()


@pytest.fixture()
def app():
    application = create_app()
    application.config.update(TESTING=True)

    context = application.app_context()
    context.push()
    db.drop_all()
    db.create_all()

    yield application

    db.session.remove()
    db.drop_all()
    context.pop()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def make_user():
    def _make_user(
        email='client@example.com',
        password='Password123!',
        role='CLIENT',
        name='Client',
        phone='',
        address='',
        active=True,
    ):
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
            phone=phone,
            address=address,
            active=active,
        )
        db.session.add(user)
        db.session.commit()

        return user

    return _make_user


@pytest.fixture()
def auth_for():
    def _auth_for(user, expires_in_minutes=60):
        token, _ = create_token(user)
        db.session.add(Session(
            user_id=user.id,
            token_hash=hash_token(token),
            ip_address='127.0.0.1',
            expires_at=(
                datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)
            ).replace(tzinfo=None),
        ))
        db.session.commit()

        return {'Authorization': f'Bearer {token}'}

    return _auth_for
