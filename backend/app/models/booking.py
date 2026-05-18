from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class BookingStatus(StrEnum):
    CONFIRMED = "confirmed"
    ABSENT = "absent"      # trainer confirmed: user warned + was absent → missed day counted
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"    # no warning, did not attend
    ATTENDED = "attended"


class Booking(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("user_id", "class_session_id", name="uq_booking_user_session"),
    )

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    class_session_id: Mapped[str] = mapped_column(
        ForeignKey("class_sessions.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    subscription_id: Mapped[str] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status", values_callable=lambda x: [e.value for e in x]),
        default=BookingStatus.CONFIRMED,
        nullable=False,
        index=True,
    )

    user = relationship("User")
    class_session = relationship("ClassSession", back_populates="bookings")
    subscription = relationship("Subscription", back_populates="bookings")
    absence_requests = relationship("AbsenceRequest", back_populates="booking")