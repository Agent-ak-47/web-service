import importlib.util
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import Catalogue, make_handler, matches


FLIGHT_SEED = Path(__file__).resolve().parents[1] / 'flight' / 'index.py'


def load_flight_seed():
    spec = importlib.util.spec_from_file_location('flight_mock_seed', FLIGHT_SEED)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module.ITEMS


@pytest.mark.parametrize(
    'error',
    [
        ConnectionAbortedError(10053, 'aborted'),
        BrokenPipeError(32, 'broken pipe'),
        ConnectionResetError(10054, 'reset'),
    ],
)
def test_handler_ignores_client_disconnects(error):
    handler = object.__new__(make_handler(Catalogue('flights', {}), 'flights'))

    with patch('http.server.BaseHTTPRequestHandler.handle', side_effect=error):
        handler.handle()


def test_handler_does_not_hide_programming_errors():
    handler = object.__new__(make_handler(Catalogue('flights', {}), 'flights'))

    with patch('http.server.BaseHTTPRequestHandler.handle', side_effect=ValueError('boom')):
        with pytest.raises(ValueError):
            handler.handle()


def test_flight_seed_uses_frontend_time_fields():
    for item in load_flight_seed().values():
        assert 'departureTime' in item
        assert 'arrivalTime' in item
        assert 'departureDate' not in item
        assert 'arrivalDate' not in item


def test_flight_date_filters_read_time_fields():
    item = {
        'departureTime': '2026-06-01T08:00:00Z',
        'arrivalTime': '2026-06-01T11:00:00Z',
        'price': 100,
    }

    assert matches('flights', item, {'departureDate': '2026-06-01'}) is True
    assert matches('flights', item, {'departureDate': '2026-06-02'}) is False
    assert matches('flights', item, {'arrivalDate': '2026-06-01'}) is True
