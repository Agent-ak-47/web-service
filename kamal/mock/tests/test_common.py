import sys
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import Catalogue, make_handler


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
