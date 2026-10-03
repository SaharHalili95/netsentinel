"""
Unit tests for ScanCreate.target_network validation.

target_network is passed straight into `subprocess.run(["nmap", ...])`
(services/device_discovery.py) - this guards against anything that
isn't a real CIDR network before it gets that far.
"""

import pytest
from pydantic import ValidationError

from app.schemas.scan import ScanCreate


def test_valid_cidr_accepted():
    scan = ScanCreate(target_network="192.168.1.0/24")
    assert scan.target_network == "192.168.1.0/24"


def test_none_accepted():
    scan = ScanCreate(target_network=None)
    assert scan.target_network is None


def test_default_omitted_accepted():
    scan = ScanCreate()
    assert scan.target_network is None


@pytest.mark.parametrize(
    "bad_value",
    [
        "--script=vuln 10.0.0.1",
        "-oN /app/x 192.168.1.0/24",
        "not a network at all",
        "192.168.1.0/999",
        "",
    ],
)
def test_invalid_target_network_rejected(bad_value):
    with pytest.raises(ValidationError):
        ScanCreate(target_network=bad_value)
