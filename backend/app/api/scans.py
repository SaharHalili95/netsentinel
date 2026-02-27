from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.models.scan import Scan, ScanResult
from app.schemas.scan import ScanCreate, ScanResponse, ScanResultResponse
from app.services.scanner import run_discovery_scan, run_port_scan

router = APIRouter()


@router.get("", response_model=list[ScanResponse])
async def list_scans(
    scan_type: str | None = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(Scan).order_by(Scan.started_at.desc()).limit(limit)
    if scan_type:
        query = query.where(Scan.scan_type == scan_type)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ScanResponse)
async def create_scan(
    data: ScanCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    async def _run_scan(scan_type: str, network: str | None):
        async with async_session() as session:
            if scan_type == "discovery":
                await run_discovery_scan(session, network)
            elif scan_type == "port_scan":
                await run_port_scan(session)
            elif scan_type == "full":
                await run_discovery_scan(session, network)
                await run_port_scan(session)

    # Create initial scan record
    scan = Scan(
        scan_type=data.scan_type,
        status="queued",
        target_network=data.target_network or "192.168.1.0/24",
    )
    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    background_tasks.add_task(_run_scan, data.scan_type, data.target_network)
    return scan


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/{scan_id}/results", response_model=list[ScanResultResponse])
async def get_scan_results(scan_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ScanResult).where(ScanResult.scan_id == scan_id).order_by(ScanResult.created_at)
    )
    return result.scalars().all()
