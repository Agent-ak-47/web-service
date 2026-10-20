from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from config import Config
from helpers.http_client import ServiceUnavailable, request_json


class ItemNotFound(Exception):
    pass


class InsufficientAvailability(Exception):
    def __init__(self, details=None):
        super().__init__('Not enough availability.')
        self.details = details or {}


SERVICES = {
    'FLIGHT': (Config.FLIGHT_SERVICE_URL, 'flights'),
    'PACKAGE': (Config.PACKAGE_SERVICE_URL, 'packages'),
    'EXCURSION': (Config.EXCURSION_SERVICE_URL, 'excursions'),
}


def _service(item_type):
    if item_type not in SERVICES:
        raise ItemNotFound()

    return SERVICES[item_type]


def _details(response):
    try:
        payload = response.json()
    except ValueError:
        return {}

    error = payload.get('error') if isinstance(payload, dict) else None
    details = error.get('details') if isinstance(error, dict) else None

    return details if isinstance(details, dict) else {}


def fetch_item(item_type, item_id):
    base_url, resource = _service(item_type)
    response = request_json('GET', f'{base_url}/api/{resource}/{item_id}')

    if response.status_code == 404:
        raise ItemNotFound()

    if response.status_code != 200:
        raise ServiceUnavailable('The catalogue service failed.')

    try:
        payload = response.json()
    except ValueError as exception:
        raise ServiceUnavailable('The catalogue service returned invalid JSON.') from exception

    item = payload.get('data') if isinstance(payload, dict) else None

    if not isinstance(item, dict):
        raise ServiceUnavailable('The catalogue service returned an invalid item.')

    return item


def reserve_item(item_type, item_id, quantity, reservation_id):
    base_url, resource = _service(item_type)
    response = request_json(
        'POST',
        f'{base_url}/api/internal/{resource}/{item_id}/reserve',
        {'quantity': quantity, 'reservationId': reservation_id},
    )

    if response.status_code == 404:
        raise ItemNotFound()

    if response.status_code == 409:
        raise InsufficientAvailability(_details(response))

    if response.status_code != 200:
        raise ServiceUnavailable('The catalogue service failed to hold the stock.')


def release_item(item_type, item_id, quantity, reservation_id):
    base_url, resource = _service(item_type)
    response = request_json(
        'POST',
        f'{base_url}/api/internal/{resource}/{item_id}/release',
        {'quantity': quantity, 'reservationId': reservation_id},
    )

    if response.status_code == 404:
        raise ItemNotFound()

    if response.status_code != 200:
        raise ServiceUnavailable('The catalogue service failed to release the stock.')


def price_of(item_type, item):
    value = item.get('promoPrice') if item_type == 'PACKAGE' else item.get('price')
    value = value if value is not None else item.get('price')

    try:
        price = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exception:
        raise ServiceUnavailable('The catalogue service returned an invalid price.') from exception

    if price < 0:
        raise ServiceUnavailable('The catalogue service returned an invalid price.')

    return price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def available_seats_of(item_type, item):
    if item_type == 'PACKAGE':
        return None

    try:
        return int(item.get('availableSeats'))
    except (TypeError, ValueError) as exception:
        raise ServiceUnavailable('The catalogue service returned invalid availability.') from exception


def is_item_active(item_type, item):
    if item_type == 'FLIGHT':
        return bool(item.get('active', True))

    return bool(item.get('available', True))


def label_of(item_type, item):
    if item_type == 'FLIGHT':
        parts = [
            item.get('airline'),
            item.get('flightNumber'),
            f"{item.get('departureCity', '')} -> {item.get('arrivalCity', '')}",
        ]
        label = ' '.join(str(part) for part in parts if part)
    elif item_type == 'PACKAGE':
        label = str(item.get('name') or '')
    else:
        title = str(item.get('title') or '')
        location = str(item.get('location') or '')
        label = f'{title} ({location})' if location else title

    return label[:160]
