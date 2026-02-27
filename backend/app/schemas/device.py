from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DeviceBase(BaseModel):
    ip_address: str
    mac_address: str | None = None
    hostname: str | None = None
    vendor: str | None = None
    device_type: str = "unknown"
    os_info: str | None = None
    is_trusted: bool = False
    notes: str | None = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    hostname: str | None = None
    device_type: str | None = None
    is_trusted: bool | None = None
    notes: str | None = None


class DeviceResponse(DeviceBase):
    id: UUID
    is_online: bool
    first_seen: datetime
    last_seen: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class DeviceWithPorts(DeviceResponse):
    open_ports: dict | None = None
