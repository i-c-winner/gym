from decimal import Decimal

from pydantic import BaseModel


class PlanRead(BaseModel):
    id: str
    resource_id: str
    code: str
    title: str
    duration_type: str
    duration_months: int | None
    price_amount: Decimal
    currency: str

    model_config = {"from_attributes": True}
