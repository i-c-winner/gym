from datetime import UTC, datetime

from dateutil.relativedelta import relativedelta
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.plan import Plan, PlanDuration
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.subscription_audit_log import AuditAction, SubscriptionAuditLog


class SubscriptionService:
    async def create_from_order(self, db: AsyncSession, order: Order, plan: Plan) -> Subscription:
        now = datetime.now(UTC)
        expires_at = (
            None
            if plan.duration_type == PlanDuration.LIFETIME
            else now + relativedelta(months=plan.duration_months or 0)
        )
        sub = Subscription(
            user_id=order.user_id,
            order_id=order.id,
            resource_id=order.resource_id,
            classes_total=plan.class_count,
            classes_remaining=plan.class_count,
            max_extensions=plan.max_extensions,
            extensions_used=0,
            starts_at=now,
            expires_at=expires_at,
            status=SubscriptionStatus.ACTIVE,
        )
        db.add(sub)
        await db.flush()
        return sub

    def sync_status(self, sub: Subscription) -> None:
        if sub.status == SubscriptionStatus.CANCELLED:
            return
        now = datetime.now(UTC)
        if sub.expires_at and sub.expires_at < now:
            sub.status = SubscriptionStatus.EXPIRED
        elif sub.classes_remaining <= 0:
            sub.status = SubscriptionStatus.EXHAUSTED
        else:
            sub.status = SubscriptionStatus.ACTIVE

    async def user_has_active(self, db: AsyncSession, user_id: str, resource_id: str) -> bool:
        return await self.get_active_for_resource(db, user_id, resource_id) is not None

    async def get_active_for_resource(self, db: AsyncSession, user_id: str, resource_id: str) -> Subscription | None:
        now = datetime.now(UTC)
        return await db.scalar(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.resource_id == resource_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.starts_at <= now,
                or_(Subscription.expires_at.is_(None), Subscription.expires_at > now),
                Subscription.classes_remaining > 0,
            )
        )

    async def get_user_subscriptions(self, db: AsyncSession, user_id: str) -> list[Subscription]:
        result = await db.scalars(
            select(Subscription).where(Subscription.user_id == user_id).order_by(Subscription.created_at.desc())
        )
        return list(result.all())

    def write_log(
        self,
        db: AsyncSession,
        *,
        subscription: Subscription,
        actor_id: str | None,
        enrollment_id: str | None,
        action: AuditAction,
        classes_before: int,
        extensions_before: int,
        note: str | None = None,
    ) -> None:
        db.add(
            SubscriptionAuditLog(
                subscription_id=subscription.id,
                actor_id=actor_id,
                enrollment_id=enrollment_id,
                action=action,
                classes_before=classes_before,
                classes_after=subscription.classes_remaining,
                extensions_before=extensions_before,
                extensions_after=subscription.extensions_used,
                note=note,
            )
        )

    def deduct_class(self, db: AsyncSession, sub: Subscription, actor_id: str, enrollment_id: str) -> None:
        classes_before = sub.classes_remaining
        ext_before = sub.extensions_used
        sub.classes_remaining -= 1
        self.sync_status(sub)
        self.write_log(
            db,
            subscription=sub,
            actor_id=actor_id,
            enrollment_id=enrollment_id,
            action=AuditAction.ENROLLED,
            classes_before=classes_before,
            extensions_before=ext_before,
        )

    def return_class(
        self,
        db: AsyncSession,
        sub: Subscription,
        actor_id: str,
        enrollment_id: str,
        action: AuditAction = AuditAction.CANCELLED,
    ) -> None:
        classes_before = sub.classes_remaining
        ext_before = sub.extensions_used
        sub.classes_remaining += 1
        self.sync_status(sub)
        self.write_log(
            db,
            subscription=sub,
            actor_id=actor_id,
            enrollment_id=enrollment_id,
            action=action,
            classes_before=classes_before,
            extensions_before=ext_before,
        )

    def try_extend(self, db: AsyncSession, sub: Subscription, enrollment: Enrollment, actor_id: str) -> bool:
        if sub.extensions_used >= sub.max_extensions:
            return False
        classes_before = sub.classes_remaining
        ext_before = sub.extensions_used
        sub.classes_remaining += 1
        sub.extensions_used += 1
        enrollment.extended = True
        self.sync_status(sub)
        self.write_log(
            db,
            subscription=sub,
            actor_id=actor_id,
            enrollment_id=enrollment.id,
            action=AuditAction.EXTENDED,
            classes_before=classes_before,
            extensions_before=ext_before,
        )
        return True


subscription_service = SubscriptionService()
