import traceback

import requests

from config import Config


class ServiceUnavailable(Exception):
    pass


def request_json(method, url, payload=None, attempts=None):
    total_attempts = max(1, attempts or Config.SERVICE_ATTEMPTS)
    last_error = None

    for _ in range(total_attempts):
        try:
            return requests.request(
                method,
                url,
                json=payload,
                timeout=Config.SERVICE_TIMEOUT,
            )
        except (requests.ConnectionError, requests.Timeout) as exception:
            last_error = exception
            traceback.print_exc()

    raise ServiceUnavailable('The dependent service is unavailable.') from last_error
