"""Unit tests for app.services.geoip"""

import pytest

from app.services import geoip


@pytest.mark.parametrize(
    "ip,expected",
    [
        ("192.168.1.10", True),
        ("10.0.0.1", True),
        ("172.16.5.4", True),
        ("127.0.0.1", True),
        ("8.8.8.8", False),
        ("1.1.1.1", False),
        ("not-an-ip", False),
        ("", False),
    ],
)
def test_is_private_ip(ip, expected):
    assert geoip.is_private_ip(ip) is expected


def test_private_ip_is_never_looked_up(monkeypatch):
    def fail():
        raise AssertionError("reader must not be opened for private IPs")

    monkeypatch.setattr(geoip, "_get_reader", fail)
    assert geoip.lookup("192.168.1.1") is None


def test_falls_back_to_mock_data_without_database(monkeypatch):
    monkeypatch.setattr(geoip, "_get_reader", lambda: None)
    result = geoip.lookup("8.8.8.8")
    assert result["country"] == "United States"
    assert result["iso_code"] == "US"


def test_unknown_public_ip_without_database_returns_none(monkeypatch):
    monkeypatch.setattr(geoip, "_get_reader", lambda: None)
    assert geoip.lookup("203.0.113.7") is None


def test_reader_errors_are_swallowed(monkeypatch):
    class BrokenReader:
        def city(self, ip):
            raise ValueError("corrupt record")

    monkeypatch.setattr(geoip, "_get_reader", lambda: BrokenReader())
    assert geoip.lookup("8.8.8.8") is None
