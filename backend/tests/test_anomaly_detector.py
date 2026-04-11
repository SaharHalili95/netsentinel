"""
Unit tests for anomaly_detector.py

Uses MagicMock to replace the DB session — no real database needed.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch, call
import pytest

from app.services.anomaly_detector import (
    analyze_traffic_anomalies,
    SUSPICIOUS_PORTS,
    WATCHLIST_COUNTRIES,
)
from app.models import Alert, TrafficLog


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_traffic_log(**kwargs) -> TrafficLog:
    defaults = dict(
        source_ip="192.168.1.10",
        destination_ip="10.0.0.1",
        source_port=12345,
        destination_port=80,
        protocol="TCP",
        bytes_sent=1000,
        bytes_received=2000,
        packet_count=10,
        country=None,
        city=None,
        is_suspicious=False,
        created_at=datetime.now(timezone.utc),
    )
    defaults.update(kwargs)
    log = MagicMock(spec=TrafficLog)
    for k, v in defaults.items():
        setattr(log, k, v)
    return log


def make_db_session(query_results: list) -> AsyncMock:
    """Return an async DB session that yields query_results on successive execute() calls."""
    db = AsyncMock()
    results = []
    for rows in query_results:
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = rows
        mock_result.all.return_value = rows
        results.append(mock_result)
    db.execute = AsyncMock(side_effect=results)
    db.add = MagicMock()
    db.commit = AsyncMock()
    return db


# ---------------------------------------------------------------------------
# Tests — suspicious ports
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_suspicious_port_creates_alert():
    log = make_traffic_log(destination_port=4444, source_ip="192.168.1.5")
    db = make_db_session([[log], [], []])  # hit on first query (ports), empty on others

    alerts = await analyze_traffic_anomalies(db)

    assert len(alerts) == 1
    assert alerts[0].alert_type == "suspicious_port"
    assert alerts[0].severity == "high"
    assert "4444" in alerts[0].title
    assert log.is_suspicious is True


@pytest.mark.asyncio
async def test_suspicious_port_sets_is_suspicious_flag():
    log = make_traffic_log(destination_port=3389)
    db = make_db_session([[log], [], []])

    await analyze_traffic_anomalies(db)

    assert log.is_suspicious is True


@pytest.mark.asyncio
async def test_multiple_suspicious_ports_each_create_alert():
    logs = [
        make_traffic_log(destination_port=445, source_ip="192.168.1.2"),
        make_traffic_log(destination_port=31337, source_ip="192.168.1.3"),
    ]
    db = make_db_session([logs, [], []])

    alerts = await analyze_traffic_anomalies(db)

    assert len(alerts) == 2
    assert all(a.alert_type == "suspicious_port" for a in alerts)


@pytest.mark.asyncio
async def test_no_suspicious_port_no_alert():
    db = make_db_session([[], [], []])

    alerts = await analyze_traffic_anomalies(db)

    assert alerts == []


# ---------------------------------------------------------------------------
# Tests — watchlist countries
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_watchlist_country_creates_medium_alert():
    log = make_traffic_log(country="Russia", destination_ip="5.5.5.5", city="Moscow")
    db = make_db_session([[], [log], []])

    alerts = await analyze_traffic_anomalies(db)

    assert len(alerts) == 1
    assert alerts[0].alert_type == "watchlist_country"
    assert alerts[0].severity == "medium"
    assert "Russia" in alerts[0].title


@pytest.mark.asyncio
async def test_watchlist_country_unknown_city():
    log = make_traffic_log(country="Iran", city=None, destination_ip="1.2.3.4")
    db = make_db_session([[], [log], []])

    alerts = await analyze_traffic_anomalies(db)

    assert "unknown city" in alerts[0].description


@pytest.mark.asyncio
async def test_all_watchlist_countries_covered():
    """WATCHLIST_COUNTRIES constant should include the four expected countries."""
    assert "Russia" in WATCHLIST_COUNTRIES
    assert "China" in WATCHLIST_COUNTRIES
    assert "North Korea" in WATCHLIST_COUNTRIES
    assert "Iran" in WATCHLIST_COUNTRIES


# ---------------------------------------------------------------------------
# Tests — traffic spikes
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_traffic_spike_creates_medium_alert():
    # Simulate a row returned by the GROUP BY query
    row = MagicMock()
    row.source_ip = "192.168.1.99"
    row.connection_count = 1500
    row.total_bytes = 50_000_000

    db = make_db_session([[], [], [row]])

    alerts = await analyze_traffic_anomalies(db)

    assert len(alerts) == 1
    assert alerts[0].alert_type == "traffic_spike"
    assert alerts[0].severity == "medium"
    assert "192.168.1.99" in alerts[0].title


@pytest.mark.asyncio
async def test_traffic_spike_description_includes_counts():
    row = MagicMock()
    row.source_ip = "10.0.0.5"
    row.connection_count = 2000
    row.total_bytes = 999_000

    db = make_db_session([[], [], [row]])

    alerts = await analyze_traffic_anomalies(db)

    desc = alerts[0].description
    assert "2000" in desc
    assert "999000" in desc


# ---------------------------------------------------------------------------
# Tests — commit behavior
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_commit_called_when_alerts_generated():
    log = make_traffic_log(destination_port=23)
    db = make_db_session([[log], [], []])

    await analyze_traffic_anomalies(db)

    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_commit_not_called_when_no_alerts():
    db = make_db_session([[], [], []])

    await analyze_traffic_anomalies(db)

    db.commit.assert_not_awaited()


# ---------------------------------------------------------------------------
# Tests — SUSPICIOUS_PORTS constant
# ---------------------------------------------------------------------------

def test_suspicious_ports_contains_known_attack_ports():
    assert 4444 in SUSPICIOUS_PORTS   # Metasploit default
    assert 31337 in SUSPICIOUS_PORTS  # Back Orifice
    assert 3389 in SUSPICIOUS_PORTS   # RDP
    assert 445 in SUSPICIOUS_PORTS    # SMB
    assert 23 in SUSPICIOUS_PORTS     # Telnet
