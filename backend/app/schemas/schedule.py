from datetime import datetime

from pydantic import BaseModel, model_validator


class TrainingEventCreate(BaseModel):
    trainer_id: str
    resource_id: str | None = None
    title: str
    description: str | None = None
    start_at: datetime
    end_at: datetime
    max_participants: int | None = None

    @model_validator(mode="after")
    def validate_times(self) -> "TrainingEventCreate":
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self


class TrainingEventUpdate(BaseModel):
    trainer_id: str | None = None
    resource_id: str | None = None
    title: str | None = None
    description: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    max_participants: int | None = None


class TrainingEventRead(BaseModel):
    id: str
    trainer_id: str
    resource_id: str | None
    title: str
    description: str | None
    start_at: datetime
    end_at: datetime
    max_participants: int | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EnrollmentRead(BaseModel):
    id: str
    user_id: str
    event_id: str
    subscription_id: str
    status: str
    notified_at: datetime | None
    confirmed_at: datetime | None
    extended: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AttendanceItem(BaseModel):
    enrollment_id: str
    attended: bool


class AttendanceRequest(BaseModel):
    attendances: list[AttendanceItem]