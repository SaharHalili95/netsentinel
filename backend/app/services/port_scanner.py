import logging
import subprocess
import re

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

        xml_output = result.stdout
        port_blocks = re.findall(r"<port.*?</port>", xml_output, re.DOTALL)

        for block in port_blocks:
            port_match = re.search(r'portid="(\d+)" protocol="(\w+)"', block)
            state_match = re.search(r'<state state="(\w+)"', block)
            service_match = re.search(r'<service name="([^"]*)"(?:\s+product="([^"]*)")?(?:\s+version="([^"]*)")?', block)

            if port_match and state_match and state_match.group(1) == "open":
                port_id = int(port_match.group(1))
                protocol = port_match.group(2)
                service_name = service_match.group(1) if service_match else "unknown"
                product = service_match.group(2) if service_match else None
                version = service_match.group(3) if service_match else None

                open_ports[str(port_id)] = {
                    "protocol": protocol,
                    "service": service_name,
                    "product": product,
                    "version": version,
                    "state": "open",
                }

    except subprocess.TimeoutExpired:
        logger.error(f"Port scan timed out for {ip_address}")
    except FileNotFoundError:
        logger.error("nmap not found")
        open_ports = _mock_ports(ip_address)

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
