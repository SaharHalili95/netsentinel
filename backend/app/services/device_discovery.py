import logging
import subprocess
import xml.etree.ElementTree as ET

from app.config import settings

logger = logging.getLogger(__name__)


def get_local_network() -> str:
    return settings.scan_network


def arp_scan(network: str | None = None) -> list[dict]:
    target = network or get_local_network()
    devices = []

    try:
        result = subprocess.run(
            ["nmap", "-sn", "-PR", target, "-oX", "-"],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            logger.error(f"nmap scan failed: {result.stderr}")
            return devices

        devices = parse_hosts_xml(result.stdout)

    except subprocess.TimeoutExpired:
        logger.error("ARP scan timed out")
    except FileNotFoundError:
        logger.error("nmap not found. Install with: apt-get install nmap")
        # Fallback: return mock data for development
        devices = _mock_devices()

    return devices


def parse_hosts_xml(xml_output: str) -> list[dict]:
    try:
        root = ET.fromstring(xml_output)
    except ET.ParseError:
        logger.error("Could not parse nmap XML output")
        return []

    devices = []
    for host in root.findall("host"):
        device = {}
        for address in host.findall("address"):
            if address.get("addrtype") == "ipv4":
                device["ip_address"] = address.get("addr")
            elif address.get("addrtype") == "mac":
                device["mac_address"] = address.get("addr")
                device["vendor"] = address.get("vendor") or None

        hostname = host.find("hostnames/hostname")
        if hostname is not None:
            device["hostname"] = hostname.get("name")

        status = host.find("status")
        if status is not None:
            device["is_online"] = status.get("state") == "up"

        if "ip_address" in device:
            devices.append(device)
    return devices


def _mock_devices() -> list[dict]:
    return [
        {
            "ip_address": "192.168.1.1",
            "mac_address": "AA:BB:CC:DD:EE:01",
            "hostname": "router.local",
            "vendor": "TP-Link",
            "is_online": True,
        },
        {
            "ip_address": "192.168.1.100",
            "mac_address": "AA:BB:CC:DD:EE:02",
            "hostname": "desktop-pc",
            "vendor": "Dell",
            "is_online": True,
        },
        {
            "ip_address": "192.168.1.101",
            "mac_address": "AA:BB:CC:DD:EE:03",
            "hostname": "iphone-sahar",
            "vendor": "Apple",
            "is_online": True,
        },
        {
            "ip_address": "192.168.1.102",
            "mac_address": "AA:BB:CC:DD:EE:04",
            "hostname": "smart-tv",
            "vendor": "Samsung",
            "is_online": True,
        },
        {
            "ip_address": "192.168.1.150",
            "mac_address": "AA:BB:CC:DD:EE:05",
            "hostname": None,
            "vendor": "Unknown",
            "is_online": True,
        },
    ]
