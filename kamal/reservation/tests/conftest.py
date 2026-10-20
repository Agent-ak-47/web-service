import itertools
import os
import secrets
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

import jwt
import pytest
from sqlalchemy import BigInteger, Column, Integer, Table
from sqlalchemy.pool import StaticPool

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long'

os.environ['SECRET_KEY'] = 'test-flask-secret'
os.environ['JWT_SECRET'] = JWT_SECRET
os.environ['DB_PASSWORD'] = 'test-password'

import config

config.Config.SQLALCHEMY_DATABASE_URI = 'sqlite://'
config.Config.SQLALCHEMY_ENGINE_OPTIONS = {
    'connect_args': {'check_same_thread': False},
    'poolclass': StaticPool,
}

import controls.reservation as reservation_control
from helpers.security import hash_token
from index import create_app
from models import Reservation, ReservationHistory, Session, db

for table in db.metadata.tables.values():
    for column in table.primary_key.columns:
        if isinstance(column.type, BigInteger):
            column.type = Integer()

if 'users' not in db.metadata.tables:
    Table('users', db.metadata, Column('id', Integer, primary_key=True))


class CatalogStub:
    def __init__(self):
        self.item = {
            'price': '25.00',
            'availableSeats': 5,
            'active': True,
            'airline': 'Air X',
            'flightNumber': 'AX1',
            'departureCity': 'Paris',
            'arrivalCity': 'Rome',
        }
        self.fetch_error = None
        self.reserve_error = None
        self.release_error = None
        self.fetch_calls = []
        self.reserve_calls = []
        self.release_calls = []

    def fetch_item(self, item_type, item_id):
        self.fetch_calls.append((item_type, item_id))

        if self.fetch_error is not None:
            raise self.fetch_error

        return dict(self.item)

    def reserve_item(self, item_type, item_id, quantity, reservation_id):
        self.reserve_calls.append((item_type, item_id, quantity, reservation_id))

        if self.reserve_error is not None:
            raise self.reserve_error

    def release_item(self, item_type, item_id, quantity, reservation_id):
        self.release_calls.append((item_type, item_id, quantity, reservation_id))

        if self.release_error is not None:
            raise self.release_error


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


@pytest.fixture(autouse=True)
def catalog(monkeypatch):
    stub = CatalogStub()
    monkeypatch.setattr(reservation_control, 'fetch_item', stub.fetch_item)
    monkeypatch.setattr(reservation_control, 'reserve_item', stub.reserve_item)
    monkeypatch.setattr(reservation_control, 'release_item', stub.release_item)

    return stub


@pytest.fixture()
def auth_for():
    def _auth_for(user_id=1, role='CLIENT', session_expired=False):
        now = datetime.now(timezone.utc)
        token = jwt.encode(
            {
                'sub': str(user_id),
                'role': role,
                'email': f'user{user_id}@example.com',
                'iat': now,
                'exp': now + timedelta(hours=1),
                'jti': secrets.token_hex(8),
            },
            config.Config.JWT_SECRET,
            algorithm=config.Config.JWT_ALGORITHM,
        )
        expires_at = now - timedelta(minutes=1) if session_expired else now + timedelta(minutes=30)
        db.session.add(Session(
            user_id=user_id,
            token_hash=hash_token(token),
            expires_at=expires_at.replace(tzinfo=None),
        ))
        db.session.commit()

        return {'Authorization': f'Bearer {token}'}

    return _auth_for


@pytest.fixture()
def make_reservation():
    references = itertools.count(1)

    def _make_reservation(
        user_id=1,
        status='PENDING',
        quantity=2,
        unit_price='25.00',
        item_type='FLIGHT',
        item_id=10,
        item_label='Air X AX1 Paris -> Rome',
        cancellation_reason=None,
    ):
        unit = Decimal(str(unit_price))
        reservation = Reservation(
            reference=f'RES-2026-{next(references):06d}',
            user_id=user_id,
            item_type=item_type,
            item_id=item_id,
            item_label=item_label,
            quantity=quantity,
            reservation_date=datetime(2026, 1, 1),
            unit_price=unit,
            total_amount=unit * quantity,
            status=status,
            cancellation_reason=cancellation_reason,
        )
        db.session.add(reservation)
        db.session.commit()

        return reservation

    return _make_reservation


@pytest.fixture()
def make_history():
    def _make_history(reservation_id, before, after, actor='client', comment=None, created_at=None):
        entry = ReservationHistory(
            reservation_id=reservation_id,
            status_before=before,
            status_after=after,
            comment=comment,
            actor=actor,
            created_at=created_at or datetime(2026, 1, 1),
        )
        db.session.add(entry)
        db.session.commit()

        return entry

    return _make_history
