import json

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.schemas.payment import PaymentWebhookResponse
from app.services.payment_service import payment_service
from app.tasks.jobs import process_payment_webhook_task

router = APIRouter()


@router.post("/webhook", response_model=PaymentWebhookResponse)
async def payment_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    signature: str | None = Header(default=None, alias=settings.webhook_signature_header),
) -> PaymentWebhookResponse:
    raw_body = await request.body()
    payment_service.verify_signature(raw_body, signature)
    payload = json.loads(raw_body.decode("utf-8"))
    event = await payment_service.process_webhook(
        db=db,
        provider=payload["provider"],
        event_id=payload["event_id"],
        event_type=payload["event_type"],
        order_id=payload["order_id"],
        payload=payload,
        signature=signature,
    )
    await db.commit()
    process_payment_webhook_task.delay(event.id)
    return PaymentWebhookResponse(accepted=True, status=event.status.value)
