from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class OrderCreateRequest(BaseModel):
    resource_id: str
    plan_id: str
    provider: str


class OrderRead(BaseModel):
    id: str
    status: str
    amount: Decimal
    currency: str
    provider: str
    provider_order_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
