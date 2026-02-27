from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AlertCreate(BaseModel):
    device_id: UUID | None = None
    alert_type: str
    severity: str
    title: str
    description: str
    source_ip: str | None = None


class AlertUpdate(BaseModel):
    status: str  # acknowledged, resolved


class AlertResponse(BaseModel):
    id: UUID
    device_id: UUID | None
    alert_type: str
    severity: str
    title: str
    description: str
    status: str
    source_ip: str | None
    resolved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
