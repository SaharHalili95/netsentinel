"""
Unit tests for app.services.traffic_summary

Logs are plain objects, so no database is needed.
"""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.services.traffic_summary import summarize_traffic

NOW = datetime(2026, 10, 22, 12, 30, tzinfo=timezone.utc)


def log(dest="8.8.8.8", protocol="TCP", sent=100, received=900, minutes_ago=5,
        country="United States", city="Mountain View", port=443, suspicious=False):
    return SimpleNamespace(
        source_ip="192.168.1.100",
        destination_ip=dest,
        destination_port=port,
        protocol=protocol,
        bytes_sent=sent,
        bytes_received=received,
        country=country,
        city=city,
        is_suspicious=suspicious,
        created_at=NOW - timedelta(minutes=minutes_ago),
    )


def test_empty_logs_returns_zero_filled_hours():
    summary = summarize_traffic([], NOW)

    assert summary.window_hours == 24
    assert summary.total_bytes == 0
    assert summary.protocols == []
    assert summary.top_destinations == []
    assert summary.countries == []
    assert summary.suspicious == []
    assert len(summary.hourly) == 24
    assert all(h.inbound_bytes == 0 and h.outbound_bytes == 0 and h.suspicious == 0 for h in summary.hourly)


def test_groups_protocols_and_destinations():
    logs = [log(), log(), log(dest="1.1.1.1", protocol="UDP", sent=10, received=20)]

    summary = summarize_traffic(logs, NOW)

    assert summary.total_bytes == 2030
    assert [(p.protocol, p.connections) for p in summary.protocols] == [("TCP", 2), ("UDP", 1)]
    google = summary.top_destinations[0]
    assert (google.ip, google.bytes, google.connections) == ("8.8.8.8", 2000, 2)


def test_top_destinations_capped_at_10_sorted_by_bytes():
    logs = [log(dest=f"10.0.0.{i}", sent=i, received=0) for i in range(1, 16)]

    summary = summarize_traffic(logs, NOW)

    assert len(summary.top_destinations) == 10
    assert [d.ip for d in summary.top_destinations[:2]] == ["10.0.0.15", "10.0.0.14"]


def test_suspicious_grouped_by_destination_and_port():
    logs = [
        log(dest="185.220.101.1", port=4444, country="Germany", city="Berlin", suspicious=True),
        log(dest="185.220.101.1", port=4444, country="Germany", city="Berlin", suspicious=True),
        log(dest="185.220.101.1", port=6667, country="Germany", city="Berlin", suspicious=True),
        log(),
    ]

    summary = summarize_traffic(logs, NOW)

    assert [(s.destination_ip, s.destination_port, s.connections) for s in summary.suspicious] == [
        ("185.220.101.1", 4444, 2),
        ("185.220.101.1", 6667, 1),
    ]


def test_logs_bucketed_by_hour():
    logs = [
        log(sent=1, received=2, minutes_ago=5),
        log(sent=10, received=20, minutes_ago=65, suspicious=True),
    ]

    summary = summarize_traffic(logs, NOW)

    newest, previous = summary.hourly[-1], summary.hourly[-2]
    assert newest.hour == datetime(2026, 10, 22, 12, tzinfo=timezone.utc)
    assert (newest.outbound_bytes, newest.inbound_bytes, newest.suspicious) == (1, 2, 0)
    assert (previous.outbound_bytes, previous.inbound_bytes, previous.suspicious) == (10, 20, 1)
    assert summary.hourly[0].hour < summary.hourly[-1].hour


def test_country_none_excluded():
    logs = [log(country=None, city=None), log(country="Japan", city="Tokyo")]

    summary = summarize_traffic(logs, NOW)

    assert [(c.country, c.connections) for c in summary.countries] == [("Japan", 1)]
