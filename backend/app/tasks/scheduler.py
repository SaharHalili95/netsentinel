import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.tasks.background import scheduled_discovery, scheduled_port_scan, scheduled_traffic_capture, scheduled_anomaly_check

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def start_scheduler():
    """Start the background task scheduler."""
    # Device discovery every 5 minutes
    scheduler.add_job(scheduled_discovery, "interval", minutes=5, id="discovery", replace_existing=True)

    # Port scan every 60 minutes
    scheduler.add_job(scheduled_port_scan, "interval", minutes=60, id="port_scan", replace_existing=True)

    # Traffic capture every 2 minutes
    scheduler.add_job(scheduled_traffic_capture, "interval", minutes=2, id="traffic_capture", replace_existing=True)

    # Anomaly detection every 5 minutes
    scheduler.add_job(scheduled_anomaly_check, "interval", minutes=5, id="anomaly_check", replace_existing=True)

    scheduler.start()
    logger.info("Scheduler started with periodic scanning jobs")


def stop_scheduler():
    """Stop the background task scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
