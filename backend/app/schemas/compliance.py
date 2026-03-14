from datetime import datetime, date
from uuid import UUID

from pydantic import BaseModel


class SOC2CheckCreate(BaseModel):
    check_date: date
    check_type: str
    criteria: str
    status: str          # pass, fail, na
    notes: str | None = None
    evidence_ref: str | None = None
    checked_by: str = "system"


class SOC2CheckResponse(BaseModel):
    id: UUID
    check_date: date
    check_type: str
    criteria: str
    status: str
    notes: str | None
    evidence_ref: str | None
    checked_by: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DailyComplianceStatus(BaseModel):
    check_date: date
    total_checks: int
    passed: int
    failed: int
    missing: int          # required checks not yet submitted today
    score_pct: float      # (passed / total_required) * 100
    checks: list[SOC2CheckResponse]
    missing_checks: list[str]  # check_type names not yet done today
