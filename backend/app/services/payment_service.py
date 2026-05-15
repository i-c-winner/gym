from datetime import UTC, datetime

from dateutil.relativedelta import relativedelta
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import verify_webhook_signature
from app.models.access_grant import AccessGrant
from app.models.order import Order, OrderStatus
from app.models.payment_event import PaymentEvent, PaymentEventStatus
from app.models.plan import PlanDuration


class PaymentService:
    def verify_signature(self, raw_body: bytes, signature: str | None) -> None:
        if not verify_webhook_signature(raw_body, signature):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    async def save_event(
        self,
        db: AsyncSession,
        provider: str,
        event_id: str,
        event_type: str,
        order_id: str,
        payload: dict,
        signature: str | None,
    ) -> PaymentEvent:
        event = PaymentEvent(
            provider=provider,
            provider_event_id=event_id,
            event_type=event_type,
            order_id=order_id,
            payload=payload,
            signature=signature,
            status=PaymentEventStatus.RECEIVED,
        )
        db.add(event)
        try:
            await db.flush()
        except IntegrityError:
            await db.rollback()
            existing = await db.scalar(
                select(PaymentEvent).where(
                    PaymentEvent.provider == provider,
                    PaymentEvent.provider_event_id == event_id,
                )
            )
            if existing:
                return existing
            raise
        return event

    async def mark_order_paid_and_grant_access(self, db: AsyncSession, order: Order) -> AccessGrant | object:
        from app.models.plan import PlanType
        from app.models.subscription import Subscription
        from app.services.subscription_service import subscription_service

        plan = order.plan

        if order.status == OrderStatus.PAID:
            if plan.plan_type == PlanType.ATTENDANCE:
                existing = await db.scalar(select(Subscription).where(Subscription.order_id == order.id))
            else:
                existing = await db.scalar(select(AccessGrant).where(AccessGrant.order_id == order.id))
            if existing:
                return existing

        order.status = OrderStatus.PAID

        if plan.plan_type == PlanType.ATTENDANCE:
            return await subscription_service.create_from_order(db, order, plan)

        starts_at = datetime.now(UTC)
        is_lifetime = plan.duration_type == PlanDuration.LIFETIME
        expires_at = None if is_lifetime else starts_at + relativedelta(months=plan.duration_months or 0)
        access = AccessGrant(
            user_id=order.user_id,
            resource_id=order.resource_id,
            order_id=order.id,
            grant_type=plan.duration_type.value,
            starts_at=starts_at,
            expires_at=expires_at,
            is_lifetime=is_lifetime,
        )
        db.add(access)
        await db.flush()
        return access

    async def process_webhook(
        self,
        db: AsyncSession,
        provider: str,
        event_id: str,
        event_type: str,
        order_id: str,
        payload: dict,
        signature: str | None,
    ) -> PaymentEvent:
        event = await self.save_event(db, provider, event_id, event_type, order_id, payload, signature)
        if event.status == PaymentEventStatus.PROCESSED:
            return event

        order = await db.scalar(
            select(Order).options(selectinload(Order.plan)).where(Order.id == order_id)
        )
        if not order:
            event.status = PaymentEventStatus.FAILED
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        if event_type == "payment.succeeded":
            await self.mark_order_paid_and_grant_access(db, order)
            event.status = PaymentEventStatus.PROCESSED
        else:
            event.status = PaymentEventStatus.IGNORED
        await db.flush()
        return event


payment_service = PaymentService()
