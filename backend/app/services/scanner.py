import logging
import time
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Device, Scan, ScanResult, Alert
from app.services.device_discovery import arp_scan
from app.services.port_scanner import scan_ports
from app.config import settings

logger = logging.getLogger(__name__)


async def run_discovery_scan(db: AsyncSession, network: str | None = None) -> Scan:
    """Run a device discovery scan on the network."""
    target = network or settings.scan_network
    start_time = time.time()

    scan = Scan(
        scan_type="discovery",
        status="running",
        target_network=target,
    )
    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    try:
        discovered = arp_scan(target)
        new_device_count = 0

        for dev_data in discovered:
            mac = dev_data.get("mac_address")
            ip = dev_data["ip_address"]

            # Find existing device by MAC or IP
            existing = None
            if mac:
                result = await db.execute(select(Device).where(Device.mac_address == mac))
                existing = result.scalar_one_or_none()
            if not existing:
                result = await db.execute(select(Device).where(Device.ip_address == ip))
                existing = result.scalar_one_or_none()

            if existing:
                existing.ip_address = ip
                existing.is_online = True
                existing.last_seen = datetime.now(timezone.utc)
                if mac and not existing.mac_address:
                    existing.mac_address = mac
                if dev_data.get("hostname") and not existing.hostname:
                    existing.hostname = dev_data.get("hostname")
                if dev_data.get("vendor") and not existing.vendor:
                    existing.vendor = dev_data.get("vendor")
                device = existing
            else:
                device = Device(
                    ip_address=ip,
                    mac_address=mac,
                    hostname=dev_data.get("hostname"),
                    vendor=dev_data.get("vendor"),
                    is_online=True,
                )
                db.add(device)
                new_device_count += 1

                # Create alert for new device
                alert = Alert(
                    device_id=None,  # Will be set after flush
                    alert_type="new_device",
                    severity="medium",
                    title=f"New device discovered: {ip}",
                    description=f"A new device was found on the network. IP: {ip}, MAC: {mac or 'N/A'}, Hostname: {dev_data.get('hostname', 'N/A')}",
                    source_ip=ip,
                )
                db.add(alert)

            await db.flush()

            # Create scan result
            scan_result = ScanResult(
                scan_id=scan.id,
                device_id=device.id,
            )
            db.add(scan_result)

        # Mark offline devices that weren't found
        found_ips = {d["ip_address"] for d in discovered}
        result = await db.execute(select(Device).where(Device.is_online == True))
        all_online = result.scalars().all()
        for device in all_online:
            if device.ip_address not in found_ips:
                device.is_online = False

        duration = time.time() - start_time
        scan.status = "completed"
        scan.devices_found = len(discovered)
        scan.duration_seconds = round(duration, 2)
        scan.completed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(scan)
        logger.info(f"Discovery scan completed: {len(discovered)} devices found, {new_device_count} new")

    except Exception as e:
        scan.status = "failed"
        scan.error_message = str(e)
        scan.completed_at = datetime.now(timezone.utc)
        await db.commit()
        logger.error(f"Discovery scan failed: {e}")

    return scan


async def run_port_scan(db: AsyncSession) -> Scan:
    """Run port scan on all known online devices."""
    start_time = time.time()

    scan = Scan(
        scan_type="port_scan",
        status="running",
        target_network=settings.scan_network,
    )
    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    try:
        result = await db.execute(select(Device).where(Device.is_online == True))
        devices = result.scalars().all()
        total_open_ports = 0

        for device in devices:
            ports = scan_ports(device.ip_address)
            total_open_ports += len(ports)

            scan_result = ScanResult(
                scan_id=scan.id,
                device_id=device.id,
                open_ports=ports if ports else None,
            )
            db.add(scan_result)

            # Alert on unexpected open ports
            if ports:
                suspicious_ports = {p for p in ports if int(p) in {23, 135, 139, 445, 3389, 5900}}
                if suspicious_ports:
                    alert = Alert(
                        device_id=device.id,
                        alert_type="open_port",
                        severity="high",
                        title=f"Suspicious ports open on {device.ip_address}",
                        description=f"Potentially risky ports detected: {', '.join(suspicious_ports)} on device {device.hostname or device.ip_address}",
                        source_ip=device.ip_address,
                    )
                    db.add(alert)

        duration = time.time() - start_time
        scan.status = "completed"
        scan.devices_found = len(devices)
        scan.open_ports_found = total_open_ports
        scan.duration_seconds = round(duration, 2)
        scan.completed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(scan)
        logger.info(f"Port scan completed: {len(devices)} devices, {total_open_ports} open ports")

    except Exception as e:
        scan.status = "failed"
        scan.error_message = str(e)
        scan.completed_at = datetime.now(timezone.utc)
        await db.commit()
        logger.error(f"Port scan failed: {e}")

    return scan
