"""End-to-end smoke test for the three containerised services.

It drives the real HTTP API of the containers started by
`docker compose -f kamal/docker-compose.yml up -d --build`, so it checks the
whole flow (MySQL connectivity, the shared JWT, the reservation/payment rules
and the calls to the catalogue service), not just `/health`.

    py -3.11 kamal/docker_smoke_test.py
    py -3.11 kamal/docker_smoke_test.py --keep   # keep the test account

Flow: register -> /me -> create reservation -> list -> pay -> history ->
admin refund -> logout. A tiny future-dated flight catalogue is served on
port 8081 (the same port as the flight mock, so stop the mocks first), because
every item of `kamal/mock` starts in the past and the reservation service
refuses to book a product whose start date has passed.

The test account is removed from the database at the end (use --keep to skip
that). Exit code 0 means every step passed.
"""

import argparse
import json
import secrets
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

USER_URL = 'http://localhost:8083'
RESERVATION_URL = 'http://localhost:8085'
PAYMENT_URL = 'http://localhost:8086'

HEALTH_URLS = {
    'user': f'{USER_URL}/health',
    'reservation': f'{RESERVATION_URL}/health',
    'payment': f'{PAYMENT_URL}/health',
}

SERVICE_URLS = (USER_URL, RESERVATION_URL, PAYMENT_URL)

DEMO_ADMIN = ('admin@agency.travel', 'Password123!')
TEST_PASSWORD = 'SmokeTest123!'

ITEM_ID = 1
QUANTITY = 2
UNIT_PRICE = 2450.00
TOTAL_AMOUNT = UNIT_PRICE * QUANTITY

GOOD_CARD = {
    'method': 'CARD',
    'cardNumber': '4242424242424242',
    'expiration': '12/28',
    'cvv': '123',
}

CATALOGUE_PORT = 8081
CATALOGUE_RESOURCE = 'flights'


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def call(method, url, payload=None, token=None, timeout=20):
    """Return (status, parsed JSON) for one HTTP call, errors included."""
    data = None if payload is None else json.dumps(payload).encode('utf-8')
    headers = {'Content-Type': 'application/json'}

    if token is not None:
        headers['Authorization'] = f'Bearer {token}'

    request = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read()
            status = response.status
    except urllib.error.HTTPError as exception:
        body = exception.read()
        status = exception.code
    except urllib.error.URLError as exception:
        return None, {'error': str(exception.reason)}

    try:
        return status, json.loads(body or b'{}')
    except ValueError:
        return status, {'raw': body.decode('utf-8', errors='replace')}


def wait_for_health(timeout_seconds):
    """Wait until the three containers answer /health, or report what is down."""
    deadline = time.time() + timeout_seconds
    pending = dict(HEALTH_URLS)

    while pending and time.time() < deadline:
        for name, url in list(pending.items()):
            status, payload = call('GET', url, timeout=3)

            if status == 200:
                del pending[name]
                print(f'  {name:<12} healthy -> {url}')
        else:
            if pending:
                time.sleep(2)

    return pending


# ---------------------------------------------------------------------------
# Catalogue stub: GET the item, reserve and release its stock
# ---------------------------------------------------------------------------

class Catalogue:
    def __init__(self):
        self.lock = threading.Lock()
        self.calls = []
        start = datetime.now(timezone.utc) + timedelta(days=30)
        self.item = {
            'id': ITEM_ID,
            'airline': 'Royal Air Maroc',
            'flightNumber': 'RAM101',
            'departureCity': 'Casablanca',
            'arrivalCity': 'Paris',
            'departureTime': start.isoformat().replace('+00:00', 'Z'),
            'arrivalTime': (start + timedelta(hours=3)).isoformat().replace('+00:00', 'Z'),
            'availableSeats': 150,
            'totalSeats': 180,
            'price': UNIT_PRICE,
            'active': True,
        }

    def record(self, action, quantity):
        with self.lock:
            self.calls.append((action, quantity))
            if action == 'reserve':
                self.item['availableSeats'] -= quantity
            else:
                self.item['availableSeats'] += quantity

    def of(self, action):
        with self.lock:
            return [quantity for name, quantity in self.calls if name == action]

    def handler(self):
        catalogue = self

        class Handler(BaseHTTPRequestHandler):
            server_version = 'SmokeCatalogue/1.0'

            def log_message(self, *args):
                pass

            def send_json(self, status, payload):
                body = json.dumps(payload).encode('utf-8')
                self.send_response(status)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def do_GET(self):
                path = self.path.split('?', 1)[0]

                if path == '/health':
                    return self.send_json(200, {'status': 'ok'})

                if path == f'/api/{CATALOGUE_RESOURCE}/{ITEM_ID}':
                    with catalogue.lock:
                        return self.send_json(200, {'data': dict(catalogue.item)})

                return self.send_json(404, {'error': {'code': 'NOT_FOUND', 'details': {}}})

            def do_POST(self):
                path = self.path.split('?', 1)[0]
                length = int(self.headers.get('Content-Length') or 0)
                payload = json.loads(self.rfile.read(length) or b'{}')

                if path not in (
                    f'/api/internal/{CATALOGUE_RESOURCE}/{ITEM_ID}/reserve',
                    f'/api/internal/{CATALOGUE_RESOURCE}/{ITEM_ID}/release',
                ):
                    return self.send_json(404, {'error': {'code': 'NOT_FOUND', 'details': {}}})

                action = path.rsplit('/', 1)[-1]
                catalogue.record(action, int(payload.get('quantity') or 0))

                with catalogue.lock:
                    available = catalogue.item['availableSeats']

                return self.send_json(200, {'data': {'availableSeats': available}})

        return Handler


def start_catalogue():
    catalogue = Catalogue()
    server = ThreadingHTTPServer(('0.0.0.0', CATALOGUE_PORT), catalogue.handler())
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()

    return catalogue, server


# ---------------------------------------------------------------------------
# Cleanup: the test account is deleted, its rows follow through the FKs
# ---------------------------------------------------------------------------

def read_compose_env():
    path = Path(__file__).resolve().with_name('.env')

    if not path.exists():
        return {}

    values = {}

    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()

        if not line or line.startswith('#') or '=' not in line:
            continue

        key, value = line.split('=', 1)
        values[key.strip()] = value.strip()

    return values


def delete_test_account(email, container):
    values = read_compose_env()
    user = values.get('DB_USER', 'app_user')
    password = values.get('DB_PASSWORD', '')
    database = values.get('DB_NAME', 'travel_agency')

    if not password:
        return False, 'no DB_PASSWORD in kamal/.env'

    sql = f"DELETE FROM users WHERE email = '{email}';"
    command = [
        'docker', 'exec', container,
        'mysql', f'-u{user}', f'-p{password}', database, '-e', sql,
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.SubprocessError) as exception:
        return False, str(exception)

    if result.returncode != 0:
        return False, (result.stderr or result.stdout).strip()[:200]

    return True, ''


# ---------------------------------------------------------------------------
# Flow
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--keep', action='store_true', help='keep the test account')
    parser.add_argument(
        '--mysql-container',
        default='travel_agency_mysql',
        help='container used to delete the test account (default: travel_agency_mysql)',
    )
    parser.add_argument('--timeout', type=int, default=90, help='health-check timeout (s)')
    arguments = parser.parse_args()

    results = []

    def check(name, condition, detail=''):
        results.append((name, bool(condition), detail))
        mark = 'PASS' if condition else 'FAIL'
        print(f'  [{mark}] {name}' + (f' -- {detail}' if detail and not condition else ''))

        return condition

    print('1. Container health')

    try:
        catalogue, server = start_catalogue()
    except OSError as exception:
        print(f'  [FAIL] cannot listen on {CATALOGUE_PORT}: {exception}')
        print('         stop the flight mock (py -3.11 kamal/mock/run_all.py) and retry.')
        return 1

    print(f'  catalogue stub listening on {CATALOGUE_PORT} (future-dated flight)')

    down = wait_for_health(arguments.timeout)

    if down:
        for name in down:
            print(f'  [FAIL] {name} did not answer /health within {arguments.timeout}s')
        print('         start the stack:')
        print('           docker compose up -d                                      (repo root)')
        print('           docker compose -f kamal/docker-compose.yml up -d --build')
        server.shutdown()

        return 1

    email = f'smoke-{secrets.token_hex(6)}@agency.test'

    print('2. User service: register, /me')
    status, payload = call('POST', f'{USER_URL}/api/auth/register', {
        'email': email,
        'password': TEST_PASSWORD,
        'name': 'Docker Smoke',
    })

    data = payload.get('data') or {}
    check('POST /api/auth/register -> 201 with a token',
          status == 201 and isinstance(data.get('jeton'), str), f'{status} {payload}')
    client_token = data.get('jeton') or ''
    user_id = (data.get('user') or {}).get('id')

    status, payload = call('GET', f'{USER_URL}/api/auth/me', token=client_token)
    check('GET /api/auth/me -> the registered account',
          status == 200 and (payload.get('data') or {}).get('email') == email, f'{status} {payload}')

    print('3. Reservation service: create, list')
    status, payload = call('POST', f'{RESERVATION_URL}/api/reservations', {
        'typeItem': 'FLIGHT',
        'itemId': ITEM_ID,
        'quantity': QUANTITY,
    }, token=client_token)

    reservation = payload.get('data') or {}
    reservation_id = reservation.get('id')
    check('POST /api/reservations -> 201 PENDING',
          status == 201
          and reservation.get('status') == 'PENDING'
          and isinstance(reservation_id, int),
          f'{status} {payload}')
    check('price captured and multiplied by the quantity',
          reservation.get('unitPrice') == UNIT_PRICE
          and reservation.get('totalAmount') == TOTAL_AMOUNT,
          f"unitPrice={reservation.get('unitPrice')} total={reservation.get('totalAmount')}")
    check('catalogue stock was held once',
          catalogue.of('reserve') == [QUANTITY], f'reserve calls={catalogue.of("reserve")}')
    check('the reservation label came from the catalogue',
          bool(reservation.get('itemLabel')), f"itemLabel={reservation.get('itemLabel')!r}")

    status, payload = call('GET', f'{RESERVATION_URL}/api/reservations', token=client_token)
    rows = payload.get('data') if isinstance(payload.get('data'), list) else []
    check('GET /api/reservations -> the new row',
          status == 200 and any(row.get('id') == reservation_id for row in rows),
          f'{status} {len(rows)} row(s)')

    print('4. Payment service: pay with the test card')
    status, payload = call('POST', f'{PAYMENT_URL}/api/reservations/{reservation_id}/payment',
                           GOOD_CARD, token=client_token)

    payment = payload.get('data') or {}
    check('POST .../payment -> SUCCEEDED, reservation PAID',
          status == 200
          and (payment.get('payment') or {}).get('status') == 'SUCCEEDED'
          and (payment.get('reservation') or {}).get('status') == 'PAID',
          f'{status} {payload}')
    check('only the last four digits are returned',
          (payment.get('payment') or {}).get('cardMask') == '4242'
          and '4242424242424242' not in json.dumps(payload),
          f"{payload}")

    print('5. Reservation service: history')
    status, payload = call('GET', f'{RESERVATION_URL}/api/reservations/{reservation_id}/history',
                           token=client_token)
    entries = payload.get('data') if isinstance(payload.get('data'), list) else []
    transitions = {(entry.get('statusBefore'), entry.get('statusAfter')) for entry in entries}
    check('history contains PENDING -> PAID',
          status == 200 and ('PENDING', 'PAID') in transitions, f'{status} {transitions}')

    print('6. Payment service: admin refund')
    status, payload = call('POST', f'{USER_URL}/api/auth/login', {
        'email': DEMO_ADMIN[0],
        'password': DEMO_ADMIN[1],
    })
    admin_token = (payload.get('data') or {}).get('jeton') or ''
    check('demo admin can log in', status == 200 and bool(admin_token), f'{status}')

    status, payload = call('POST', f'{PAYMENT_URL}/api/reservations/{reservation_id}/refund',
                           token=admin_token)
    refund = payload.get('data') or {}
    check('POST .../refund -> REFUNDED for the full amount',
          status == 200
          and refund.get('refundedAmount') == TOTAL_AMOUNT
          and (refund.get('reservation') or {}).get('status') == 'REFUNDED',
          f'{status} {payload}')
    check('the refund released the stock exactly once',
          catalogue.of('release') == [QUANTITY],
          f'release calls={catalogue.of("release")}')

    print('7. User service: logout')
    status, payload = call('POST', f'{USER_URL}/api/auth/logout', token=client_token)
    check('POST /api/auth/logout -> success',
          status == 200 and (payload.get('data') or {}).get('success') is True, f'{status} {payload}')

    status, payload = call('GET', f'{USER_URL}/api/auth/me', token=client_token)
    check('the token is rejected after logout', status == 401, f'{status} {payload}')

    server.shutdown()

    if not arguments.keep:
        removed, reason = delete_test_account(email, arguments.mysql_container)
        print(f'8. Cleanup: {"account removed" if removed else "account kept (" + reason + ")"}')
        print(f'   test account: {email} (id {user_id})')

    failed = [name for name, ok, _ in results if not ok]
    print()
    print(f'{len(results) - len(failed)}/{len(results)} checks passed')

    if failed:
        print('Failed:')
        for name in failed:
            print(f'  - {name}')

    return 0 if not failed else 1


if __name__ == '__main__':
    raise SystemExit(main())
