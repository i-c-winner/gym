from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import csrf_protect, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.order import OrderCreateRequest, OrderRead
from app.services.order_service import order_service

router = APIRouter()


@router.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(csrf_protect)])
async def create_order(
    payload: OrderCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    order = await order_service.create_order(db, user.id, payload.resource_id, payload.plan_id, payload.provider)
    await db.commit()
    return OrderRead.model_validate(order)
