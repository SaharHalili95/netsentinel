"""
Unit tests for alerting.py

Uses AsyncMock to replace the DB session — no real database needed.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import pytest

from app.services.alerting import (
    get_alerts,
    get_alert_counts,
    acknowledge_alert,
    resolve_alert,
    resolve_all,
)
from app.models.alert import Alert


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_alert(**kwargs) -> Alert:
    defaults = dict(
        id=uuid4(),
        alert_type="suspicious_port",
        severity="high",
        title="Test alert",
        description="Test description",
        status="open",
        source_ip="192.168.1.1",
        resolved_at=None,
        created_at=datetime.now(timezone.utc),
    )
    defaults.update(kwargs)
    alert = MagicMock(spec=Alert)
    for k, v in defaults.items():
        setattr(alert, k, v)
    return alert


def make_db(scalar_results=None, all_results=None, rowcount=0) -> AsyncMock:
    db = AsyncMock()
    mock_result = MagicMock()
    if scalar_results is not None:
        mock_result.scalars.return_value.all.return_value = scalar_results
        mock_result.scalar_one_or_none.return_value = scalar_results[0] if scalar_results else None
    if all_results is not None:
        mock_result.all.return_value = all_results
    mock_result.rowcount = rowcount
    db.execute = AsyncMock(return_value=mock_result)
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


# ---------------------------------------------------------------------------
# get_alerts
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_alerts_returns_list():
    alerts = [make_alert(), make_alert(severity="medium")]
    db = make_db(scalar_results=alerts)

    result = await get_alerts(db)

    assert result == alerts
    db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_alerts_empty():
    db = make_db(scalar_results=[])

    result = await get_alerts(db)

    assert result == []


@pytest.mark.asyncio
async def test_get_alerts_passes_filters():
    db = make_db(scalar_results=[])

    await get_alerts(db, status="open", severity="high", limit=10, offset=5)

    db.execute.assert_awaited_once()


# ---------------------------------------------------------------------------
# get_alert_counts
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_alert_counts_all_severities():
    raw = [("critical", 2), ("high", 3), ("medium", 1), ("low", 0)]
    db = make_db(all_results=raw)

    counts = await get_alert_counts(db)

    assert counts["critical"] == 2
    assert counts["high"] == 3
    assert counts["medium"] == 1
    assert counts["low"] == 0
    assert counts["total"] == 6


@pytest.mark.asyncio
async def test_get_alert_counts_missing_severity_defaults_to_zero():
    raw = [("high", 5)]
    db = make_db(all_results=raw)

    counts = await get_alert_counts(db)

    assert counts["critical"] == 0
    assert counts["medium"] == 0
    assert counts["low"] == 0
    assert counts["info"] == 0
    assert counts["total"] == 5


@pytest.mark.asyncio
async def test_get_alert_counts_empty():
    db = make_db(all_results=[])

    counts = await get_alert_counts(db)

    assert counts["total"] == 0
    for key in ("critical", "high", "medium", "low", "info"):
        assert counts[key] == 0


# ---------------------------------------------------------------------------
# acknowledge_alert
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_acknowledge_alert_sets_status():
    alert = make_alert(status="open")
    db = make_db(scalar_results=[alert])

    result = await acknowledge_alert(db, alert.id)

    assert alert.status == "acknowledged"
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once_with(alert)
    assert result is alert


@pytest.mark.asyncio
async def test_acknowledge_alert_not_found_returns_none():
    db = make_db(scalar_results=[])

    result = await acknowledge_alert(db, uuid4())

    assert result is None
    db.commit.assert_not_awaited()


# ---------------------------------------------------------------------------
# resolve_alert
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_resolve_alert_sets_status_and_timestamp():
    alert = make_alert(status="open", resolved_at=None)
    db = make_db(scalar_results=[alert])

    result = await resolve_alert(db, alert.id)

    assert alert.status == "resolved"
    assert alert.resolved_at is not None
    db.commit.assert_awaited_once()
    assert result is alert


@pytest.mark.asyncio
async def test_resolve_alert_not_found_returns_none():
    db = make_db(scalar_results=[])

    result = await resolve_alert(db, uuid4())

    assert result is None
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_resolve_alert_sets_resolved_at_to_now():
    alert = make_alert(status="acknowledged")
    db = make_db(scalar_results=[alert])

    before = datetime.now(timezone.utc)
    await resolve_alert(db, alert.id)
    after = datetime.now(timezone.utc)

    assert before <= alert.resolved_at <= after


# ---------------------------------------------------------------------------
# resolve_all
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_resolve_all_returns_rowcount():
    db = make_db(rowcount=7)

    count = await resolve_all(db)

    assert count == 7
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_resolve_all_commits():
    db = make_db(rowcount=0)

    await resolve_all(db)

    db.commit.assert_awaited_once()
