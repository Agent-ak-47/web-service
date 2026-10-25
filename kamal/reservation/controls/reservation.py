import secrets
import traceback
from datetime import datetime, timezone
from decimal import Decimal

from flask import Blueprint, current_app, g, request
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError

from helpers.auth import admin_required, login_required
from helpers.catalog import (
    InsufficientAvailability,
    ItemNotFound,
    ServiceUnavailable,
    available_seats_of,
    departure_date_of,
    fetch_item,
    is_item_active,
    label_of,
    price_of,
    release_item,
    reserve_item,
)
from helpers.pagination import FETCH_NUM
from helpers.responses import error, success
from helpers.security import utcnow
from helpers.serializers import history_json, reservation_json
from models import Reservation, ReservationHistory, db

reservations_bp = Blueprint('reservations', __name__, url_prefix='/api/reservations')

ITEM_TYPES = ('FLIGHT', 'PACKAGE', 'EXCURSION')
RESERVATION_STATUSES = ('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'REFUNDED', 'EXPIRED')
STOCK_HELD_STATUSES = ('PENDING', 'CONFIRMED')
CANCELLABLE_STATUSES = ('PENDING', 'CONFIRMED', 'PAID')
CANCELLATION_NOTICE_DAYS = 2
MONEY_QUANTUM = Decimal('0.01')
MAX_QUANTITY = 65535
MAX_TOTAL = Decimal('99999999.99')
MAX_SEARCH_LENGTH = 120


def _body():
    payload = request.get_json(silent=True)

    return payload if isinstance(payload, dict) else None


def _positive_int(value):
    if isinstance(value, bool):
        return None

    try:
        number = int(value)
    except (TypeError, ValueError):
        return None

    return number if number > 0 else None


def _actor():
    return 'admin' if g.role == 'ADMIN' else 'client'


def _reference(reservation_id):
    year = datetime.now(timezone.utc).year

    return f'RES-{year}-{reservation_id:06d}'


def _add_history(reservation_id, before, after, actor, comment=None):
    db.session.add(ReservationHistory(
        reservation_id=reservation_id,
        status_before=before,
        status_after=after,
        comment=comment,
        actor=actor,
        created_at=utcnow(),
    ))


def _owned(reservation_id):
    reservation = db.session.get(Reservation, reservation_id)

    if reservation is None:
        return None, error('NOT_FOUND', 'Reservation not found.', 404)

    if g.role != 'ADMIN' and reservation.user_id != g.user_id:
        return None, error('FORBIDDEN', 'You cannot access this reservation.', 403)

    return reservation, None


def _owned_locked(reservation_id):
    reservation = db.session.execute(
        select(Reservation)
        .where(Reservation.id == reservation_id)
        .with_for_update()
    ).scalar_one_or_none()

    if reservation is None:
        db.session.rollback()

        return None, error('NOT_FOUND', 'Reservation not found.', 404)

    if g.role != 'ADMIN' and reservation.user_id != g.user_id:
        db.session.rollback()

        return None, error('FORBIDDEN', 'You cannot access this reservation.', 403)

    return reservation, None


def _best_effort_release(item_type, item_id, quantity, reservation_id):
    try:
        release_item(item_type, item_id, quantity, reservation_id)
    except Exception:
        current_app.logger.warning(
            'Compensating release failed for reservation %s.', reservation_id,
        )
        traceback.print_exc()


def _departure_date(reservation):
    if reservation.departure_date is not None:
        return reservation.departure_date

    try:
        item = fetch_item(reservation.item_type, reservation.item_id)
    except (ItemNotFound, ServiceUnavailable):
        return None

    return departure_date_of(reservation.item_type, item)


def _client_can_cancel(departure):
    if departure is None:
        return True

    remaining = (departure - datetime.now(timezone.utc).date()).days

    return remaining >= CANCELLATION_NOTICE_DAYS


def _best_effort_reserve(item_type, item_id, quantity, reservation_id):
    try:
        reserve_item(item_type, item_id, quantity, reservation_id)
    except Exception:
        current_app.logger.warning(
            'Compensating reserve failed for reservation %s.', reservation_id,
        )
        traceback.print_exc()


@reservations_bp.post('')
@login_required
def create_reservation():
    body = _body()

    if body is None:
        return error('INVALID_FORMAT', 'A JSON body is required.')

    item_type = str(body.get('typeItem', '')).upper()
    item_id = _positive_int(body.get('itemId'))
    quantity = _positive_int(body.get('quantity'))

    if item_type not in ITEM_TYPES:
        return error('INVALID_FORMAT', 'The item type is invalid.')

    if item_id is None or quantity is None:
        return error('MISSING_FIELD', 'Item id and quantity are required.')

    if quantity > MAX_QUANTITY:
        return error('INVALID_FORMAT', 'The quantity is too large.')

    try:
        item = fetch_item(item_type, item_id)
    except ItemNotFound:
        return error('ITEM_NOT_FOUND', 'The product does not exist.', 422, {'itemId': item_id})
    except ServiceUnavailable:
        return error(
            'SERVICE_UNAVAILABLE',
            'The catalogue service is temporarily unavailable.',
            502,
        )

    if not is_item_active(item_type, item):
        return error(
            'INSUFFICIENT_AVAILABILITY',
            'This product is not available.',
            409,
            {'itemId': item_id},
        )

    departure_date = departure_date_of(item_type, item)

    if departure_date is not None and departure_date < datetime.now(timezone.utc).date():
        return error(
            'BUSINESS_RULE_VIOLATION',
            'This product can no longer be booked because its start date has passed.',
            422,
            {'departureDate': departure_date.isoformat()},
        )

    try:
        available = available_seats_of(item_type, item)
        unit_price = price_of(item_type, item)
    except ServiceUnavailable:
        return error(
            'SERVICE_UNAVAILABLE',
            'The catalogue service returned an invalid response.',
            502,
        )

    if available is not None and available < quantity:
        return error(
            'INSUFFICIENT_AVAILABILITY',
            f'Only {available} place(s) are left for this item.',
            409,
            {'itemId': item_id, 'requested': quantity, 'available': available},
        )

    total_amount = (unit_price * quantity).quantize(MONEY_QUANTUM)

    if total_amount > MAX_TOTAL:
        return error(
            'BUSINESS_RULE_VIOLATION',
            'The reservation total is too large.',
            422,
        )

    label = label_of(item_type, item) or f'{item_type.title()} #{item_id}'
    reservation = Reservation(
        reference=f'TMP-{secrets.token_hex(8)}',
        user_id=g.user_id,
        item_type=item_type,
        item_id=item_id,
        item_label=label,
        quantity=quantity,
        reservation_date=utcnow(),
        departure_date=departure_date,
        unit_price=unit_price,
        total_amount=total_amount,
        status='PENDING',
    )
    db.session.add(reservation)

    reservation_id = None
    reserve_attempted = False
    held = False

    try:
        db.session.flush()
        reservation_id = reservation.id
        reservation.reference = _reference(reservation_id)
        reserve_attempted = True
        reserve_item(item_type, item_id, quantity, reservation_id)
        held = True
        _add_history(reservation_id, None, 'PENDING', _actor())
        db.session.commit()
    except InsufficientAvailability as exception:
        db.session.rollback()

        return error(
            'INSUFFICIENT_AVAILABILITY',
            'Not enough availability for this item.',
            409,
            exception.details,
        )
    except ItemNotFound:
        db.session.rollback()

        return error('ITEM_NOT_FOUND', 'The product does not exist.', 422, {'itemId': item_id})
    except ServiceUnavailable:
        db.session.rollback()

        if reserve_attempted and not held and reservation_id is not None:
            _best_effort_release(item_type, item_id, quantity, reservation_id)

        return error(
            'SERVICE_UNAVAILABLE',
            'The catalogue service is temporarily unavailable.',
            502,
        )
    except IntegrityError:
        db.session.rollback()

        if held and reservation_id is not None:
            _best_effort_release(item_type, item_id, quantity, reservation_id)

        return error('DUPLICATE', 'The reservation could not be created.', 409)
    except Exception as exception:
        db.session.rollback()
        print(f'[reservation] create_reservation failed: {exception!r}', flush=True)
        traceback.print_exc()

        if held and reservation_id is not None:
            _best_effort_release(item_type, item_id, quantity, reservation_id)

        return error('INTERNAL_ERROR', 'Internal server error.', 500)

    return success(reservation_json(reservation), 201)


@reservations_bp.get('')
@login_required
def list_reservations():
    search = request.args.get('search', '').strip()[:MAX_SEARCH_LENGTH]
    status = request.args.get('status', '').strip().upper()
    item_type = request.args.get('typeItem', '').strip().upper()

    if status and status not in RESERVATION_STATUSES:
        return error('INVALID_FORMAT', 'The status filter is invalid.')

    if item_type and item_type not in ITEM_TYPES:
        return error('INVALID_FORMAT', 'The item type filter is invalid.')

    query = Reservation.query

    if g.role != 'ADMIN':
        query = query.filter(Reservation.user_id == g.user_id)

    if status:
        query = query.filter(Reservation.status == status)

    if item_type:
        query = query.filter(Reservation.item_type == item_type)

    if search:
        pattern = f'%{search}%'
        query = query.filter(or_(
            Reservation.reference.ilike(pattern),
            Reservation.item_label.ilike(pattern),
        ))

    rows = (
        query
        .order_by(Reservation.reservation_date.desc(), Reservation.id.desc())
        .limit(FETCH_NUM)
        .all()
    )

    return success([reservation_json(row) for row in rows])


@reservations_bp.get('/<int:reservation_id>')
@login_required
def get_reservation(reservation_id):
    reservation, failure = _owned(reservation_id)

    if failure is not None:
        return failure

    return success(reservation_json(reservation))


@reservations_bp.get('/<int:reservation_id>/history')
@login_required
def get_reservation_history(reservation_id):
    _, failure = _owned(reservation_id)

    if failure is not None:
        return failure

    rows = (
        ReservationHistory.query
        .filter_by(reservation_id=reservation_id)
        .order_by(ReservationHistory.created_at.desc(), ReservationHistory.id.desc())
        .limit(FETCH_NUM)
        .all()
    )

    return success([history_json(row) for row in rows])


@reservations_bp.route('/<int:reservation_id>', methods=['PATCH', 'POST'])
@login_required
def update_reservation(reservation_id):
    body = _body()

    if body is None:
        return error('INVALID_FORMAT', 'A JSON body is required.')

    quantity = _positive_int(body.get('quantity'))

    if quantity is None:
        return error('MISSING_FIELD', 'A positive quantity is required.')

    if quantity > MAX_QUANTITY:
        return error('INVALID_FORMAT', 'The quantity is too large.')

    reservation, failure = _owned_locked(reservation_id)

    if failure is not None:
        return failure

    if reservation.status not in STOCK_HELD_STATUSES:
        db.session.rollback()

        return error('INVALID_STATUS', 'This reservation cannot be updated.', 409)

    delta = quantity - reservation.quantity
    total_amount = (reservation.unit_price * quantity).quantize(MONEY_QUANTUM)

    if total_amount > MAX_TOTAL:
        db.session.rollback()

        return error(
            'BUSINESS_RULE_VIOLATION',
            'The reservation total is too large.',
            422,
        )

    if delta == 0:
        db.session.rollback()

        return success(reservation_json(reservation))

    stock_changed = False

    try:
        if delta > 0:
            reserve_item(reservation.item_type, reservation.item_id, delta, reservation.id)
        else:
            release_item(reservation.item_type, reservation.item_id, -delta, reservation.id)

        stock_changed = True
        reservation.quantity = quantity
        reservation.total_amount = total_amount
        _add_history(
            reservation.id,
            reservation.status,
            reservation.status,
            _actor(),
            'Quantity updated',
        )
        db.session.commit()
    except InsufficientAvailability as exception:
        db.session.rollback()

        return error(
            'INSUFFICIENT_AVAILABILITY',
            'Not enough availability for this item.',
            409,
            exception.details,
        )
    except ItemNotFound:
        db.session.rollback()

        return error('ITEM_NOT_FOUND', 'The product does not exist.', 422)
    except ServiceUnavailable:
        db.session.rollback()

        if stock_changed:
            if delta > 0:
                _best_effort_release(
                    reservation.item_type, reservation.item_id, delta, reservation.id,
                )
            else:
                _best_effort_reserve(
                    reservation.item_type, reservation.item_id, -delta, reservation.id,
                )

        return error(
            'SERVICE_UNAVAILABLE',
            'The catalogue service is temporarily unavailable.',
            502,
        )
    except Exception as exception:
        db.session.rollback()
        print(f'[reservation] update_reservation failed: {exception!r}', flush=True)
        traceback.print_exc()

        if stock_changed:
            if delta > 0:
                _best_effort_release(
                    reservation.item_type, reservation.item_id, delta, reservation.id,
                )
            else:
                _best_effort_reserve(
                    reservation.item_type, reservation.item_id, -delta, reservation.id,
                )

        return error('INTERNAL_ERROR', 'Internal server error.', 500)

    return success(reservation_json(reservation))


@reservations_bp.post('/<int:reservation_id>/cancellation')
@login_required
def cancel_reservation(reservation_id):
    reservation, failure = _owned_locked(reservation_id)

    if failure is not None:
        return failure

    if reservation.status not in CANCELLABLE_STATUSES:
        db.session.rollback()

        return error('INVALID_STATUS', 'This reservation cannot be cancelled.', 409)

    if g.role != 'ADMIN':
        departure = _departure_date(reservation)

        if not _client_can_cancel(departure):
            db.session.rollback()

            return error(
                'BUSINESS_RULE_VIOLATION',
                f'A booking can only be cancelled at least {CANCELLATION_NOTICE_DAYS} '
                'days before its start date.',
                422,
                {
                    'departureDate': departure.isoformat(),
                    'minimumDays': CANCELLATION_NOTICE_DAYS,
                },
            )

    body = _body() or {}
    reason = str(body.get('reason') or '').strip()[:255] or 'Cancelled by the customer'
    previous_status = reservation.status
    releases_stock = previous_status in STOCK_HELD_STATUSES
    released = False

    try:
        if releases_stock:
            release_item(
                reservation.item_type,
                reservation.item_id,
                reservation.quantity,
                reservation.id,
            )
            released = True

        reservation.status = 'CANCELLED'
        reservation.cancellation_reason = reason
        _add_history(reservation.id, previous_status, 'CANCELLED', _actor())
        db.session.commit()
    except ItemNotFound:
        reservation.status = 'CANCELLED'
        reservation.cancellation_reason = reason
        _add_history(reservation.id, previous_status, 'CANCELLED', _actor())
        db.session.commit()
    except ServiceUnavailable:
        db.session.rollback()

        if released:
            _best_effort_reserve(
                reservation.item_type,
                reservation.item_id,
                reservation.quantity,
                reservation.id,
            )

        return error(
            'SERVICE_UNAVAILABLE',
            'The catalogue service is temporarily unavailable.',
            502,
        )
    except Exception as exception:
        db.session.rollback()
        print(f'[reservation] cancel_reservation failed: {exception!r}', flush=True)
        traceback.print_exc()

        if released:
            _best_effort_reserve(
                reservation.item_type,
                reservation.item_id,
                reservation.quantity,
                reservation.id,
            )

        return error('INTERNAL_ERROR', 'Internal server error.', 500)

    return success(reservation_json(reservation))


@reservations_bp.post('/<int:reservation_id>/validation')
@admin_required
def validate_reservation(reservation_id):
    reservation, failure = _owned_locked(reservation_id)

    if failure is not None:
        return failure

    if reservation.status != 'PENDING':
        db.session.rollback()

        return error('INVALID_STATUS', 'Only a pending reservation can be validated.', 409)

    reservation.status = 'CONFIRMED'
    _add_history(reservation.id, 'PENDING', 'CONFIRMED', 'admin')
    db.session.commit()

    return success(reservation_json(reservation))
