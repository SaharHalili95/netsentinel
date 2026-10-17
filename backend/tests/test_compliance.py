"""
Unit tests for app.services.compliance

The async DB session is replaced with mocks, so no database is needed.
"""

from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.models.compliance import REQUIRED_DAILY_CHECKS
from app.services import compliance

TOTAL = len(REQUIRED_DAILY_CHECKS)


def check(check_type, status, check_date=date(2026, 10, 1)):
    return SimpleNamespace(
        id=uuid4(),
        check_date=check_date,
        check_type=check_type,
        criteria="CC7.2",
        status=status,
        notes=None,
        evidence_ref=None,
        checked_by="tester",
        created_at=datetime(2026, 10, 1, tzinfo=timezone.utc),
    )


def session_returning_scalars(rows):
    result = MagicMock()
    result.scalars.return_value.all.return_value = rows
    db = MagicMock()
    db.execute = AsyncMock(return_value=result)
    return db


def session_returning_rows(rows):
    result = MagicMock()
    result.all.return_value = rows
    db = MagicMock()
    db.execute = AsyncMock(return_value=result)
    return db


@pytest.mark.asyncio
async def test_daily_status_with_no_checks_lists_everything_missing():
    status = await compliance.get_daily_status(session_returning_scalars([]), date(2026, 10, 1))

    assert status.total_checks == 0
    assert status.missing == TOTAL
    assert status.score_pct == 0.0
    assert set(status.missing_checks) == {c["check_type"] for c in REQUIRED_DAILY_CHECKS}


@pytest.mark.asyncio
async def test_daily_status_scores_against_all_required_checks():
    rows = [
        check("alerts_reviewed", "pass"),
        check("access_review", "pass"),
        check("backup_verified", "fail"),
    ]

    status = await compliance.get_daily_status(session_returning_scalars(rows), date(2026, 10, 1))

    assert status.passed == 2
    assert status.failed == 1
    assert status.missing == TOTAL - 3
    assert status.score_pct == round(2 / TOTAL * 100, 1)
    assert "backup_verified" not in status.missing_checks


@pytest.mark.asyncio
async def test_history_groups_by_day_newest_first_and_honours_limit():
    rows = [
        check("a", "pass", date(2026, 10, 3)),
        check("b", "pass", date(2026, 10, 3)),
        check("a", "fail", date(2026, 10, 2)),
        check("a", "pass", date(2026, 10, 1)),
    ]

    history = await compliance.get_history(session_returning_rows(rows), days=2)

    assert [h["date"] for h in history] == ["2026-10-03", "2026-10-02"]
    assert history[0]["passed"] == 2
    assert history[0]["total"] == 2
    assert history[1]["passed"] == 0
    assert history[1]["score_pct"] == 0.0


def scalar_result(value=None, one=None):
    result = MagicMock()
    result.scalar_one.return_value = one
    result.scalar_one_or_none.return_value = value
    return result


@pytest.mark.asyncio
@pytest.mark.parametrize("open_alerts,expected", [(0, "pass"), (3, "fail")])
async def test_auto_check_passes_only_when_no_alerts_are_open(open_alerts, expected):
    db = MagicMock()
    db.execute = AsyncMock(side_effect=[scalar_result(one=open_alerts), scalar_result(value=None)])
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    created = await compliance.auto_check_from_alerts(db)

    assert created.status == expected
    assert created.criteria == "CC7.2"
    assert f"{open_alerts} open alerts" in created.notes
    db.add.assert_called_once_with(created)


@pytest.mark.asyncio
async def test_auto_check_runs_once_per_day():
    db = MagicMock()
    db.execute = AsyncMock(side_effect=[scalar_result(one=0), scalar_result(value=object())])
    db.commit = AsyncMock()

    assert await compliance.auto_check_from_alerts(db) is None
    db.add.assert_not_called()
    db.commit.assert_not_awaited()
