from decimal import Decimal

from pydantic import BaseModel, model_validator


class PlanRead(BaseModel):
    id: str
    resource_id: str
    code: str
    title: str
    plan_type: str
    duration_type: str
    duration_months: int | None
    price_amount: Decimal
    currency: str
    class_count: int | None
    max_extensions: int | None

    model_config = {"from_attributes": True}


class PlanCreate(BaseModel):
    resource_id: str
    code: str
    title: str
    plan_type: str = "online"
    duration_type: str
    duration_months: int | None = None
    price_amount: Decimal
    currency: str = "USD"
    class_count: int | None = None
    max_extensions: int | None = None

    @model_validator(mode="after")
    def validate_attendance_fields(self) -> "PlanCreate":
        if self.plan_type == "attendance":
            if self.class_count is None:
                raise ValueError("attendance plan requires class_count")
            if self.max_extensions is None:
                raise ValueError("attendance plan requires max_extensions")
        return self
