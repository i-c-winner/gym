from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking, BookingStatus
from app.models.class_schedule import ClassSchedule
from app.models.class_session import ClassSession, ClassSessionStatus
from app.models.class_type import ClassType
from app.models.discount_credit import DiscountCredit
from app.models.subscription import Subscription, SubscriptionPeriod, SubscriptionStatus
from app.models.subscription_payment import PaymentStatus, SubscriptionPayment
from app.models.user import User
from app.services.audit_log_service import audit_log_service
from app.services.pricing_service import calculate_subscription_price


class SubscriptionService:
    async def _get_pending_credits(
        self, db: AsyncSession, user_id: str, class_type_id: str
    ) -> tuple[Decimal, list[DiscountCredit]]:
        result = await db.execute(
            select(DiscountCredit).where(
                DiscountCredit.user_id == user_id,
                DiscountCredit.class_type_id == class_type_id,
                DiscountCredit.is_used == False,  # noqa: E712
            )
        )
        credits = list(result.scalars().all())
        total = sum(c.amount for c in credits)
        return total, credits

    async def preview(
        self,
        db: AsyncSession,
        user: User,
        class_type_id: str,
        period_type: SubscriptionPeriod,
    ) -> dict:
        ct = await db.get(ClassType, class_type_id)
        if not ct or not ct.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ClassType not found")
        schedules = await db.execute(
            select(ClassSchedule).where(ClassSchedule.class_type_id == class_type_id)
        )
        scheduled_days = {s.day_of_week for s in schedules.scalars()}
        pending_credits, _ = await self._get_pending_credits(db, user.id, class_type_id)
        today = datetime.now(UTC).date()
        start, end, days, gross, discount, total = calculate_subscription_price(
            ct.base_rate_per_day, scheduled_days, period_type, today, pending_credits
        )
        # Count available spots for the requested period
        taken = await self._count_subscriptions_in_period(db, class_type_id, start, end, exclude_user_id=None)
        return {
            "class_type_id": class_type_id,
            "period_type": period_type,
            "period_start": start,
            "period_end": end,
            "days_count": days,
            "gross_amount": gross,
            "discount_amount": discount,
            "total_amount": total,
            "currency": "RUB",
            "available_spots": max(0, ct.max_participants - taken),
        }

    async def _count_subscriptions_in_period(
        self,
        db: AsyncSession,
        class_type_id: str,
        start,
        end,
        exclude_user_id: str | None,
    ) -> int:
        """Count active/pending subscriptions for this class_type overlapping [start, end]."""
        q = select(func.count()).select_from(Subscription).where(
            Subscription.class_type_id == class_type_id,
            Subscription.status.in_([SubscriptionStatus.PENDING_PAYMENT, SubscriptionStatus.ACTIVE]),
            Subscription.period_end >= start,
            Subscription.period_start <= end,
        )
        if exclude_user_id:
            q = q.where(Subscription.user_id != exclude_user_id)
        return await db.scalar(q) or 0

    async def create(
        self,
        db: AsyncSession,
        user: User,
        class_type_id: str,
        period_type: SubscriptionPeriod,
        provider: str,
        provider_txn_id: str,
    ) -> Subscription:
        ct = await db.get(ClassType, class_type_id)
        if not ct or not ct.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ClassType not found")

        # Idempotency: return existing subscription if same txn_id
        existing_payment = await db.scalar(
            select(SubscriptionPayment).where(SubscriptionPayment.provider_txn_id == provider_txn_id)
        )
        if existing_payment:
            sub = await db.get(Subscription, existing_payment.subscription_id)
            if sub:
                return sub

        schedules = await db.execute(
            select(ClassSchedule).where(ClassSchedule.class_type_id == class_type_id)
        )
        scheduled_days = {s.day_of_week for s in schedules.scalars()}
        pending_credits, _ = await self._get_pending_credits(db, user.id, class_type_id)
        today = datetime.now(UTC).date()
        start, end, days, gross, discount, total = calculate_subscription_price(
            ct.base_rate_per_day, scheduled_days, period_type, today, pending_credits
        )

        # Check user doesn't already have a subscription for an overlapping period
        own_overlap = await self._count_subscriptions_in_period(db, class_type_id, start, end, exclude_user_id=None)
        own_overlap_self = await db.scalar(
            select(func.count()).select_from(Subscription).where(
                Subscription.user_id == user.id,
                Subscription.class_type_id == class_type_id,
                Subscription.status.in_([SubscriptionStatus.PENDING_PAYMENT, SubscriptionStatus.ACTIVE]),
                Subscription.period_end >= start,
                Subscription.period_start <= end,
            )
        )
        if own_overlap_self:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already have a subscription for this class type and period",
            )

        # Capacity check: subscription takes a spot for the whole period
        others_count = await self._count_subscriptions_in_period(
            db, class_type_id, start, end, exclude_user_id=user.id
        )
        if others_count >= ct.max_participants:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No spots available for this class type in the requested period",
            )

        sub = Subscription(
            user_id=user.id,
            class_type_id=class_type_id,
            period_type=period_type,
            period_start=start,
            period_end=end,
            days_count=days,
            gross_amount=gross,
            discount_amount=discount,
            total_amount=total,
            currency="RUB",
            status=SubscriptionStatus.PENDING_PAYMENT,
        )
        db.add(sub)
        await db.flush()

        payment = SubscriptionPayment(
            subscription_id=sub.id,
            provider=provider,
            provider_txn_id=provider_txn_id,
            amount=total,
            currency="RUB",
            status=PaymentStatus.PENDING,
        )
        db.add(payment)
        await db.flush()

        await audit_log_service.log(
            db,
            actor_id=user.id,
            actor_role="user",
            action="create_subscription",
            entity_type="subscription",
            entity_id=sub.id,
            new_value={
                "class_type_id": class_type_id,
                "period_type": period_type,
                "total_amount": str(total),
                "discount_amount": str(discount),
            },
        )
        return sub

    async def activate(
        self, db: AsyncSession, provider_txn_id: str, subscription_id: str
    ) -> Subscription:
        payment = await db.scalar(
            select(SubscriptionPayment).where(SubscriptionPayment.provider_txn_id == provider_txn_id)
        )
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        if payment.subscription_id != subscription_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment/subscription mismatch")

        sub = await db.get(Subscription, subscription_id)
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

        # Idempotent: already activated
        if sub.status == SubscriptionStatus.ACTIVE:
            return sub
        if payment.status == PaymentStatus.SUCCEEDED:
            return sub

        payment.status = PaymentStatus.SUCCEEDED
        sub.status = SubscriptionStatus.ACTIVE
        sub.activated_at = datetime.now(UTC)

        # Apply pending credits as used
        credits_result = await db.execute(
            select(DiscountCredit).where(
                DiscountCredit.user_id == sub.user_id,
                DiscountCredit.class_type_id == sub.class_type_id,
                DiscountCredit.is_used == False,  # noqa: E712
            )
        )
        credits = list(credits_result.scalars())
        remaining = sub.discount_amount
        for credit in credits:
            if remaining <= 0:
                break
            credit.is_used = True
            credit.used_at = datetime.now(UTC)
            credit.applied_to_subscription_id = sub.id
            remaining -= credit.amount

        # Auto-book all existing sessions within the subscription period
        await self._auto_book_sessions(db, sub)

        await audit_log_service.log(
            db,
            actor_id=None,
            actor_role="system",
            action="activate_subscription",
            entity_type="subscription",
            entity_id=sub.id,
            new_value={"status": "active", "provider_txn_id": provider_txn_id},
        )
        return sub

    async def _auto_book_sessions(self, db: AsyncSession, sub: Subscription) -> int:
        """Create CONFIRMED bookings for all ClassSessions within the subscription period."""
        period_start_dt = datetime(
            sub.period_start.year, sub.period_start.month, sub.period_start.day, tzinfo=UTC
        )
        period_end_dt = datetime(
            sub.period_end.year, sub.period_end.month, sub.period_end.day, 23, 59, 59, tzinfo=UTC
        )
        sessions_result = await db.execute(
            select(ClassSession).where(
                ClassSession.class_type_id == sub.class_type_id,
                ClassSession.scheduled_at >= period_start_dt,
                ClassSession.scheduled_at <= period_end_dt,
                ClassSession.status == ClassSessionStatus.SCHEDULED,
            )
        )
        created = 0
        for sess in sessions_result.scalars():
            existing = await db.scalar(
                select(Booking).where(
                    Booking.user_id == sub.user_id,
                    Booking.class_session_id == sess.id,
                )
            )
            if not existing:
                db.add(Booking(
                    user_id=sub.user_id,
                    class_session_id=sess.id,
                    subscription_id=sub.id,
                    status=BookingStatus.CONFIRMED,
                ))
                created += 1
        return created

    async def list_user_subscriptions(self, db: AsyncSession, user_id: str) -> list[Subscription]:
        result = await db.execute(
            select(Subscription).where(Subscription.user_id == user_id).order_by(Subscription.period_start.desc())
        )
        return list(result.scalars())


subscription_service = SubscriptionService()