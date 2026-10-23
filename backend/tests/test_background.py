"""
The scheduled jobs push their results to WebSocket clients.

The database session and services are replaced with mocks.
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.tasks import background


@pytest.fixture
def session(monkeypatch):
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=MagicMock())
    ctx.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr(background, "async_session", lambda: ctx)


@pytest.mark.asyncio
async def test_anomaly_check_broadcasts_each_new_alert(session, monkeypatch):
    alerts = [
        SimpleNamespace(id="a1", alert_type="suspicious_port", severity="high", title="Suspicious port connection: 1.2.3.4:4444", source_ip="192.168.1.5"),
        SimpleNamespace(id="a2", alert_type="watchlist_country", severity="medium", title="Connection to watchlist country: Iran", source_ip="192.168.1.5"),
    ]
    monkeypatch.setattr(background, "analyze_traffic_anomalies", AsyncMock(return_value=alerts))
    broadcast = AsyncMock()
    monkeypatch.setattr(background, "broadcast_alert", broadcast)

    await background.scheduled_anomaly_check()

    sent = [call.args[0] for call in broadcast.await_args_list]
    assert [a["title"] for a in sent] == [a.title for a in alerts]
    assert sent[0] == {"id": "a1", "alert_type": "suspicious_port", "severity": "high", "title": alerts[0].title, "source_ip": "192.168.1.5"}


@pytest.mark.asyncio
async def test_discovery_broadcasts_the_finished_scan(session, monkeypatch):
    scan = SimpleNamespace(id="s1", scan_type="discovery", status="completed", devices_found=6, open_ports_found=0)
    monkeypatch.setattr(background, "run_discovery_scan", AsyncMock(return_value=scan))
    broadcast = AsyncMock()
    monkeypatch.setattr(background, "broadcast_scan_update", broadcast)

    await background.scheduled_discovery()

    broadcast.assert_awaited_once_with({"id": "s1", "scan_type": "discovery", "status": "completed", "devices_found": 6, "open_ports_found": 0})
