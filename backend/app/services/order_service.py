from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderStatus
from app.models.plan import Plan
from app.models.resource import Resource


class OrderService:
    async def create_order(self, db: AsyncSession, user_id: str, resource_id: str, plan_id: str, provider: str) -> Order:
        resource = await db.get(Resource, resource_id)
        if not resource or not resource.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

        plan = await db.scalar(
            select(Plan).where(
                Plan.id == plan_id,
                Plan.resource_id == resource_id,
                Plan.is_active.is_(True),
            )
        )
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

        order = Order(
            user_id=user_id,
            resource_id=resource_id,
            plan_id=plan.id,
            amount=plan.price_amount,
            currency=plan.currency,
            provider=provider,
            status=OrderStatus.PENDING,
        )
        db.add(order)
        await db.flush()
        return order


order_service = OrderService()
