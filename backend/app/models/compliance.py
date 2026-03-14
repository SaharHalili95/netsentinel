import uuid
from datetime import datetime, date

from sqlalchemy import String, Boolean, DateTime, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


SOC2_CRITERIA = {
    "CC6.1": "Logical access security measures restrict access to information assets",
    "CC6.2": "New internal and external users are registered and granted access",
    "CC6.3": "Access is removed when no longer required",
    "CC7.1": "Security vulnerabilities are identified and monitored",
    "CC7.2": "Security incidents are identified and responded to",
    "CC7.3": "Security incidents are evaluated and contained",
    "A1.1": "System availability meets performance commitments",
    "A1.2": "Environmental protections and redundancy support availability",
}


class SOC2DailyCheck(Base):
    __tablename__ = "soc2_daily_checks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    check_date: Mapped[date] = mapped_column(Date, index=True)
    check_type: Mapped[str] = mapped_column(String(100))   # access_review, backup_verified, alerts_reviewed, etc.
    criteria: Mapped[str] = mapped_column(String(20))      # CC6.1, CC7.2, A1.1, etc.
    status: Mapped[str] = mapped_column(String(20))        # pass, fail, na
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_ref: Mapped[str | None] = mapped_column(String(500), nullable=True)  # screenshot path / ticket URL
    checked_by: Mapped[str] = mapped_column(String(100), default="system")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# The daily checks required for SOC 2 compliance
REQUIRED_DAILY_CHECKS = [
    {"check_type": "alerts_reviewed",       "criteria": "CC7.2", "description": "All open security alerts have been reviewed"},
    {"check_type": "access_review",         "criteria": "CC6.1", "description": "Privileged access list reviewed — no unauthorized accounts"},
    {"check_type": "backup_verified",       "criteria": "A1.2",  "description": "Database backup completed and verified"},
    {"check_type": "vulnerability_scan",    "criteria": "CC7.1", "description": "Vulnerability scan executed and results reviewed"},
    {"check_type": "incident_log_reviewed", "criteria": "CC7.3", "description": "Incident log reviewed and all incidents have owners"},
    {"check_type": "system_availability",   "criteria": "A1.1",  "description": "All services are healthy and meeting uptime SLA"},
]
