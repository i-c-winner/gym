import asyncio
import json

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import csrf_protect, get_current_user
from app.core.config import settings
from app.db.session import AsyncSessionLocal, get_db
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.payment import PaymentWebhookResponse
from app.services.payment_service import payment_service
from app.tasks.jobs import process_payment_webhook_task

router = APIRouter()


class SimulatePaymentRequest(BaseModel):
    order_id: str
    provider: str  # "click" | "payme"


async def _delayed_grant(order_id: str) -> None:
    await asyncio.sleep(5)
    async with AsyncSessionLocal() as db:
        order = await db.get(Order, order_id)
        if order and order.status == OrderStatus.PENDING:
            await payment_service.mark_order_paid_and_grant_access(db, order)
            await db.commit()


@router.post("/simulate", dependencies=[Depends(csrf_protect)])
async def simulate_payment(
    payload: SimulatePaymentRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    order = await db.get(Order, payload.order_id)
    if not order or order.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order already processed")
    background_tasks.add_task(_delayed_grant, payload.order_id)
    return {"accepted": True, "provider": payload.provider}


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
