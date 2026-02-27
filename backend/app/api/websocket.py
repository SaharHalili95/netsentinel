import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.active_connections.remove(conn)


manager = ConnectionManager()


@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages
            data = await websocket.receive_text()
            # Echo back or handle commands
            await websocket.send_json({
                "type": "pong",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def broadcast_alert(alert_data: dict):
    """Broadcast a new alert to all connected WebSocket clients."""
    await manager.broadcast({
        "type": "alert",
        "data": alert_data,
    })


async def broadcast_scan_update(scan_data: dict):
    """Broadcast scan progress to all connected WebSocket clients."""
    await manager.broadcast({
        "type": "scan_update",
        "data": scan_data,
    })


async def broadcast_device_update(device_data: dict):
    """Broadcast device status changes to all connected WebSocket clients."""
    await manager.broadcast({
        "type": "device_update",
        "data": device_data,
    })
