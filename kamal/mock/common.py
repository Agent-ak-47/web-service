import copy
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


SCENARIOS = ('ok', 'missing', 'broken', 'slow', 'full', 'inactive', 'garbage')


def error(code, message, details=None):
    return {'error': {'code': code, 'message': message, 'details': details or {}}}


class Catalogue:
    def __init__(self, resource, items):
        self.resource = resource
        self.initial = copy.deepcopy(items)
        self.items = copy.deepcopy(items)
        self.calls = []
        self.scenario = 'ok'
        self.lock = threading.Lock()

    def reset(self):
        with self.lock:
            self.items = copy.deepcopy(self.initial)
            self.calls = []
            self.scenario = 'ok'

    def set_scenario(self, scenario):
        with self.lock:
            self.scenario = scenario

    def current_scenario(self):
        with self.lock:
            return self.scenario

    def recorded_calls(self):
        with self.lock:
            return copy.deepcopy(self.calls)

    def item(self, item_id):
        with self.lock:
            scenario = self.scenario
            item = copy.deepcopy(self.items.get(item_id))

        if scenario == 'missing':
            return 404, error('NOT_FOUND', 'Resource not found.')

        if scenario == 'broken':
            return 503, error('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable.')

        if item is None:
            return 404, error('NOT_FOUND', 'Resource not found.')

        if scenario == 'inactive':
            item['active'] = False
            item['available'] = False

        if scenario == 'full' and 'availableSeats' in item:
            item['availableSeats'] = 0

        return 200, {'data': item}

    def availability(self, item_id):
        status, payload = self.item(item_id)

        if status != 200:
            return status, payload

        item = payload['data']

        return 200, {'data': {
            'id': item.get('id', item_id),
            'availableSeats': item.get('availableSeats'),
            'capacity': item.get('capacity') or item.get('totalSeats'),
        }}

    def reserve(self, item_id, quantity, reservation_id):
        with self.lock:
            scenario = self.scenario
            item = self.items.get(item_id)
            self.calls.append({
                'resource': self.resource,
                'action': 'reserve',
                'itemId': item_id,
                'quantity': quantity,
                'reservationId': reservation_id,
            })

            if scenario == 'broken':
                return 503, error('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable.')

            if scenario == 'missing' or item is None:
                return 404, error('NOT_FOUND', 'Resource not found.')

            if scenario == 'inactive' or item.get('active') is False or item.get('available') is False:
                return 409, error(
                    'INSUFFICIENT_AVAILABILITY',
                    'This item is not available.',
                    {'itemId': item_id},
                )

            if 'availableSeats' in item:
                available = 0 if scenario == 'full' else item['availableSeats']

                if available < quantity:
                    return 409, error(
                        'INSUFFICIENT_AVAILABILITY',
                        'Not enough availability.',
                        {'itemId': item_id, 'requested': quantity, 'available': available},
                    )

                item['availableSeats'] = available - quantity

            return 200, {
                'id': item_id,
                'availableSeats': item.get('availableSeats'),
                'totalSeats': item.get('totalSeats'),
                'capacity': item.get('capacity'),
            }

    def release(self, item_id, quantity, reservation_id):
        with self.lock:
            scenario = self.scenario
            item = self.items.get(item_id)
            self.calls.append({
                'resource': self.resource,
                'action': 'release',
                'itemId': item_id,
                'quantity': quantity,
                'reservationId': reservation_id,
            })

            if scenario == 'broken':
                return 503, error('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable.')

            if scenario == 'missing' or item is None:
                return 404, error('NOT_FOUND', 'Resource not found.')

            if 'availableSeats' in item:
                ceiling = item.get('totalSeats') or item.get('capacity') or item['availableSeats'] + quantity
                item['availableSeats'] = min(ceiling, item['availableSeats'] + quantity)

            return 200, {
                'id': item_id,
                'availableSeats': item.get('availableSeats'),
                'totalSeats': item.get('totalSeats'),
                'capacity': item.get('capacity'),
            }


def make_handler(catalogue, resource):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            return

        def _send(self, status, payload):
            body = json.dumps(payload).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _send_raw(self, status, body, content_type):
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _body(self):
            length = int(self.headers.get('Content-Length') or 0)

            try:
                return json.loads(self.rfile.read(length) or b'{}')
            except ValueError:
                return None

        def do_GET(self):
            path = self.path.split('?', 1)[0]
            parts = path.strip('/').split('/')

            if path == '/health':
                return self._send(200, {'status': 'ok'})

            if path == '/__calls':
                return self._send(200, {'calls': catalogue.recorded_calls()})

            if len(parts) == 4 and parts[0] == 'api' and parts[1] == resource and parts[3] == 'availability':
                try:
                    item_id = int(parts[2])
                except ValueError:
                    return self._send(404, error('NOT_FOUND', 'Resource not found.'))

                return self._send(*catalogue.availability(item_id))

            if len(parts) == 3 and parts[0] == 'api' and parts[1] == resource:
                try:
                    item_id = int(parts[2])
                except ValueError:
                    return self._send(404, error('NOT_FOUND', 'Resource not found.'))

                scenario = catalogue.current_scenario()

                if scenario == 'slow':
                    time.sleep(5)

                if scenario == 'garbage':
                    return self._send_raw(200, b'<html>not json</html>', 'text/html')

                return self._send(*catalogue.item(item_id))

            return self._send(404, error('NOT_FOUND', 'Resource not found.'))

        def do_POST(self):
            path = self.path.split('?', 1)[0]
            parts = path.strip('/').split('/')

            if path == '/__reset':
                catalogue.reset()

                return self._send(200, {'status': 'ok'})

            if path == '/__scenario':
                body = self._body() or {}

                if not isinstance(body, dict) or body.get('scenario') not in SCENARIOS:
                    return self._send(400, error('INVALID_FORMAT', 'Unknown scenario.'))

                catalogue.set_scenario(body['scenario'])

                return self._send(200, {'scenario': body['scenario']})

            if len(parts) != 5 or parts[0] != 'api' or parts[1] != 'internal' or parts[2] != resource or parts[4] not in ('reserve', 'release'):
                return self._send(404, error('NOT_FOUND', 'Resource not found.'))

            try:
                item_id = int(parts[3])
            except ValueError:
                return self._send(404, error('NOT_FOUND', 'Resource not found.'))

            body = self._body()

            if not isinstance(body, dict):
                return self._send(400, error('INVALID_FORMAT', 'A JSON body is required.'))

            quantity = body.get('quantity')

            if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
                return self._send(400, error('INVALID_FORMAT', 'quantity must be a positive integer.'))

            scenario = catalogue.current_scenario()

            if scenario == 'slow':
                time.sleep(5)

            if scenario == 'garbage':
                return self._send_raw(200, b'<html>not json</html>', 'text/html')

            status, payload = getattr(catalogue, parts[4])(item_id, quantity, body.get('reservationId'))

            return self._send(status, payload)

    return Handler


def serve(resource, items, port):
    catalogue = Catalogue(resource, items)
    server = ThreadingHTTPServer(('127.0.0.1', port), make_handler(catalogue, resource))
    print(f'{resource} mock: http://127.0.0.1:{port}', flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
