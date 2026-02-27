from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ScanCreate(BaseModel):
    scan_type: str = "discovery"  # discovery, port_scan, full
    target_network: str | None = None


class ScanResponse(BaseModel):
    id: UUID
    scan_type: str
    status: str
    target_network: str
    devices_found: int
    open_ports_found: int
    duration_seconds: float | None
    error_message: str | None
    started_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ScanResultResponse(BaseModel):
    id: UUID
    scan_id: UUID
    device_id: UUID
    open_ports: dict | None
    os_detection: str | None
    vulnerabilities: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
