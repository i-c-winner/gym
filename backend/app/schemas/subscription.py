from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.subscription import SubscriptionPeriod, SubscriptionStatus


class SubscriptionPreviewIn(BaseModel):
    class_type_id: str
    period_type: SubscriptionPeriod


class SubscriptionPreviewOut(BaseModel):
    class_type_id: str
    period_type: SubscriptionPeriod
    period_start: date
    period_end: date
    days_count: int
    gross_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    available_spots: int


class SubscriptionCreateIn(BaseModel):
    class_type_id: str
    period_type: SubscriptionPeriod
    provider: str = "mock"
    provider_txn_id: str


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    class_type_id: str
    period_type: SubscriptionPeriod
    period_start: date
    period_end: date
    days_count: int
    gross_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    status: SubscriptionStatus
    activated_at: datetime | None


class PaymentWebhookIn(BaseModel):
    provider_txn_id: str
    subscription_id: str
    status: str  # "succeeded" | "failed"