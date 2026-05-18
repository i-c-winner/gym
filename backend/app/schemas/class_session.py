from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.class_session import ClassSessionStatus


class ClassSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    class_type_id: str
    trainer_id: str
    scheduled_at: datetime
    ends_at: datetime
    duration_minutes_snapshot: int
    max_participants_snapshot: int
    base_rate_snapshot: Decimal
    status: ClassSessionStatus
    available_spots: int | None = None  # computed on read


class AttendanceMarkIn(BaseModel):
    booking_id: str
    attended: bool