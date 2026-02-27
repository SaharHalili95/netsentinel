import logging

from app.database import async_session
from app.services.scanner import run_discovery_scan, run_port_scan
from app.services.traffic_analyzer import capture_traffic_sample
from app.services.anomaly_detector import analyze_traffic_anomalies

logger = logging.getLogger(__name__)


async def scheduled_discovery():
    """Background job: discover devices on the network."""
    logger.info("Running scheduled device discovery...")
    async with async_session() as db:
        try:
            scan = await run_discovery_scan(db)
            logger.info(f"Scheduled discovery complete: {scan.devices_found} devices found")
        except Exception as e:
            logger.error(f"Scheduled discovery failed: {e}")


async def scheduled_port_scan():
    """Background job: scan ports on known devices."""
    logger.info("Running scheduled port scan...")
    async with async_session() as db:
        try:
            scan = await run_port_scan(db)
            logger.info(f"Scheduled port scan complete: {scan.open_ports_found} open ports")
        except Exception as e:
            logger.error(f"Scheduled port scan failed: {e}")


async def scheduled_traffic_capture():
    """Background job: capture and analyze network traffic."""
    logger.info("Running scheduled traffic capture...")
    async with async_session() as db:
        try:
            logs = await capture_traffic_sample(db)
            logger.info(f"Traffic capture complete: {len(logs)} entries recorded")
        except Exception as e:
            logger.error(f"Traffic capture failed: {e}")


async def scheduled_anomaly_check():
    """Background job: check for anomalies in recent traffic."""
    logger.info("Running scheduled anomaly detection...")
    async with async_session() as db:
        try:
            alerts = await analyze_traffic_anomalies(db)
            logger.info(f"Anomaly detection complete: {len(alerts)} alerts generated")
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
