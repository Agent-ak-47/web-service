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


def history_json(entry):
    return {
        'id': entry.id,
        'reservationId': entry.reservation_id,
        'statusBefore': entry.status_before or '',
        'statusAfter': entry.status_after,
        'comment': entry.comment or '',
        'actor': entry.actor or '',
        'createdAt': iso_datetime(entry.created_at),
    }
