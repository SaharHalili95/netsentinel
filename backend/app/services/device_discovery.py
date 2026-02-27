import logging
import subprocess
import re

from app.config import settings

logger = logging.getLogger(__name__)


def get_local_network() -> str:
    return settings.scan_network


def arp_scan(network: str | None = None) -> list[dict]:
    """Discover devices on the network using ARP scan via nmap."""
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

        xml_output = result.stdout
        # Parse nmap XML output
        host_blocks = re.findall(r"<host.*?</host>", xml_output, re.DOTALL)

        for block in host_blocks:
            device = {}

            # IP address
            ip_match = re.search(r'<address addr="([^"]+)" addrtype="ipv4"', block)
            if ip_match:
                device["ip_address"] = ip_match.group(1)

            # MAC address and vendor
            mac_match = re.search(r'<address addr="([^"]+)" addrtype="mac"(?:\s+vendor="([^"]*)")?', block)
            if mac_match:
                device["mac_address"] = mac_match.group(1)
                device["vendor"] = mac_match.group(2) or None

            # Hostname
            hostname_match = re.search(r'<hostname name="([^"]+)"', block)
            if hostname_match:
                device["hostname"] = hostname_match.group(1)

            # Status
            status_match = re.search(r'<status state="(\w+)"', block)
            if status_match:
                device["is_online"] = status_match.group(1) == "up"

            if "ip_address" in device:
                devices.append(device)

    except subprocess.TimeoutExpired:
        logger.error("ARP scan timed out")
    except FileNotFoundError:
        logger.error("nmap not found. Install with: apt-get install nmap")
        # Fallback: return mock data for development
        devices = _mock_devices()

    return devices


def _mock_devices() -> list[dict]:
    """Return mock devices for development without nmap."""
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
