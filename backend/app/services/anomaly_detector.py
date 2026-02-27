import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Alert, Device, TrafficLog

logger = logging.getLogger(__name__)

# Ports that are commonly targeted in attacks
SUSPICIOUS_PORTS = {23, 135, 139, 445, 1433, 3389, 4444, 5900, 6667, 8888, 31337}

# Countries often associated with cyber attacks (for alerting, not blocking)
WATCHLIST_COUNTRIES = {"Russia", "China", "North Korea", "Iran"}


async def analyze_traffic_anomalies(db: AsyncSession) -> list[Alert]:
    """Analyze recent traffic for anomalies and generate alerts."""
    alerts = []
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)

    # 1. Check for suspicious port connections
    result = await db.execute(
        select(TrafficLog)
        .where(TrafficLog.created_at >= one_hour_ago)
        .where(TrafficLog.destination_port.in_(SUSPICIOUS_PORTS))
        .where(TrafficLog.is_suspicious == False)
    )
    suspicious_traffic = result.scalars().all()

    for log in suspicious_traffic:
        log.is_suspicious = True
        alert = Alert(
            alert_type="suspicious_port",
            severity="high",
            title=f"Suspicious port connection: {log.destination_ip}:{log.destination_port}",
            description=f"Device {log.source_ip} connected to suspicious port {log.destination_port} on {log.destination_ip}",
            source_ip=log.source_ip,
        )
        db.add(alert)
        alerts.append(alert)

    # 2. Check for connections to watchlist countries
    result = await db.execute(
        select(TrafficLog)
        .where(TrafficLog.created_at >= one_hour_ago)
        .where(TrafficLog.country.in_(WATCHLIST_COUNTRIES))
        .where(TrafficLog.is_suspicious == False)
    )
    watchlist_traffic = result.scalars().all()

    for log in watchlist_traffic:
        log.is_suspicious = True
        alert = Alert(
            alert_type="watchlist_country",
            severity="medium",
            title=f"Connection to watchlist country: {log.country}",
            description=f"Device {log.source_ip} communicated with {log.destination_ip} in {log.country} ({log.city or 'unknown city'})",
            source_ip=log.source_ip,
        )
        db.add(alert)
        alerts.append(alert)

    # 3. Check for traffic volume spikes
    result = await db.execute(
        select(
            TrafficLog.source_ip,
            func.sum(TrafficLog.bytes_sent + TrafficLog.bytes_received).label("total_bytes"),
            func.count().label("connection_count"),
        )
        .where(TrafficLog.created_at >= one_hour_ago)
        .group_by(TrafficLog.source_ip)
        .having(func.count() > 1000)
    )
    heavy_talkers = result.all()

    for row in heavy_talkers:
        alert = Alert(
            alert_type="traffic_spike",
            severity="medium",
            title=f"High traffic volume from {row.source_ip}",
            description=f"Device {row.source_ip} generated {row.connection_count} connections and {row.total_bytes} bytes in the last hour",
            source_ip=row.source_ip,
        )
        db.add(alert)
        alerts.append(alert)

    if alerts:
        await db.commit()
        logger.info(f"Anomaly detection generated {len(alerts)} alerts")

    return alerts
