from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.device import Device
from app.models.scan import ScanResult
from app.schemas.device import DeviceResponse, DeviceUpdate, DeviceWithPorts

router = APIRouter()


@router.get("", response_model=list[DeviceResponse])
async def list_devices(
    online_only: bool = False,
    trusted_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    query = select(Device).order_by(Device.last_seen.desc())
    if online_only:
        query = query.where(Device.is_online == True)
    if trusted_only:
        query = query.where(Device.is_trusted == True)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{device_id}", response_model=DeviceWithPorts)
async def get_device(device_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Get latest scan result with ports
    scan_result = await db.execute(
        select(ScanResult)
        .where(ScanResult.device_id == device_id)
        .where(ScanResult.open_ports.isnot(None))
        .order_by(ScanResult.created_at.desc())
        .limit(1)
    )
    latest_scan = scan_result.scalar_one_or_none()

    return DeviceWithPorts(
        **DeviceResponse.model_validate(device).model_dump(),
        open_ports=latest_scan.open_ports if latest_scan else None,
    )


@router.patch("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: UUID,
    data: DeviceUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)

    await db.commit()
    await db.refresh(device)
    return device


@router.delete("/{device_id}")
async def delete_device(device_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await db.delete(device)
    await db.commit()
    return {"status": "deleted"}
