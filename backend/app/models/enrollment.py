from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class EnrollmentStatus(StrEnum):
    ENROLLED = "enrolled"
    NOTIFIED_ABSENT = "notified_absent"
    ATTENDED = "attended"
    ABSENT_EXTENDED = "absent_extended"
    MISSED = "missed"
    CANCELLED = "cancelled"


class Enrollment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "event_id", name="uq_enrollments_user_event"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("training_events.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id: Mapped[str] = mapped_column(ForeignKey("subscriptions.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[EnrollmentStatus] = mapped_column(
        Enum(EnrollmentStatus, name="enrollment_status", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=EnrollmentStatus.ENROLLED,
        server_default=EnrollmentStatus.ENROLLED.value,
    )
    notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    extended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    user = relationship("User", foreign_keys=[user_id])
    event = relationship("TrainingEvent", back_populates="enrollments")
    subscription = relationship("Subscription", back_populates="enrollments")
