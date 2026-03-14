import logging
from datetime import date, datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.compliance import SOC2DailyCheck, REQUIRED_DAILY_CHECKS
from app.schemas.compliance import SOC2CheckCreate, DailyComplianceStatus

logger = logging.getLogger(__name__)


async def submit_check(db: AsyncSession, data: SOC2CheckCreate) -> SOC2DailyCheck:
    check = SOC2DailyCheck(**data.model_dump())
    db.add(check)
    await db.commit()
    await db.refresh(check)
    logger.info(f"SOC2 check submitted: {data.check_type} → {data.status}")
    return check


async def get_daily_status(db: AsyncSession, check_date: date) -> DailyComplianceStatus:
    result = await db.execute(
        select(SOC2DailyCheck).where(SOC2DailyCheck.check_date == check_date)
    )
    checks = list(result.scalars().all())

    required_types = {c["check_type"] for c in REQUIRED_DAILY_CHECKS}
    submitted_types = {c.check_type for c in checks}
    missing_types = list(required_types - submitted_types)

    passed = sum(1 for c in checks if c.status == "pass")
    failed = sum(1 for c in checks if c.status == "fail")
    total_required = len(REQUIRED_DAILY_CHECKS)

    return DailyComplianceStatus(
        check_date=check_date,
        total_checks=len(checks),
        passed=passed,
        failed=failed,
        missing=len(missing_types),
        score_pct=round((passed / total_required) * 100, 1) if total_required else 0.0,
        checks=checks,
        missing_checks=missing_types,
    )


async def get_history(db: AsyncSession, days: int = 30) -> list[dict]:
    """Return daily compliance scores for the last N days."""
    result = await db.execute(
        select(SOC2DailyCheck.check_date, SOC2DailyCheck.status)
        .order_by(SOC2DailyCheck.check_date.desc())
    )
    rows = result.all()

    # Group in Python to avoid dialect-specific SQL casting
    from collections import defaultdict
    by_date: dict[str, dict] = defaultdict(lambda: {"passed": 0, "total": 0})
    for row in rows:
        key = str(row.check_date)
        by_date[key]["total"] += 1
        if row.status == "pass":
            by_date[key]["passed"] += 1

    total_required = len(REQUIRED_DAILY_CHECKS)
    history = [
        {
            "date": d,
            "score_pct": round((v["passed"] / total_required) * 100, 1) if total_required else 0.0,
            "passed": v["passed"],
            "total": v["total"],
        }
        for d, v in sorted(by_date.items(), reverse=True)
    ]
    return history[:days]


async def auto_check_from_alerts(db: AsyncSession) -> SOC2DailyCheck | None:
    """
    Auto-generate a CC7.2 'alerts_reviewed' pass check when all open alerts
    are acknowledged or resolved — called by the scheduler.
    """
    from app.models.alert import Alert

    result = await db.execute(
        select(func.count()).where(Alert.status == "open")
    )
    open_count = result.scalar_one()

    today = datetime.now(timezone.utc).date()

    # Check if we already have a CC7.2 entry for today
    existing = await db.execute(
        select(SOC2DailyCheck)
        .where(SOC2DailyCheck.check_date == today)
        .where(SOC2DailyCheck.check_type == "alerts_reviewed")
    )
    if existing.scalar_one_or_none():
        return None  # already logged today

    status = "pass" if open_count == 0 else "fail"
    check = SOC2DailyCheck(
        check_date=today,
        check_type="alerts_reviewed",
        criteria="CC7.2",
        status=status,
        notes=f"Auto-check: {open_count} open alerts at time of evaluation",
        checked_by="system",
    )
    db.add(check)
    await db.commit()
    await db.refresh(check)
    return check
