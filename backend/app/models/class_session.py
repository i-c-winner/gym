from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ClassSessionStatus(StrEnum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ClassSession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Concrete instance of a class on a specific date/time. Stores snapshot fields."""

    __tablename__ = "class_sessions"
    __table_args__ = (
        UniqueConstraint("class_schedule_id", "scheduled_at", name="uq_class_session_schedule_time"),
    )

    class_type_id: Mapped[str] = mapped_column(
        ForeignKey("class_types.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    class_schedule_id: Mapped[str] = mapped_column(
        ForeignKey("class_schedules.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    trainer_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)
    max_participants_snapshot: Mapped[int] = mapped_column(Integer, nullable=False)
    base_rate_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[ClassSessionStatus] = mapped_column(
        Enum(ClassSessionStatus, name="class_session_status", values_callable=lambda x: [e.value for e in x]),
        default=ClassSessionStatus.SCHEDULED,
        nullable=False,
        index=True,
    )

    class_type = relationship("ClassType", back_populates="sessions")
    trainer = relationship("User", foreign_keys=[trainer_id])
    bookings = relationship("Booking", back_populates="class_session")