from fastapi import APIRouter

from app.api.dashboard import router as dashboard_router
from app.api.devices import router as devices_router
from app.api.scans import router as scans_router
from app.api.alerts import router as alerts_router
from app.api.websocket import router as ws_router
from app.api.demo import router as demo_router

api_router = APIRouter()

api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(devices_router, prefix="/devices", tags=["Devices"])
api_router.include_router(scans_router, prefix="/scans", tags=["Scans"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(ws_router, prefix="/ws", tags=["WebSocket"])
api_router.include_router(demo_router, prefix="/demo", tags=["Demo"])
