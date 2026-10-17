"""
Unit tests for app.services.port_scanner

subprocess.run is patched, so nmap does not need to be installed.
"""

import subprocess
from types import SimpleNamespace
from unittest.mock import patch

from app.services.port_scanner import COMMON_PORTS, parse_nmap_xml, scan_ports

NMAP_XML = """<?xml version="1.0"?>
<nmaprun>
<host><ports>
<port protocol="tcp" portid="22"><state state="open" reason="syn-ack"/><service name="ssh" product="OpenSSH" version="9.6"/></port>
<port protocol="tcp" portid="80"><state state="open" reason="syn-ack"/><service name="http"/></port>
<port protocol="tcp" portid="443"><state state="filtered" reason="no-response"/><service name="https"/></port>
</ports></host>
</nmaprun>"""


def completed(stdout="", returncode=0, stderr=""):
    return SimpleNamespace(stdout=stdout, returncode=returncode, stderr=stderr)


@patch("app.services.port_scanner.subprocess.run")
def test_parses_open_ports_from_nmap_xml(run):
    run.return_value = completed(NMAP_XML)

    ports = scan_ports("192.168.1.5")

    assert set(ports) == {"22", "80"}
    assert ports["22"] == {
        "protocol": "tcp",
        "service": "ssh",
        "product": "OpenSSH",
        "version": "9.6",
        "state": "open",
    }
    assert ports["80"]["product"] is None


@patch("app.services.port_scanner.subprocess.run")
def test_uses_common_ports_by_default(run):
    run.return_value = completed(NMAP_XML)
    scan_ports("192.168.1.5")
    args = run.call_args.args[0]
    assert args[args.index("-p") + 1] == COMMON_PORTS


@patch("app.services.port_scanner.subprocess.run")
def test_passes_target_as_separate_argument(run):
    run.return_value = completed(NMAP_XML)
    scan_ports("192.168.1.5", "22,80")
    args = run.call_args.args[0]
    assert "192.168.1.5" in args
    assert "22,80" in args
    assert run.call_args.kwargs.get("shell") is not True


@patch("app.services.port_scanner.subprocess.run")
def test_nmap_failure_returns_empty(run):
    run.return_value = completed(returncode=1, stderr="boom")
    assert scan_ports("192.168.1.5") == {}


@patch("app.services.port_scanner.subprocess.run", side_effect=subprocess.TimeoutExpired("nmap", 300))
def test_timeout_returns_empty(run):
    assert scan_ports("192.168.1.5") == {}


@patch("app.services.port_scanner.subprocess.run", side_effect=FileNotFoundError)
def test_missing_nmap_falls_back_to_mock_data(run):
    ports = scan_ports("192.168.1.1")
    assert {"80", "443", "53"} <= set(ports)


def test_attribute_order_does_not_matter():
    xml = '<nmaprun><port portid="8080" protocol="tcp"><state state="open"/><service version="2" name="http-proxy"/></port></nmaprun>'
    assert parse_nmap_xml(xml)["8080"]["service"] == "http-proxy"


def test_invalid_xml_returns_empty():
    assert parse_nmap_xml("<nmaprun><port") == {}


def test_port_without_service_is_unknown():
    xml = '<nmaprun><port protocol="udp" portid="161"><state state="open"/></port></nmaprun>'
    assert parse_nmap_xml(xml)["161"] == {
        "protocol": "udp",
        "service": "unknown",
        "product": None,
        "version": None,
        "state": "open",
    }
