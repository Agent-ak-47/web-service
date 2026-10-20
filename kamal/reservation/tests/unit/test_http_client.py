import requests
import pytest

import config
from helpers.http_client import ServiceUnavailable, request_json


def test_returns_the_first_successful_response(monkeypatch):
    expected = object()
    calls = []

    def fake_request(method, url, json, timeout):
        calls.append((method, url, json, timeout))
        return expected

    monkeypatch.setattr(requests, 'request', fake_request)

    response = request_json('GET', 'http://service/api/resource', {'a': 1})

    assert response is expected
    assert calls == [('GET', 'http://service/api/resource', {'a': 1}, config.Config.SERVICE_TIMEOUT)]


def test_retries_transient_connection_errors(monkeypatch):
    expected = object()
    calls = []

    def fake_request(method, url, json, timeout):
        calls.append(url)

        if len(calls) == 1:
            raise requests.ConnectionError('offline')

        return expected

    monkeypatch.setattr(requests, 'request', fake_request)
    monkeypatch.setattr(config.Config, 'SERVICE_ATTEMPTS', 2)

    assert request_json('GET', 'http://service') is expected
    assert len(calls) == 2


def test_raises_service_unavailable_after_exhausting_attempts(monkeypatch):
    calls = []

    def fake_request(method, url, json, timeout):
        calls.append(url)
        raise requests.Timeout('too slow')

    monkeypatch.setattr(requests, 'request', fake_request)
    monkeypatch.setattr(config.Config, 'SERVICE_ATTEMPTS', 3)

    with pytest.raises(ServiceUnavailable):
        request_json('POST', 'http://service')

    assert len(calls) == 3


def test_custom_attempt_count_is_used(monkeypatch):
    calls = []

    def fake_request(method, url, json, timeout):
        calls.append(url)
        raise requests.ConnectionError('offline')

    monkeypatch.setattr(requests, 'request', fake_request)

    with pytest.raises(ServiceUnavailable):
        request_json('GET', 'http://service', attempts=4)

    assert len(calls) == 4


def test_attempts_never_drop_below_one(monkeypatch):
    calls = []

    def fake_request(method, url, json, timeout):
        calls.append(url)
        raise requests.ConnectionError('offline')

    monkeypatch.setattr(requests, 'request', fake_request)
    monkeypatch.setattr(config.Config, 'SERVICE_ATTEMPTS', 1)

    with pytest.raises(ServiceUnavailable):
        request_json('GET', 'http://service', attempts=0)

    assert len(calls) == 1
