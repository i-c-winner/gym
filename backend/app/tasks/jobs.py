import asyncio
from datetime import UTC, datetime

from sqlalchemy import delete, select, update

from app.db.session import AsyncSessionLocal
from app.models.payment_event import PaymentEvent
from app.models.session import Session
from app.tasks.celery_app import celery_app


@celery_app.task
def send_registration_email_task(email: str) -> None:
    return None


@celery_app.task
def send_payment_email_task(email: str, order_id: str) -> None:
    return None


async def _cleanup_expired_sessions() -> int:
    now = datetime.now(UTC)
    async with AsyncSessionLocal() as db:
        result = await db.execute(delete(Session).where(Session.refresh_expires_at < now))
        await db.commit()
        return result.rowcount or 0


@celery_app.task
def cleanup_expired_sessions_task() -> int:
    return asyncio.run(_cleanup_expired_sessions())


async def _process_payment_webhook(event_id: str) -> None:
    async with AsyncSessionLocal() as db:
        await db.scalar(select(PaymentEvent).where(PaymentEvent.id == event_id))


@celery_app.task
def process_payment_webhook_task(event_id: str) -> None:
    asyncio.run(_process_payment_webhook(event_id))


# ─── Gym class background tasks ──────────────────────────────────────────────

async def _materialize_sessions() -> int:
    from app.services.class_session_service import class_session_service
    async with AsyncSessionLocal() as db:
        created = await class_session_service.materialize(db)
        await db.commit()
        return created


@celery_app.task
def materialize_sessions_task() -> int:
    """Generate ClassSessions from schedules up to the horizon window."""
    return asyncio.run(_materialize_sessions())


async def _expire_subscriptions() -> int:
    from app.models.subscription import Subscription, SubscriptionStatus
    now = datetime.now(UTC).date()
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            update(Subscription)
            .where(
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.period_end < now,
            )
            .values(status=SubscriptionStatus.EXPIRED)
            .returning(Subscription.id)
        )
        count = len(result.fetchall())
        await db.commit()
        return count


@celery_app.task
def expire_subscriptions_task() -> int:
    """Move expired active subscriptions to EXPIRED status."""
    return asyncio.run(_expire_subscriptions())


async def _close_completed_sessions() -> int:
    """Mark sessions whose end time has passed as COMPLETED and default bookings."""
    from app.models.booking import Booking, BookingStatus
    from app.models.class_session import ClassSession, ClassSessionStatus

    now = datetime.now(UTC)
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ClassSession).where(
                ClassSession.status == ClassSessionStatus.SCHEDULED,
                ClassSession.ends_at <= now,
            )
        )
        sessions = result.scalars().all()
        count = 0
        for sess in sessions:
            sess.status = ClassSessionStatus.COMPLETED
            count += 1
            # CONFIRMED without a pending absence warning → NO_SHOW
            # (Bookings with pending warnings are resolved by timeout_absence_requests_task)
            from app.models.absence_request import AbsenceRequest, AbsenceRequestStatus
            from sqlalchemy import not_, exists
            bookings_result = await db.execute(
                select(Booking).where(
                    Booking.class_session_id == sess.id,
                    Booking.status == BookingStatus.CONFIRMED,
                    not_(
                        exists().where(
                            AbsenceRequest.booking_id == Booking.id,
                            AbsenceRequest.status == AbsenceRequestStatus.PENDING,
                        )
                    ),
                )
            )
            for booking in bookings_result.scalars():
                booking.status = BookingStatus.NO_SHOW
        await db.commit()
        return count


@celery_app.task
def close_completed_sessions_task() -> int:
    """Complete past sessions and default attendance to NO_SHOW."""
    return asyncio.run(_close_completed_sessions())


async def _timeout_absence_requests() -> int:
    """Auto-resolve pending absence requests after session has ended."""
    from app.core.config import settings
    from app.models.absence_request import AbsenceRequest, AbsenceRequestStatus
    from app.models.booking import Booking, BookingStatus
    from app.models.class_session import ClassSession

    now = datetime.now(UTC)
    async with AsyncSessionLocal() as db:
        # Only process requests where session has already ended (trainer had time to confirm)
        result = await db.execute(
            select(AbsenceRequest)
            .join(Booking, Booking.id == AbsenceRequest.booking_id)
            .join(ClassSession, ClassSession.id == Booking.class_session_id)
            .where(
                AbsenceRequest.status == AbsenceRequestStatus.PENDING,
                ClassSession.ends_at <= now,
            )
        )
        reqs = result.scalars().all()
        count = 0
        policy = settings.absence_timeout_policy
        for req in reqs:
            booking = await db.get(Booking, req.booking_id)
            req.decided_at = now
            if policy == "auto_approve":
                req.status = AbsenceRequestStatus.CONFIRMED
                if booking and booking.status == BookingStatus.CONFIRMED:
                    booking.status = BookingStatus.ABSENT
            else:
                req.status = AbsenceRequestStatus.REJECTED
                if booking and booking.status == BookingStatus.CONFIRMED:
                    booking.status = BookingStatus.NO_SHOW
            count += 1
        await db.commit()
        return count


@celery_app.task
def timeout_absence_requests_task() -> int:
    """Auto-approve or auto-reject pending absence requests past session start."""
    return asyncio.run(_timeout_absence_requests())


# ─── Beat schedule ────────────────────────────────────────────────────────────

celery_app.conf.beat_schedule = {
    "materialize-sessions-daily": {
        "task": "app.tasks.jobs.materialize_sessions_task",
        "schedule": 60 * 60 * 24,  # every 24 hours
    },
    "expire-subscriptions-hourly": {
        "task": "app.tasks.jobs.expire_subscriptions_task",
        "schedule": 60 * 60,
    },
    "close-sessions-every-15min": {
        "task": "app.tasks.jobs.close_completed_sessions_task",
        "schedule": 60 * 15,
    },
    "timeout-absence-requests-every-15min": {
        "task": "app.tasks.jobs.timeout_absence_requests_task",
        "schedule": 60 * 15,
    },
    "cleanup-expired-sessions-daily": {
        "task": "app.tasks.jobs.cleanup_expired_sessions_task",
        "schedule": 60 * 60 * 24,
    },
}