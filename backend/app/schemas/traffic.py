from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TrafficLogResponse(BaseModel):
    id: UUID
    source_ip: str
    destination_ip: str
    source_port: int | None
    destination_port: int | None
    protocol: str
    bytes_sent: int
    bytes_received: int
    packet_count: int
    country: str | None
    city: str | None
    latitude: float | None
    longitude: float | None
    is_suspicious: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TrafficSummary(BaseModel):
    total_bytes: int
    total_packets: int
    unique_sources: int
    unique_destinations: int
    suspicious_count: int
    top_protocols: dict[str, int]
    top_destinations: list[dict]
    geo_data: list[dict]
