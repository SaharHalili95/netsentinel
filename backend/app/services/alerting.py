import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert

logger = logging.getLogger(__name__)


async def get_alerts(
    db: AsyncSession,
    status: str | None = None,
    severity: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Alert]:
    query = select(Alert).order_by(Alert.created_at.desc()).limit(limit).offset(offset)
    if status:
        query = query.where(Alert.status == status)
    if severity:
        query = query.where(Alert.severity == severity)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_alert_counts(db: AsyncSession) -> dict:
    result = await db.execute(
        select(Alert.severity, func.count())
        .where(Alert.status == "open")
        .group_by(Alert.severity)
    )
    counts = dict(result.all())
    return {
        "critical": counts.get("critical", 0),
        "high": counts.get("high", 0),
        "medium": counts.get("medium", 0),
        "low": counts.get("low", 0),
        "info": counts.get("info", 0),
        "total": sum(counts.values()),
    }


async def acknowledge_alert(db: AsyncSession, alert_id: UUID) -> Alert | None:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert:
        alert.status = "acknowledged"
        await db.commit()
        await db.refresh(alert)
    return alert


async def resolve_alert(db: AsyncSession, alert_id: UUID) -> Alert | None:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert:
        alert.status = "resolved"
        alert.resolved_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(alert)
    return alert


async def resolve_all(db: AsyncSession) -> int:
    result = await db.execute(
        update(Alert)
        .where(Alert.status.in_(["open", "acknowledged"]))
        .values(status="resolved", resolved_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return result.rowcount
