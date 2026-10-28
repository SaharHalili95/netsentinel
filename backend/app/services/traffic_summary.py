from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Sequence

from app.schemas.traffic_summary import (
    CountryStat,
    DestinationStat,
    HourlyTraffic,
    ProtocolCount,
    SuspiciousConnection,
    TrafficSummary,
)

TOP_DESTINATIONS = 10


def summarize_traffic(logs: Sequence, now: datetime, hours: int = 24) -> TrafficSummary:
    newest_hour = now.replace(minute=0, second=0, microsecond=0)
    buckets = {
        newest_hour - timedelta(hours=i): {"inbound": 0, "outbound": 0, "suspicious": 0}
        for i in range(hours - 1, -1, -1)
    }

    protocols: Counter[str] = Counter()
    destinations: dict[str, dict] = {}
    countries: dict[str, dict] = defaultdict(lambda: {"connections": 0, "bytes": 0})
    suspicious: dict[tuple, dict] = {}
    total = 0

    for row in logs:
        size = row.bytes_sent + row.bytes_received
        total += size
        protocols[row.protocol] += 1

        dest = destinations.setdefault(
            row.destination_ip,
            {"country": row.country, "city": row.city, "bytes": 0, "connections": 0},
        )
        dest["bytes"] += size
        dest["connections"] += 1

        if row.country:
            countries[row.country]["connections"] += 1
            countries[row.country]["bytes"] += size

        if row.is_suspicious:
            key = (row.destination_ip, row.destination_port)
            entry = suspicious.setdefault(
                key, {"country": row.country, "city": row.city, "bytes": 0, "connections": 0}
            )
            entry["bytes"] += size
            entry["connections"] += 1

        bucket = buckets.get(row.created_at.replace(minute=0, second=0, microsecond=0))
        if bucket is not None:
            bucket["inbound"] += row.bytes_received
            bucket["outbound"] += row.bytes_sent
            bucket["suspicious"] += int(row.is_suspicious)

    return TrafficSummary(
        window_hours=hours,
        total_bytes=total,
        protocols=[ProtocolCount(protocol=p, connections=n) for p, n in protocols.most_common()],
        top_destinations=[
            DestinationStat(ip=ip, **stat)
            for ip, stat in sorted(destinations.items(), key=lambda kv: kv[1]["bytes"], reverse=True)[:TOP_DESTINATIONS]
        ],
        countries=[
            CountryStat(country=c, **stat)
            for c, stat in sorted(countries.items(), key=lambda kv: kv[1]["connections"], reverse=True)
        ],
        suspicious=[
            SuspiciousConnection(destination_ip=ip, destination_port=port, **stat)
            for (ip, port), stat in sorted(suspicious.items(), key=lambda kv: kv[1]["connections"], reverse=True)
        ],
        hourly=[
            HourlyTraffic(hour=h, inbound_bytes=b["inbound"], outbound_bytes=b["outbound"], suspicious=b["suspicious"])
            for h, b in buckets.items()
        ],
    )
