from fastapi import APIRouter, Depends
from sqlalchemy import nullslast, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.plan import Plan
from app.models.resource import Resource
from app.schemas.plan import PlanRead

router = APIRouter()


@router.get("/plans", response_model=list[PlanRead])
async def list_plans(
    resource_slug: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[PlanRead]:
    query = (
        select(Plan)
        .where(Plan.is_active.is_(True))
        .order_by(nullslast(Plan.duration_months.asc()))
    )
    if resource_slug:
        query = query.join(Resource, Plan.resource_id == Resource.id).where(Resource.slug == resource_slug)
    plans = (await db.scalars(query)).all()
    return [PlanRead.model_validate(plan) for plan in plans]
