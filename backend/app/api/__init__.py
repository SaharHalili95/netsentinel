from fastapi import APIRouter

from app.api.alerts import router as alerts_router
from app.api.compliance import router as compliance_router
from app.api.dashboard import router as dashboard_router
from app.api.demo import router as demo_router
from app.api.devices import router as devices_router
from app.api.health import router as health_router
from app.api.scans import router as scans_router
from app.api.traffic import router as traffic_router
from app.api.websocket import router as ws_router

api_router = APIRouter()

api_router.include_router(health_router, tags=["Health"])
api_router.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
api_router.include_router(devices_router, prefix="/api/devices", tags=["Devices"])
api_router.include_router(scans_router, prefix="/api/scans", tags=["Scans"])
api_router.include_router(alerts_router, prefix="/api/alerts", tags=["Alerts"])
api_router.include_router(ws_router, prefix="/api/ws", tags=["WebSocket"])
api_router.include_router(demo_router, prefix="/api/demo", tags=["Demo"])
api_router.include_router(compliance_router, prefix="/api/compliance", tags=["SOC2 Compliance"])
api_router.include_router(traffic_router, prefix="/api/traffic", tags=["Traffic"])
