from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.plan import Plan
from app.schemas.plan import PlanRead

router = APIRouter()


@router.get("/plans", response_model=list[PlanRead])
async def list_plans(db: AsyncSession = Depends(get_db)) -> list[PlanRead]:
    plans = (await db.scalars(select(Plan).where(Plan.is_active.is_(True)))).all()
    return [PlanRead.model_validate(plan) for plan in plans]
