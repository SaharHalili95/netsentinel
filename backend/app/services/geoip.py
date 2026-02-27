import ipaddress
import logging
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

_reader = None


def _get_reader():
    global _reader
    if _reader is not None:
        return _reader

    db_path = Path(settings.geoip_db_path)
    if not db_path.exists():
        logger.warning(f"GeoIP database not found at {db_path}. GeoIP lookups will return None.")
        return None

    try:
        import geoip2.database
        _reader = geoip2.database.Reader(str(db_path))
        return _reader
    except Exception as e:
        logger.error(f"Failed to load GeoIP database: {e}")
        return None


def is_private_ip(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return False


def lookup(ip: str) -> dict | None:
    """Look up geographic information for an IP address."""
    if is_private_ip(ip):
        return None

    reader = _get_reader()
    if reader is None:
        return _mock_lookup(ip)

    try:
        response = reader.city(ip)
        return {
            "country": response.country.name,
            "city": response.city.name,
            "latitude": response.location.latitude,
            "longitude": response.location.longitude,
            "iso_code": response.country.iso_code,
        }
    except Exception:
        return None


def _mock_lookup(ip: str) -> dict | None:
    """Mock GeoIP data for development."""
    mock_data = {
        "8.8.8.8": {"country": "United States", "city": "Mountain View", "latitude": 37.386, "longitude": -122.084, "iso_code": "US"},
        "1.1.1.1": {"country": "Australia", "city": "Sydney", "latitude": -33.868, "longitude": 151.207, "iso_code": "AU"},
        "9.9.9.9": {"country": "United States", "city": "Berkeley", "latitude": 37.876, "longitude": -122.259, "iso_code": "US"},
    }
    return mock_data.get(ip)
