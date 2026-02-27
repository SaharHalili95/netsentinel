from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Device, Scan, Alert, TrafficLog
from app.services.alerting import get_alert_counts

router = APIRouter()


@router.get("")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Get aggregated dashboard statistics."""
    # Device stats
    total_devices = await db.scalar(select(func.count()).select_from(Device))
    online_devices = await db.scalar(select(func.count()).select_from(Device).where(Device.is_online == True))

    # Alert stats
    alert_counts = await get_alert_counts(db)

    # Last scan
    last_scan_result = await db.execute(
        select(Scan).order_by(Scan.started_at.desc()).limit(1)
    )
    last_scan = last_scan_result.scalar_one_or_none()

    # Traffic stats
    total_traffic = await db.scalar(
        select(func.sum(TrafficLog.bytes_sent + TrafficLog.bytes_received)).select_from(TrafficLog)
    ) or 0
    suspicious_traffic = await db.scalar(
        select(func.count()).select_from(TrafficLog).where(TrafficLog.is_suspicious == True)
    )

    # Device types breakdown
    device_types_result = await db.execute(
        select(Device.device_type, func.count()).group_by(Device.device_type)
    )
    device_types = dict(device_types_result.all())

    # Recent alerts
    recent_alerts_result = await db.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(10)
    )
    recent_alerts = recent_alerts_result.scalars().all()

    return {
        "devices": {
            "total": total_devices,
            "online": online_devices,
            "offline": total_devices - online_devices,
            "types": device_types,
        },
        "alerts": alert_counts,
        "last_scan": {
            "id": str(last_scan.id) if last_scan else None,
            "type": last_scan.scan_type if last_scan else None,
            "status": last_scan.status if last_scan else None,
            "devices_found": last_scan.devices_found if last_scan else 0,
            "started_at": last_scan.started_at.isoformat() if last_scan else None,
        },
        "traffic": {
            "total_bytes": total_traffic,
            "suspicious_connections": suspicious_traffic,
        },
        "recent_alerts": [
            {
                "id": str(a.id),
                "severity": a.severity,
                "title": a.title,
                "status": a.status,
                "created_at": a.created_at.isoformat(),
            }
            for a in recent_alerts
        ],
    }
