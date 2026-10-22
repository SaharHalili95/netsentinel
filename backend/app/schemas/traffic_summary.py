from datetime import datetime

from pydantic import BaseModel


class ProtocolCount(BaseModel):
    protocol: str
    connections: int


class DestinationStat(BaseModel):
    ip: str
    country: str | None
    city: str | None
    bytes: int
    connections: int


class CountryStat(BaseModel):
    country: str
    connections: int
    bytes: int


class SuspiciousConnection(BaseModel):
    destination_ip: str
    destination_port: int | None
    country: str | None
    city: str | None
    bytes: int
    connections: int


class HourlyTraffic(BaseModel):
    hour: datetime
    inbound_bytes: int
    outbound_bytes: int
    suspicious: int


class TrafficSummary(BaseModel):
    window_hours: int
    total_bytes: int
    protocols: list[ProtocolCount]
    top_destinations: list[DestinationStat]
    countries: list[CountryStat]
    suspicious: list[SuspiciousConnection]
    hourly: list[HourlyTraffic]
