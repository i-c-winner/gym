from datetime import time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ScheduleSlotIn(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Mon…6=Sun")
    start_time: time


class ScheduleSlotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    day_of_week: int
    start_time: time


class ClassTypeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    trainer_id: str
    duration_minutes: int = Field(..., gt=0)
    max_participants: int = Field(..., gt=0)
    base_rate_per_day: Decimal = Field(..., gt=0)
    schedules: list[ScheduleSlotIn] = Field(default_factory=list)


class ClassTypeUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    trainer_id: str | None = None
    duration_minutes: int | None = Field(None, gt=0)
    max_participants: int | None = Field(None, gt=0)
    base_rate_per_day: Decimal | None = Field(None, gt=0)
    is_active: bool | None = None


class ClassTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str | None
    trainer_id: str
    duration_minutes: int
    max_participants: int
    base_rate_per_day: Decimal
    is_active: bool
    schedules: list[ScheduleSlotOut] = []