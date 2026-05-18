from pydantic import BaseModel, ConfigDict

from app.models.booking import BookingStatus


class BookingCreateIn(BaseModel):
    class_session_id: str
    subscription_id: str


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    class_session_id: str
    subscription_id: str
    status: BookingStatus


class BookingWithUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    class_session_id: str
    subscription_id: str
    status: BookingStatus
    user_first_name: str | None = None
    user_last_name: str | None = None
    user_telephone: str | None = None