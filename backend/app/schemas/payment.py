from typing import Any

from pydantic import BaseModel


class PaymentWebhookRequest(BaseModel):
    provider: str
    event_id: str
    event_type: str
    order_id: str
    provider_order_id: str | None = None
    metadata: dict[str, Any] = {}


class PaymentWebhookResponse(BaseModel):
    accepted: bool
    status: str
