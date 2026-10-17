"""
Unit tests for app.services.device_discovery

subprocess.run is patched, so nmap does not need to be installed.
"""

from types import SimpleNamespace
from unittest.mock import patch

from app.services.device_discovery import arp_scan, parse_hosts_xml

# Shape of `nmap -sn -PR -oX -` from nmap 7.9x, including the <hosthint> element.
NMAP_XML = """<?xml version="1.0"?>
<nmaprun>
<hosthint><status state="up" reason="arp-response"/>
<address addr="192.168.1.1" addrtype="ipv4"/>
<address addr="AA:BB:CC:DD:EE:01" addrtype="mac" vendor="TP-Link"/>
</hosthint>
<host><status state="up" reason="arp-response"/>
<address addr="192.168.1.1" addrtype="ipv4"/>
<address addr="AA:BB:CC:DD:EE:01" addrtype="mac" vendor="TP-Link"/>
<hostnames><hostname name="router.local" type="PTR"/></hostnames>
</host>
<host><status state="up" reason="arp-response"/>
<address addr="192.168.1.50" addrtype="ipv4"/>
<address addr="AA:BB:CC:DD:EE:50" addrtype="mac"/>
<hostnames/>
</host>
<runstats><hosts up="2" down="252" total="254"/></runstats>
</nmaprun>"""


def test_parses_each_host_once_and_ignores_hosthints():
    devices = parse_hosts_xml(NMAP_XML)

    assert [d["ip_address"] for d in devices] == ["192.168.1.1", "192.168.1.50"]


def test_reads_mac_vendor_hostname_and_status():
    router = parse_hosts_xml(NMAP_XML)[0]

    assert router == {
        "ip_address": "192.168.1.1",
        "mac_address": "AA:BB:CC:DD:EE:01",
        "vendor": "TP-Link",
        "hostname": "router.local",
        "is_online": True,
    }


def test_missing_vendor_and_hostname():
    device = parse_hosts_xml(NMAP_XML)[1]

    assert device["vendor"] is None
    assert "hostname" not in device


def test_host_without_ipv4_is_skipped():
    xml = '<nmaprun><host><status state="up"/><address addr="AA:BB:CC:DD:EE:FF" addrtype="mac"/></host></nmaprun>'
    assert parse_hosts_xml(xml) == []


def test_invalid_xml_returns_empty():
    assert parse_hosts_xml("<nmaprun><host>") == []


@patch("app.services.device_discovery.subprocess.run")
def test_arp_scan_returns_parsed_devices(run):
    run.return_value = SimpleNamespace(stdout=NMAP_XML, returncode=0, stderr="")
    assert len(arp_scan("192.168.1.0/24")) == 2
    assert run.call_args.args[0][3] == "192.168.1.0/24"


@patch("app.services.device_discovery.subprocess.run", side_effect=FileNotFoundError)
def test_arp_scan_without_nmap_uses_mock_devices(run):
    assert len(arp_scan()) == 5
