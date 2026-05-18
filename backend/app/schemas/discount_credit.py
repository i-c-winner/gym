from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DiscountCreditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    class_type_id: str
    amount: Decimal
    is_used: bool
    used_at: datetime | None
    applied_to_subscription_id: str | None


class UserRoleUpdateIn(BaseModel):
    role: str  # "admin" | "trainer" | "user"


class ReportFilter(BaseModel):
    class_type_id: str | None = None
    date_from: str | None = None
    date_to: str | None = None