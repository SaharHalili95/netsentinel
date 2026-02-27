import logging
import random
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.traffic import TrafficLog
from app.services.geoip import lookup, is_private_ip

logger = logging.getLogger(__name__)


async def capture_traffic_sample(db: AsyncSession) -> list[TrafficLog]:
    """Capture a sample of network traffic. Uses mock data when scapy is unavailable."""
    try:
        return await _capture_with_scapy(db)
    except Exception as e:
        logger.warning(f"Scapy capture failed ({e}), using mock data")
        return await _mock_traffic_capture(db)


async def _capture_with_scapy(db: AsyncSession) -> list[TrafficLog]:
    """Capture real traffic using scapy."""
    from scapy.all import sniff, IP, TCP, UDP

    logs = []
    packets = sniff(count=50, timeout=10, filter="ip")

    for pkt in packets:
        if IP not in pkt:
            continue

        src_ip = pkt[IP].src
        dst_ip = pkt[IP].dst
        protocol = "TCP" if TCP in pkt else "UDP" if UDP in pkt else "OTHER"
        src_port = pkt[TCP].sport if TCP in pkt else pkt[UDP].sport if UDP in pkt else None
        dst_port = pkt[TCP].dport if TCP in pkt else pkt[UDP].dport if UDP in pkt else None
        size = len(pkt)

        geo = None
        if not is_private_ip(dst_ip):
            geo = lookup(dst_ip)

        log = TrafficLog(
            source_ip=src_ip,
            destination_ip=dst_ip,
            source_port=src_port,
            destination_port=dst_port,
            protocol=protocol,
            bytes_sent=size,
            bytes_received=0,
            packet_count=1,
            country=geo["country"] if geo else None,
            city=geo["city"] if geo else None,
            latitude=geo["latitude"] if geo else None,
            longitude=geo["longitude"] if geo else None,
        )
        db.add(log)
        logs.append(log)

    await db.commit()
    return logs


async def _mock_traffic_capture(db: AsyncSession) -> list[TrafficLog]:
    """Generate mock traffic data for development."""
    mock_entries = [
        ("192.168.1.100", "8.8.8.8", 443, "TCP", "United States", "Mountain View", 37.386, -122.084),
        ("192.168.1.100", "151.101.1.140", 443, "TCP", "United States", "San Francisco", 37.774, -122.419),
        ("192.168.1.101", "17.253.144.10", 443, "TCP", "United States", "Cupertino", 37.323, -122.032),
        ("192.168.1.100", "192.168.1.1", 53, "UDP", None, None, None, None),
        ("192.168.1.102", "54.230.210.45", 443, "TCP", "United States", "Ashburn", 39.0438, -77.4874),
        ("192.168.1.100", "140.82.121.4", 443, "TCP", "United States", "San Francisco", 37.774, -122.419),
        ("192.168.1.150", "185.220.101.1", 4444, "TCP", "Germany", "Berlin", 52.520, 13.405),
        ("192.168.1.100", "1.1.1.1", 53, "UDP", "Australia", "Sydney", -33.868, 151.207),
    ]

    logs = []
    for src, dst, port, proto, country, city, lat, lon in mock_entries:
        is_suspicious = port in (4444, 8888, 6667) or (country and country in ("Russia", "China", "North Korea"))
        log = TrafficLog(
            source_ip=src,
            destination_ip=dst,
            source_port=random.randint(49152, 65535),
            destination_port=port,
            protocol=proto,
            bytes_sent=random.randint(64, 65535),
            bytes_received=random.randint(64, 65535),
            packet_count=random.randint(1, 100),
            country=country,
            city=city,
            latitude=lat,
            longitude=lon,
            is_suspicious=is_suspicious,
        )
        db.add(log)
        logs.append(log)

    await db.commit()
    return logs
