from config import Config
from helpers.http_client import ServiceUnavailable, request_json


class ItemNotFound(Exception):
    pass


SERVICES = {
    'FLIGHT': (Config.FLIGHT_SERVICE_URL, 'flights'),
    'PACKAGE': (Config.PACKAGE_SERVICE_URL, 'packages'),
    'EXCURSION': (Config.EXCURSION_SERVICE_URL, 'excursions'),
}


def _service(item_type):
    if item_type not in SERVICES:
        raise ItemNotFound()

    return SERVICES[item_type]


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


def reserve_item(item_type, item_id, quantity, reservation_id):
    base_url, resource = _service(item_type)
    response = request_json(
        'POST',
        f'{base_url}/api/internal/{resource}/{item_id}/reserve',
        {'quantity': quantity, 'reservationId': reservation_id},
    )

    if response.status_code == 404:
        raise ItemNotFound()

    if response.status_code != 200:
        raise ServiceUnavailable('The catalogue service failed to hold the stock again.')
