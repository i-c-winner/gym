import asyncio
from datetime import UTC, datetime

from sqlalchemy import delete, select

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
