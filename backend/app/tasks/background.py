import logging

from app.database import async_session
from app.services.scanner import run_discovery_scan, run_port_scan
from app.services.traffic_analyzer import capture_traffic_sample
from app.services.anomaly_detector import analyze_traffic_anomalies
from app.api.websocket import broadcast_alert, broadcast_scan_update

logger = logging.getLogger(__name__)


def _scan_message(scan) -> dict:
    return {
        "id": str(scan.id),
        "scan_type": scan.scan_type,
        "status": scan.status,
        "devices_found": scan.devices_found,
        "open_ports_found": scan.open_ports_found,
    }


def _alert_message(alert) -> dict:
    return {
        "id": str(alert.id),
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "title": alert.title,
        "source_ip": alert.source_ip,
    }


async def scheduled_discovery():
    logger.info("Running scheduled device discovery...")
    async with async_session() as db:
        try:
            scan = await run_discovery_scan(db)
            logger.info(f"Scheduled discovery complete: {scan.devices_found} devices found")
            await broadcast_scan_update(_scan_message(scan))
        except Exception as e:
            logger.error(f"Scheduled discovery failed: {e}")


async def scheduled_port_scan():
    logger.info("Running scheduled port scan...")
    async with async_session() as db:
        try:
            scan = await run_port_scan(db)
            logger.info(f"Scheduled port scan complete: {scan.open_ports_found} open ports")
            await broadcast_scan_update(_scan_message(scan))
        except Exception as e:
            logger.error(f"Scheduled port scan failed: {e}")


async def scheduled_traffic_capture():
    logger.info("Running scheduled traffic capture...")
    async with async_session() as db:
        try:
            logs = await capture_traffic_sample(db)
            logger.info(f"Traffic capture complete: {len(logs)} entries recorded")
        except Exception as e:
            logger.error(f"Traffic capture failed: {e}")


async def scheduled_anomaly_check():
    logger.info("Running scheduled anomaly detection...")
    async with async_session() as db:
        try:
            alerts = await analyze_traffic_anomalies(db)
            logger.info(f"Anomaly detection complete: {len(alerts)} alerts generated")
            for alert in alerts:
                await broadcast_alert(_alert_message(alert))
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
