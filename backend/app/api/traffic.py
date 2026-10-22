from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import TrafficLog
from app.schemas.traffic_summary import TrafficSummary
from app.services.traffic_summary import summarize_traffic

router = APIRouter()


@router.get("/summary", response_model=TrafficSummary)
async def traffic_summary(hours: int = Query(24, ge=1, le=168), db: AsyncSession = Depends(get_db)):
    """Protocols, top destinations, countries, suspicious connections and hourly volume."""
    now = datetime.now(timezone.utc)
    result = await db.execute(select(TrafficLog).where(TrafficLog.created_at >= now - timedelta(hours=hours)))
    return summarize_traffic(result.scalars().all(), now, hours)
