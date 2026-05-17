from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class BookingStatus(StrEnum):
    CONFIRMED = "confirmed"
    ABSENCE_PENDING = "absence_pending"   # request filed, spot freed
    ABSENT = "absent"                      # trainer approved absence
    NO_SPOT_AFTER_REJECTION = "no_spot_after_rejection"  # trainer rejected, spot gone
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
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