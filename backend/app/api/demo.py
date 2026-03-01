"""
Demo scan endpoint — returns rich simulated network data.
Works without nmap/scapy on the server.
"""
import asyncio
import json
import random
import time
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()

# ── Realistic device pool ──────────────────────────────────────────────────────
DEVICE_POOL = [
    {
        "hostname": "router.local",
        "vendor": "TP-Link",
        "type": "Router",
        "os": "OpenWrt 22.03",
        "ports": {80: "http", 443: "https", 53: "dns", 22: "ssh", 8080: "http-alt"},
        "bandwidth_mb": (12.4, 8.1),   # (up, down) MB/s avg
        "latency_ms": 2,
        "wireless": False,
        "vulnerabilities": [
            {"cve": "CVE-2022-46169", "severity": "critical", "description": "Remote code execution via unauthenticated API in Cacti < 1.2.23"},
        ],
    },
    {
        "hostname": "desktop-pc",
        "vendor": "Dell",
        "type": "Desktop",
        "os": "Windows 11 Pro 22H2",
        "ports": {22: "ssh", 3389: "ms-wbt-server", 445: "microsoft-ds", 135: "msrpc"},
        "bandwidth_mb": (3.2, 15.7),
        "latency_ms": 4,
        "wireless": False,
        "vulnerabilities": [
            {"cve": "CVE-2023-21563", "severity": "high", "description": "BitLocker bypass vulnerability in Windows 11"},
            {"cve": "CVE-2023-35311", "severity": "high", "description": "Microsoft Outlook security feature bypass"},
        ],
    },
    {
        "hostname": "macbook-pro",
        "vendor": "Apple",
        "type": "Laptop",
        "os": "macOS 14.3 Sonoma",
        "ports": {22: "ssh", 5900: "vnc", 548: "afp", 88: "kerberos"},
        "bandwidth_mb": (5.1, 22.3),
        "latency_ms": 6,
        "wireless": True,
        "vulnerabilities": [],
    },
    {
        "hostname": "iphone-15",
        "vendor": "Apple",
        "type": "Mobile",
        "os": "iOS 17.3",
        "ports": {},
        "bandwidth_mb": (0.8, 3.4),
        "latency_ms": 9,
        "wireless": True,
        "vulnerabilities": [],
    },
    {
        "hostname": "android-phone",
        "vendor": "Samsung",
        "type": "Mobile",
        "os": "Android 14 (One UI 6.0)",
        "ports": {},
        "bandwidth_mb": (0.5, 2.1),
        "latency_ms": 12,
        "wireless": True,
        "vulnerabilities": [],
    },
    {
        "hostname": "samsung-tv",
        "vendor": "Samsung",
        "type": "TV",
        "os": "Tizen 6.5",
        "ports": {8080: "http-alt", 7676: "imqbrokerd", 9197: "unknown"},
        "bandwidth_mb": (0.2, 8.9),
        "latency_ms": 15,
        "wireless": True,
        "vulnerabilities": [
            {"cve": "CVE-2019-10761", "severity": "medium", "description": "Samsung SmartTV information disclosure via UPnP"},
        ],
    },
    {
        "hostname": "raspberry-pi",
        "vendor": "Raspberry Pi Foundation",
        "type": "Server",
        "os": "Raspberry Pi OS 11 (Bullseye)",
        "ports": {22: "ssh", 80: "http", 8080: "http-alt", 3000: "ppp", 9090: "zeus-admin"},
        "bandwidth_mb": (1.1, 2.3),
        "latency_ms": 5,
        "wireless": False,
        "vulnerabilities": [
            {"cve": "CVE-2023-0464", "severity": "high", "description": "OpenSSL excessive resource usage in certificate chain verification"},
        ],
    },
    {
        "hostname": "nas-storage",
        "vendor": "Synology",
        "type": "NAS",
        "os": "DiskStation Manager 7.2",
        "ports": {22: "ssh", 80: "http", 443: "https", 5000: "upnp", 5001: "commplex-link", 6690: "unknown"},
        "bandwidth_mb": (2.8, 45.2),
        "latency_ms": 3,
        "wireless": False,
        "vulnerabilities": [
            {"cve": "CVE-2023-2729", "severity": "medium", "description": "Synology DSM information disclosure vulnerability"},
        ],
    },
    {
        "hostname": "ring-doorbell",
        "vendor": "Ring",
        "type": "IoT",
        "os": "Ring Firmware 3.4.7",
        "ports": {443: "https", 8443: "pcsync-https"},
        "bandwidth_mb": (0.1, 0.4),
        "latency_ms": 22,
        "wireless": True,
        "vulnerabilities": [],
    },
    {
        "hostname": "hp-printer",
        "vendor": "HP",
        "type": "Printer",
        "os": "HP FutureSmart 5.4",
        "ports": {80: "http", 443: "https", 9100: "jetdirect", 515: "printer", 631: "ipp"},
        "bandwidth_mb": (0.05, 0.1),
        "latency_ms": 18,
        "wireless": True,
        "vulnerabilities": [
            {"cve": "CVE-2021-39238", "severity": "critical", "description": "HP printer remote code execution via font parser"},
        ],
    },
    {
        "hostname": "echo-dot",
        "vendor": "Amazon",
        "type": "IoT",
        "os": "Fire OS 7.3.2",
        "ports": {443: "https", 4070: "unknown"},
        "bandwidth_mb": (0.05, 0.2),
        "latency_ms": 25,
        "wireless": True,
        "vulnerabilities": [],
    },
    {
        "hostname": None,
        "vendor": "Unknown",
        "type": "Unknown",
        "os": "Unknown",
        "ports": {4444: "backdoor?", 445: "microsoft-ds", 1337: "waste", 6667: "irc"},
        "bandwidth_mb": (2.5, 1.8),
        "latency_ms": 45,
        "wireless": True,
        "vulnerabilities": [
            {"cve": "CVE-2017-0144", "severity": "critical", "description": "EternalBlue SMB remote code execution (MS17-010)"},
        ],
    },
]

EXTERNAL_CONNECTIONS = [
    {
        "dst": "8.8.8.8",         "country": "United States", "city": "Mountain View",
        "lat": 37.386,  "lon": -122.084, "service": "Google DNS",
        "sus": False, "port": 53, "proto": "UDP",
        "bytes_sent": 14200, "bytes_recv": 18900, "packets": 312,
        "asn": "AS15169", "org": "Google LLC",
    },
    {
        "dst": "1.1.1.1",         "country": "Australia",     "city": "Sydney",
        "lat": -33.868, "lon": 151.207,  "service": "Cloudflare DNS",
        "sus": False, "port": 53, "proto": "UDP",
        "bytes_sent": 9800,  "bytes_recv": 12400, "packets": 201,
        "asn": "AS13335", "org": "Cloudflare, Inc.",
    },
    {
        "dst": "140.82.121.4",    "country": "United States", "city": "San Francisco",
        "lat": 37.774,  "lon": -122.419, "service": "GitHub",
        "sus": False, "port": 443, "proto": "TCP",
        "bytes_sent": 458000, "bytes_recv": 2310000, "packets": 4821,
        "asn": "AS36459", "org": "GitHub, Inc.",
    },
    {
        "dst": "151.101.1.140",   "country": "United States", "city": "San Francisco",
        "lat": 37.774,  "lon": -122.419, "service": "Fastly CDN",
        "sus": False, "port": 443, "proto": "TCP",
        "bytes_sent": 102000, "bytes_recv": 8940000, "packets": 7320,
        "asn": "AS54113", "org": "Fastly, Inc.",
    },
    {
        "dst": "17.253.144.10",   "country": "United States", "city": "Cupertino",
        "lat": 37.323,  "lon": -122.032, "service": "Apple",
        "sus": False, "port": 443, "proto": "TCP",
        "bytes_sent": 214000, "bytes_recv": 1820000, "packets": 3102,
        "asn": "AS714",   "org": "Apple Inc.",
    },
    {
        "dst": "34.117.188.166",  "country": "United States", "city": "Iowa",
        "lat": 41.878,  "lon": -93.097,  "service": "Google Cloud",
        "sus": False, "port": 443, "proto": "TCP",
        "bytes_sent": 88000,  "bytes_recv": 340000, "packets": 912,
        "asn": "AS396982", "org": "Google Cloud",
    },
    {
        "dst": "185.220.101.1",   "country": "Germany",       "city": "Berlin",
        "lat": 52.520,  "lon": 13.405,   "service": "Tor Exit Node",
        "sus": True,  "port": 4444, "proto": "TCP",
        "bytes_sent": 128000, "bytes_recv": 54000,  "packets": 1840,
        "asn": "AS60729", "org": "Zwiebeltoralf e.V. (Tor)",
        "threat": "Known Tor exit relay — C2 communication suspected",
    },
    {
        "dst": "45.142.212.100",  "country": "Russia",        "city": "Moscow",
        "lat": 55.751,  "lon": 37.616,   "service": "Unknown",
        "sus": True,  "port": 8080, "proto": "TCP",
        "bytes_sent": 340000, "bytes_recv": 87000,  "packets": 2910,
        "asn": "AS208091", "org": "Packet Exchange Limited",
        "threat": "IP flagged in multiple threat intel feeds (AbuseIPDB score: 97)",
    },
    {
        "dst": "91.108.4.167",    "country": "Netherlands",   "city": "Amsterdam",
        "lat": 52.374,  "lon": 4.898,    "service": "Telegram",
        "sus": False, "port": 443, "proto": "TCP",
        "bytes_sent": 42000,  "bytes_recv": 210000, "packets": 780,
        "asn": "AS62041", "org": "Telegram Messenger Inc.",
    },
]

ALERT_TEMPLATES = [
    {
        "severity": "critical",
        "type": "brute_force",
        "title": "SSH Brute Force detected on {ip}",
        "description": "47 failed login attempts in 60 seconds from 192.168.1.{rand}. Account lockout triggered.",
    },
    {
        "severity": "critical",
        "type": "arp_spoofing",
        "title": "ARP Spoofing attack detected",
        "description": "192.168.1.{rand} is broadcasting fake ARP replies, attempting MITM between router and devices.",
    },
    {
        "severity": "high",
        "type": "port_scan",
        "title": "Port scan from {ip}",
        "description": "Sequential port scan detected: 1024 ports probed in 3.2s. SYN flood pattern.",
    },
    {
        "severity": "high",
        "type": "new_device",
        "title": "Unknown device joined network: {ip}",
        "description": "Unrecognized device connected. MAC: {mac}, Vendor lookup: Unknown. Not on trusted list.",
    },
    {
        "severity": "high",
        "type": "open_port",
        "title": "Risky port(s) open on {ip}",
        "description": "Port 3389 (RDP) exposed. This service is actively targeted by ransomware groups.",
    },
    {
        "severity": "medium",
        "type": "watchlist_country",
        "title": "Connection to watchlist country from {ip}",
        "description": "Outbound connection to Russia (45.142.212.100:8080). IP appears in 3 threat intel feeds.",
    },
    {
        "severity": "medium",
        "type": "dns_anomaly",
        "title": "DNS tunneling suspected from {ip}",
        "description": "Unusually long DNS queries detected (avg 187 chars). Possible data exfiltration via DNS.",
    },
    {
        "severity": "low",
        "type": "weak_cipher",
        "title": "Weak TLS cipher on {ip}",
        "description": "TLS 1.0 with RC4 cipher detected on port 443. Upgrade to TLS 1.3 recommended.",
    },
]


def _random_ip(subnet="192.168.1"):
    return f"{subnet}.{random.randint(2, 200)}"


def _random_mac():
    return ":".join(f"{random.randint(0, 255):02X}" for _ in range(6))


def _format_bytes(b: int) -> str:
    if b >= 1_000_000:
        return f"{b/1_000_000:.1f} MB"
    if b >= 1_000:
        return f"{b/1_000:.1f} KB"
    return f"{b} B"


def _build_devices(count: int) -> list[dict]:
    pool = random.sample(DEVICE_POOL, min(count, len(DEVICE_POOL)))
    subnet = "192.168.1"
    used_hosts = {1}
    devices = []

    for tmpl in pool:
        while True:
            host = random.randint(2, 200)
            if host not in used_hosts:
                used_hosts.add(host)
                break

        ip = f"{subnet}.{host}"
        is_new = tmpl["vendor"] == "Unknown"
        sus_ports = [p for p in tmpl["ports"] if p in {4444, 445, 1337, 6667, 5900, 3389, 23}]
        bw_up, bw_down = tmpl["bandwidth_mb"]
        bw_up  = round(bw_up  * random.uniform(0.7, 1.3), 2)
        bw_down = round(bw_down * random.uniform(0.7, 1.3), 2)

        # Last seen time (randomized within last hour)
        last_seen = datetime.now(timezone.utc) - timedelta(seconds=random.randint(0, 3600))

        devices.append({
            "ip_address":    ip,
            "mac_address":   _random_mac(),
            "hostname":      tmpl["hostname"],
            "vendor":        tmpl["vendor"],
            "device_type":   tmpl["type"].lower(),
            "os":            tmpl["os"],
            "is_online":     True,
            "is_trusted":    not is_new,
            "is_new":        is_new,
            "wireless":      tmpl["wireless"],
            "latency_ms":    tmpl["latency_ms"] + random.randint(-2, 8),
            "bandwidth": {
                "upload_mbps":   bw_up,
                "download_mbps": bw_down,
                "total_today_mb": round((bw_up + bw_down) * random.uniform(100, 800), 1),
            },
            "open_ports": {
                str(port): {
                    "service":  svc,
                    "state":    "open",
                    "protocol": "tcp",
                    "banner":   _port_banner(port),
                }
                for port, svc in tmpl["ports"].items()
            },
            "has_suspicious_ports": len(sus_ports) > 0,
            "suspicious_ports":     [str(p) for p in sus_ports],
            "vulnerabilities":      tmpl["vulnerabilities"],
            "last_seen":     last_seen.isoformat(),
            "first_seen":    (last_seen - timedelta(days=random.randint(0, 90))).isoformat(),
            "risk_score":    _calc_risk(tmpl, sus_ports),
        })

    # Sort: highest risk first
    devices.sort(key=lambda d: d["risk_score"], reverse=True)
    return devices


def _port_banner(port: int) -> str:
    banners = {
        22:   "OpenSSH 8.9p1 Ubuntu-3",
        80:   "Apache/2.4.54 (Debian)",
        443:  "nginx/1.24.0",
        445:  "Windows 10/11 SMB",
        3389: "Microsoft Terminal Service",
        4444: "— (no banner — suspicious)",
        5900: "VNC Protocol 3.8",
        8080: "Jetty 10.0.13",
        9100: "HP JetDirect",
        53:   "dnsmasq-2.89",
        5000: "Synology DiskStation",
    }
    return banners.get(port, "")


def _calc_risk(tmpl: dict, sus_ports: list) -> int:
    score = 0
    if tmpl["vendor"] == "Unknown":
        score += 40
    score += len(sus_ports) * 15
    score += sum(
        30 if v["severity"] == "critical" else 20 if v["severity"] == "high" else 10
        for v in tmpl["vulnerabilities"]
    )
    return min(score, 100)


def _build_alerts(devices: list[dict]) -> list[dict]:
    alerts = []
    now = datetime.now(timezone.utc)

    for dev in devices:
        if dev["is_new"]:
            alerts.append({
                "severity":    "high",
                "type":        "new_device",
                "title":       f"Unknown device joined network: {dev['ip_address']}",
                "description": f"Unrecognized device connected. MAC: {dev['mac_address']}, Vendor lookup: {dev['vendor']}. Not on trusted list.",
                "source_ip":   dev["ip_address"],
                "timestamp":   now.isoformat(),
                "acknowledged": False,
            })
        if dev["has_suspicious_ports"]:
            sus = dev["suspicious_ports"]
            is_crit = "4444" in sus or "1337" in sus
            alerts.append({
                "severity":    "critical" if is_crit else "high",
                "type":        "open_port",
                "title":       f"Risky port(s) open on {dev['ip_address']}",
                "description": f"Ports {', '.join(sus)} detected on {dev['hostname'] or dev['ip_address']}. "
                               + ("Port 4444 is commonly used by Metasploit/C2 frameworks." if "4444" in sus else
                                  "Port 3389 (RDP) is actively targeted by ransomware groups."),
                "source_ip":   dev["ip_address"],
                "timestamp":   (now - timedelta(minutes=random.randint(1, 10))).isoformat(),
                "acknowledged": False,
            })
        for vuln in dev["vulnerabilities"]:
            if vuln["severity"] in ("critical", "high"):
                alerts.append({
                    "severity":    vuln["severity"],
                    "type":        "vulnerability",
                    "title":       f"{vuln['cve']} on {dev['ip_address']} ({dev['hostname'] or 'Unknown'})",
                    "description": vuln["description"],
                    "source_ip":   dev["ip_address"],
                    "timestamp":   (now - timedelta(minutes=random.randint(5, 60))).isoformat(),
                    "acknowledged": False,
                    "cve":         vuln["cve"],
                })

    # Suspicious traffic alerts
    sus_conns = [c for c in EXTERNAL_CONNECTIONS if c["sus"]]
    src_ips   = [d["ip_address"] for d in devices]
    for conn in sus_conns:
        alerts.append({
            "severity":    "critical",
            "type":        "suspicious_traffic",
            "title":       f"Suspicious outbound: {conn['dst']} ({conn['country']})",
            "description": conn.get("threat", f"Connection to {conn['service']} on port {conn['port']} — {conn['city']}, {conn['country']}"),
            "source_ip":   random.choice(src_ips),
            "dst_ip":      conn["dst"],
            "port":        conn["port"],
            "timestamp":   (now - timedelta(minutes=random.randint(1, 30))).isoformat(),
            "acknowledged": False,
        })

    # Add a random brute-force alert for flavour
    if src_ips:
        victim = random.choice(src_ips)
        alerts.append({
            "severity":    "critical",
            "type":        "brute_force",
            "title":       f"SSH Brute Force detected on {victim}",
            "description": f"47 failed login attempts in 60s from 192.168.1.{random.randint(2,200)}. Account lockout triggered.",
            "source_ip":   victim,
            "timestamp":   (now - timedelta(minutes=random.randint(0, 5))).isoformat(),
            "acknowledged": False,
        })

    # Sort by severity
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda a: order.get(a["severity"], 9))
    return alerts


def _build_timeline() -> list[dict]:
    """Last 24 hours of traffic data (hourly buckets)."""
    now = datetime.now(timezone.utc)
    points = []
    for h in range(23, -1, -1):
        ts = now - timedelta(hours=h)
        # Simulate realistic traffic with business-hours peaks
        hour = ts.hour
        base = 1.0 if 0 <= hour < 7 else 3.5 if 7 <= hour < 9 else 8.0 if 9 <= hour < 18 else 4.0
        points.append({
            "time":         ts.strftime("%H:%M"),
            "upload_mbps":   round(base * random.uniform(0.5, 1.4), 2),
            "download_mbps": round(base * random.uniform(1.2, 3.0), 2),
            "packets":       random.randint(800, 8000),
        })
    return points


@router.get("/scan")
async def demo_scan(count: int = 8):
    """
    Simulate a realistic network scan. Streams NDJSON lines so the client
    can show progress in real time.
    """
    device_count = max(4, min(count, len(DEVICE_POOL)))

    async def generate():
        start = time.time()

        # Phase 1 — ARP discovery
        yield '{"phase":"discovery","message":"Initializing network interface eth0…","progress":3}\n'
        await asyncio.sleep(0.5)
        yield '{"phase":"discovery","message":"Starting ARP scan on 192.168.1.0/24…","progress":8}\n'
        await asyncio.sleep(0.8)
        yield '{"phase":"discovery","message":"Broadcasting ARP requests to all 254 hosts…","progress":18}\n'
        await asyncio.sleep(1.0)

        devices = _build_devices(device_count)
        found = len(devices)

        yield f'{{"phase":"discovery","message":"Found {found} live hosts","progress":30,"devices_found":{found}}}\n'
        await asyncio.sleep(0.4)
        yield '{"phase":"discovery","message":"Resolving hostnames via mDNS/NetBIOS…","progress":38}\n'
        await asyncio.sleep(0.6)

        # Phase 2 — Port scan
        yield '{"phase":"port_scan","message":"Starting SYN port scan on discovered devices…","progress":42}\n'
        await asyncio.sleep(0.5)

        for i, dev in enumerate(devices):
            pct = 42 + int((i + 1) / found * 28)
            n_ports = len(dev["open_ports"])
            yield (
                f'{{"phase":"port_scan","message":"Scanning {dev["ip_address"]} ({dev["hostname"] or "unknown"}) — '
                f'{n_ports} open port(s)","progress":{pct}}}\n'
            )
            await asyncio.sleep(random.uniform(0.2, 0.45))

        yield '{"phase":"port_scan","message":"OS fingerprinting complete","progress":72}\n'
        await asyncio.sleep(0.4)

        # Phase 3 — Vulnerability assessment
        yield '{"phase":"vuln_scan","message":"Checking CVE database for known vulnerabilities…","progress":76}\n'
        await asyncio.sleep(0.7)

        total_vulns = sum(len(d["vulnerabilities"]) for d in devices)
        yield f'{{"phase":"vuln_scan","message":"Found {total_vulns} potential vulnerabilities","progress":82}}\n'
        await asyncio.sleep(0.4)

        # Phase 4 — Traffic analysis
        yield '{"phase":"traffic","message":"Capturing live traffic (10s sample)…","progress":85}\n'
        await asyncio.sleep(0.8)

        traffic = random.sample(EXTERNAL_CONNECTIONS, min(7, len(EXTERNAL_CONNECTIONS)))
        timeline = _build_timeline()

        yield '{"phase":"traffic","message":"GeoIP lookup and ASN resolution complete","progress":91}\n'
        await asyncio.sleep(0.4)

        # Phase 5 — Anomaly detection
        yield '{"phase":"anomaly","message":"Running anomaly detection engine…","progress":94}\n'
        await asyncio.sleep(0.5)

        alerts = _build_alerts(devices)
        critical_count = sum(1 for a in alerts if a["severity"] == "critical")

        yield f'{{"phase":"anomaly","message":"Detected {len(alerts)} alerts ({critical_count} critical)","progress":98}}\n'
        await asyncio.sleep(0.3)

        duration = round(time.time() - start, 2)

        # Final result
        result = {
            "phase":    "complete",
            "message":  "Scan complete",
            "progress": 100,
            "duration_seconds": duration,
            "result": {
                "devices": devices,
                "alerts":  alerts,
                "traffic": traffic,
                "timeline": timeline,
                "summary": {
                    "devices_found":         found,
                    "online_devices":        sum(1 for d in devices if d["is_online"]),
                    "open_ports":            sum(len(d["open_ports"]) for d in devices),
                    "new_devices":           sum(1 for d in devices if d["is_new"]),
                    "alerts":                len(alerts),
                    "critical_alerts":       critical_count,
                    "vulnerabilities":       sum(len(d["vulnerabilities"]) for d in devices),
                    "suspicious_connections": sum(1 for t in traffic if t["sus"]),
                    "total_bandwidth_mb":    round(sum(
                        d["bandwidth"]["upload_mbps"] + d["bandwidth"]["download_mbps"]
                        for d in devices
                    ), 1),
                    "duration": duration,
                },
            },
        }
        yield json.dumps(result) + "\n"

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control":      "no-cache",
            "X-Accel-Buffering":  "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/status")
async def demo_status():
    """Quick health check that the demo backend is live."""
    return {
        "status":    "live",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message":   "NetSentinel demo backend is running",
    }
