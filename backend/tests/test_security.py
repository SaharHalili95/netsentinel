"""
Unit tests for app.security.require_api_key

Verifies the X-API-Key dependency added to POST /api/scans and
PATCH/DELETE /api/devices after the nmap-input-validation /
no-auth-on-a-security-tool finding.
"""

import pytest
from fastapi import HTTPException

from app.config import settings
from app.security import require_api_key


@pytest.fixture(autouse=True)
def api_key():
    original = settings.api_key
    settings.api_key = "test-key-123"
    yield settings.api_key
    settings.api_key = original


@pytest.mark.asyncio
async def test_correct_key_passes(api_key):
    await require_api_key(x_api_key=api_key)  # should not raise


@pytest.mark.asyncio
async def test_missing_key_rejected():
    with pytest.raises(HTTPException) as exc_info:
        await require_api_key(x_api_key=None)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_wrong_key_rejected():
    with pytest.raises(HTTPException) as exc_info:
        await require_api_key(x_api_key="not-the-real-key")
    assert exc_info.value.status_code == 401
