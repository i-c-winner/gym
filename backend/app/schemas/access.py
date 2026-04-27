from datetime import datetime

from pydantic import BaseModel


class AccessGrantRead(BaseModel):
    id: str
    resource_id: str
    order_id: str | None
    grant_type: str
    starts_at: datetime
    expires_at: datetime | None
    is_lifetime: bool

    model_config = {"from_attributes": True}
