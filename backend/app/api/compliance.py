from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.compliance import REQUIRED_DAILY_CHECKS, SOC2_CRITERIA
from app.schemas.compliance import SOC2CheckCreate, SOC2CheckResponse, DailyComplianceStatus
from app.services.compliance import submit_check, get_daily_status, get_history

router = APIRouter()


@router.get("/checks/required")
async def list_required_checks():
    """Return the list of checks required every day for SOC 2."""
    return REQUIRED_DAILY_CHECKS


@router.get("/criteria")
async def list_criteria():
    """Return SOC 2 Trust Service Criteria descriptions."""
    return SOC2_CRITERIA


@router.post("/checks", response_model=SOC2CheckResponse)
async def create_check(data: SOC2CheckCreate, db: AsyncSession = Depends(get_db)):
    """Submit a daily compliance check result."""
    return await submit_check(db, data)


@router.get("/status", response_model=DailyComplianceStatus)
async def daily_status(check_date: date = None, db: AsyncSession = Depends(get_db)):
    """Get today's (or a specific date's) compliance status."""
    target = check_date or date.today()
    return await get_daily_status(db, target)


@router.get("/history")
async def compliance_history(days: int = 30, db: AsyncSession = Depends(get_db)):
    """Return daily compliance scores for the last N days."""
    return await get_history(db, days)
