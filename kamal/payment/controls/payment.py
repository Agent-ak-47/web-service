import traceback
import uuid

from flask import Blueprint, current_app, g, request
from sqlalchemy import select

from config import Config
from helpers.auth import admin_required, login_required
from helpers.cards import is_valid_card, mask_of, normalize_card_number
from helpers.catalog import ItemNotFound, ServiceUnavailable, release_item, reserve_item
from helpers.responses import error, success
from helpers.security import utcnow
from helpers.serializers import payment_json, reservation_json
from models import Payment, Reservation, ReservationHistory, db

payments_bp = Blueprint('payments', __name__, url_prefix='/api')

PAYMENT_METHODS = ('CARD', 'CASH', 'BANK_TRANSFER', 'PAYPAL')
PAYABLE_STATUSES = ('PENDING', 'CONFIRMED')
REFUNDABLE_STATUSES = ('PAID', 'CANCELLED')


def _body():
    payload = request.get_json(silent=True)

    return payload if isinstance(payload, dict) else None


def _actor():
    return 'admin' if g.role == 'ADMIN' else 'client'


def _transaction_ref(prefix):
    return f'{prefix}-{uuid.uuid4().hex[:24].upper()}'


def _add_history(reservation_id, before, after, actor, comment=None):
    db.session.add(ReservationHistory(
        reservation_id=reservation_id,
        status_before=before,
        status_after=after,
        comment=comment,
        actor=actor,
        created_at=utcnow(),
    ))


def _successful_payment(reservation_id):
    return (
        Payment.query
        .filter_by(reservation_id=reservation_id, status='SUCCEEDED')
        .order_by(Payment.id.desc())
        .first()
    )


def _refund_payment(reservation_id):
    return (
        Payment.query
        .filter_by(reservation_id=reservation_id, status='REFUNDED')
        .order_by(Payment.id.desc())
        .first()
    )


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


def _locked(reservation_id):
    reservation = db.session.execute(
        select(Reservation)
        .where(Reservation.id == reservation_id)
        .with_for_update()
    ).scalar_one_or_none()

    if reservation is None:
        db.session.rollback()

        return None, error('NOT_FOUND', 'Reservation not found.', 404)

    return reservation, None


def _best_effort_reserve(item_type, item_id, quantity, reservation_id):
    try:
        reserve_item(item_type, item_id, quantity, reservation_id)
    except Exception:
        current_app.logger.warning(
            'Compensating reserve failed for reservation %s.', reservation_id,
        )
        traceback.print_exc()


@payments_bp.post('/reservations/<int:reservation_id>/payment')
@login_required
def pay_reservation(reservation_id):
    body = _body()

    if body is None:
        return error('INVALID_FORMAT', 'A JSON body is required.')

    method = str(body.get('method', '')).upper()

    if method not in PAYMENT_METHODS:
        return error('INVALID_FORMAT', 'The payment method is invalid.')

    reservation, failure = _owned_locked(reservation_id)

    if failure is not None:
        return failure

    if reservation.status == 'PAID':
        existing = _successful_payment(reservation.id)
        db.session.rollback()

        if existing is not None:
            return success({
                'reservation': reservation_json(reservation),
                'payment': payment_json(existing),
            })

        return error('INVALID_STATUS', 'This reservation is already paid.', 409)

    if reservation.status not in PAYABLE_STATUSES:
        db.session.rollback()

        return error('INVALID_STATUS', 'This reservation cannot be paid.', 409)

    if reservation.total_amount is None or reservation.total_amount <= 0:
        db.session.rollback()

        return error(
            'BUSINESS_RULE_VIOLATION',
            'The reservation amount is invalid.',
            422,
        )

    card_number = ''
    card_mask = None

    if method == 'CARD':
        card_number = normalize_card_number(body.get('cardNumber'))

        if not is_valid_card(card_number, body.get('expiration'), body.get('cvv')):
            db.session.rollback()

            return error('INVALID_FORMAT', 'The card details are invalid.')

        card_mask = mask_of(card_number)

    if method == 'CARD' and card_number.endswith(Config.DECLINED_CARD_SUFFIX):
        declined = Payment(
            reservation_id=reservation.id,
            amount=reservation.total_amount,
            method=method,
            status='FAILED',
            payment_date=utcnow(),
            transaction_ref=_transaction_ref('FAIL'),
            card_mask=card_mask,
            error_code='PAYMENT_DECLINED',
        )
        db.session.add(declined)

        try:
            db.session.commit()
        except Exception as exception:
            db.session.rollback()
            print(f'[payment] declined payment commit failed: {exception!r}', flush=True)
            traceback.print_exc()

            return error('INTERNAL_ERROR', 'Internal server error.', 500)

        return error(
            'PAYMENT_DECLINED',
            'The payment was declined by the bank.',
            402,
            {'paymentId': declined.id},
        )

    payment = Payment(
        reservation_id=reservation.id,
        amount=reservation.total_amount,
        method=method,
        status='SUCCEEDED',
        payment_date=utcnow(),
        transaction_ref=_transaction_ref('PAY'),
        card_mask=card_mask,
        error_code=None,
    )
    db.session.add(payment)

    previous_status = reservation.status
    reservation.status = 'PAID'
    _add_history(
        reservation.id,
        previous_status,
        'PAID',
        _actor(),
        f'Payment accepted ({method})',
    )

    try:
        db.session.commit()
    except Exception as exception:
        db.session.rollback()
        print(f'[payment] payment commit failed: {exception!r}', flush=True)
        traceback.print_exc()

        return error('INTERNAL_ERROR', 'Internal server error.', 500)

    return success({
        'reservation': reservation_json(reservation),
        'payment': payment_json(payment),
    })


def _refund_locked(reservation_id):
    reservation, failure = _locked(reservation_id)

    if failure is not None:
        return failure

    if reservation.status == 'REFUNDED':
        existing = _refund_payment(reservation.id)
        db.session.rollback()

        if existing is not None:
            return success({
                'refundedAmount': float(existing.amount),
                'reservation': reservation_json(reservation),
                'payment': payment_json(existing),
            })

        return error('INVALID_STATUS', 'This reservation has already been refunded.', 409)

    if reservation.status not in REFUNDABLE_STATUSES:
        db.session.rollback()

        return error('INVALID_STATUS', 'This reservation cannot be refunded.', 409)

    original = _successful_payment(reservation.id)

    if original is None:
        db.session.rollback()

        return error(
            'BUSINESS_RULE_VIOLATION',
            'There is no successful payment to refund.',
            422,
        )

    item_type = reservation.item_type
    item_id = reservation.item_id
    quantity = reservation.quantity
    amount = original.amount
    method = original.method
    card_mask = original.card_mask

    released = False

    try:
        release_item(item_type, item_id, quantity, reservation.id)
        released = True
    except ItemNotFound:
        released = False
    except ServiceUnavailable:
        db.session.rollback()

        return error(
            'SERVICE_UNAVAILABLE',
            'The catalogue service is temporarily unavailable.',
            502,
        )
    except Exception as exception:
        db.session.rollback()
        print(f'[payment] refund release failed: {exception!r}', flush=True)
        traceback.print_exc()

        return error('INTERNAL_ERROR', 'Internal server error.', 500)

    refund = Payment(
        reservation_id=reservation.id,
        amount=amount,
        method=method,
        status='REFUNDED',
        payment_date=utcnow(),
        transaction_ref=_transaction_ref('REF'),
        card_mask=card_mask,
        error_code=None,
    )
    db.session.add(refund)

    previous_status = reservation.status
    reservation.status = 'REFUNDED'
    _add_history(
        reservation.id,
        previous_status,
        'REFUNDED',
        'admin',
        'Refund issued',
    )

    try:
        db.session.commit()
    except Exception as exception:
        db.session.rollback()
        print(f'[payment] refund commit failed: {exception!r}', flush=True)
        traceback.print_exc()

        if released:
            _best_effort_reserve(item_type, item_id, quantity, reservation.id)

        return error('INTERNAL_ERROR', 'Internal server error.', 500)

    return success({
        'refundedAmount': float(refund.amount),
        'reservation': reservation_json(reservation),
        'payment': payment_json(refund),
    })


@payments_bp.post('/reservations/<int:reservation_id>/refund')
@admin_required
def refund_reservation(reservation_id):
    return _refund_locked(reservation_id)


@payments_bp.post('/payments/<int:payment_id>/refund')
@admin_required
def refund_payment(payment_id):
    payment = db.session.get(Payment, payment_id)

    if payment is None:
        return error('NOT_FOUND', 'Payment not found.', 404)

    if payment.status not in ('SUCCEEDED', 'REFUNDED'):
        return error('INVALID_STATUS', 'This payment cannot be refunded.', 409)

    return _refund_locked(payment.reservation_id)
