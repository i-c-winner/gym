from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class AbsenceRequestStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    AUTO_APPROVED = "auto_approved"
    AUTO_REJECTED = "auto_rejected"


class AbsenceRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "absence_requests"

    booking_id: Mapped[str] = mapped_column(
        ForeignKey("bookings.id", ondelete="RESTRICT"), nullable=False, index=True, unique=True
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    trainer_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[AbsenceRequestStatus] = mapped_column(
        Enum(AbsenceRequestStatus, name="absence_request_status", values_callable=lambda x: [e.value for e in x]),
        default=AbsenceRequestStatus.PENDING,
        nullable=False,
        index=True,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    booking = relationship("Booking", back_populates="absence_requests")
    user = relationship("User", foreign_keys=[user_id])
    trainer = relationship("User", foreign_keys=[trainer_id])