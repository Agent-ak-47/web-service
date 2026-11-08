from datetime import timezone


def iso_datetime(value):
    if value is None:
        return ''

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')


def reservation_json(reservation):
    return {
        'id': reservation.id,
        'reference': reservation.reference,
        'userId': reservation.user_id,
        'typeItem': reservation.item_type,
        'itemId': reservation.item_id,
        'itemLabel': reservation.item_label or '',
        'quantity': reservation.quantity,
        'unitPrice': float(reservation.unit_price or 0),
        'totalAmount': float(reservation.total_amount or 0),
        'status': reservation.status,
        'reservationDate': iso_datetime(reservation.reservation_date),
        'departureDate': reservation.departure_date.isoformat()
        if reservation.departure_date is not None else '',
        'cancellationReason': reservation.cancellation_reason or '',
    }


def payment_json(payment):
    return {
        'id': payment.id,
        'reservationId': payment.reservation_id,
        'amount': float(payment.amount or 0),
        'method': payment.method,
        'status': payment.status,
        'paymentDate': iso_datetime(payment.payment_date),
        'transactionRef': payment.transaction_ref or '',
        'cardMask': payment.card_mask or '',
        'errorCode': payment.error_code or '',
    }
