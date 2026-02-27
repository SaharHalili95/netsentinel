from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.alert import AlertResponse, AlertUpdate
from app.services.alerting import get_alerts, get_alert_counts, acknowledge_alert, resolve_alert, resolve_all

router = APIRouter()


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    status: str | None = None,
    severity: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    return await get_alerts(db, status=status, severity=severity, limit=limit, offset=offset)


@router.get("/counts")
async def alert_counts(db: AsyncSession = Depends(get_db)):
    return await get_alert_counts(db)


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: UUID,
    data: AlertUpdate,
    db: AsyncSession = Depends(get_db),
):
    if data.status == "acknowledged":
        alert = await acknowledge_alert(db, alert_id)
    elif data.status == "resolved":
        alert = await resolve_alert(db, alert_id)
    else:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'acknowledged' or 'resolved'")

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/resolve-all")
async def resolve_all_alerts(db: AsyncSession = Depends(get_db)):
    count = await resolve_all(db)
    return {"resolved": count}
