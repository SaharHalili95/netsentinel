import secrets

from fastapi import Header, HTTPException, status

from app.config import settings


async def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Guards state-changing endpoints (scan triggers, device mutation).

    NetSentinel runs nmap/scapy with NET_RAW/NET_ADMIN; an unauthenticated
    caller must not be able to trigger a scan or edit device records.
    `settings.api_key` is generated at startup (see main.py) if not set
    explicitly via the API_KEY env var.
    """
    if not x_api_key or not secrets.compare_digest(x_api_key, settings.api_key or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid X-API-Key header.",
        )
