from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.absence_request import AbsenceRequestStatus


class AbsenceRequestCreateIn(BaseModel):
    booking_id: str
    note: str | None = None


class AbsenceDecisionIn(BaseModel):
    approved: bool


class AbsenceRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    booking_id: str
    user_id: str
    trainer_id: str
    status: AbsenceRequestStatus
    note: str | None
    decided_at: datetime | None