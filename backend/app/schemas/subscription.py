from datetime import datetime

from pydantic import BaseModel


class SubscriptionRead(BaseModel):
    id: str
    user_id: str
    order_id: str
    resource_id: str
    classes_total: int
    classes_remaining: int
    max_extensions: int
    extensions_used: int
    starts_at: datetime
    expires_at: datetime | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}