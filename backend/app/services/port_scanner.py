import logging
import subprocess
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

COMMON_PORTS = "21,22,23,25,53,80,110,135,139,143,443,445,993,995,1433,1521,3306,3389,5432,5900,6379,8080,8443,27017"


def scan_ports(ip_address: str, ports: str | None = None) -> dict:
    """Scan ports on a specific IP using nmap."""
    target_ports = ports or COMMON_PORTS
    open_ports = {}

    try:
        result = subprocess.run(
            ["nmap", "-sV", "-p", target_ports, ip_address, "-oX", "-", "--open"],
            capture_output=True,
            text=True,
            timeout=300,
        )

        if result.returncode != 0:
            logger.error(f"Port scan failed for {ip_address}: {result.stderr}")
            return open_ports

        open_ports = parse_nmap_xml(result.stdout)

    except subprocess.TimeoutExpired:
        logger.error(f"Port scan timed out for {ip_address}")
    except FileNotFoundError:
        logger.error("nmap not found")
        open_ports = _mock_ports(ip_address)

    return open_ports


def parse_nmap_xml(xml_output: str) -> dict:
    """Extract open ports from nmap's -oX output, regardless of attribute order."""
    open_ports = {}
    try:
        root = ET.fromstring(xml_output)
    except ET.ParseError:
        logger.error("Could not parse nmap XML output")
        return open_ports

    for port in root.iter("port"):
        state = port.find("state")
        if state is None or state.get("state") != "open":
            continue
        service = port.find("service")
        open_ports[port.get("portid")] = {
            "protocol": port.get("protocol"),
            "service": service.get("name", "unknown") if service is not None else "unknown",
            "product": service.get("product") if service is not None else None,
            "version": service.get("version") if service is not None else None,
            "state": "open",
        }
    return open_ports


def _mock_ports(ip_address: str) -> dict:
    """Return mock port data for development."""
    if ip_address.endswith(".1"):
        return {
            "80": {"protocol": "tcp", "service": "http", "product": "nginx", "version": "1.24", "state": "open"},
            "443": {"protocol": "tcp", "service": "https", "product": "nginx", "version": "1.24", "state": "open"},
            "53": {"protocol": "tcp", "service": "dns", "product": "dnsmasq", "version": "2.89", "state": "open"},
        }
    elif ip_address.endswith(".100"):
        return {
            "22": {"protocol": "tcp", "service": "ssh", "product": "OpenSSH", "version": "9.6", "state": "open"},
            "3389": {"protocol": "tcp", "service": "ms-wbt-server", "product": None, "version": None, "state": "open"},
        }
    return {}
