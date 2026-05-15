from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class TrainingEventStatus(StrEnum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TrainingEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "training_events"

    trainer_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    resource_id: Mapped[str | None] = mapped_column(ForeignKey("resources.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_participants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[TrainingEventStatus] = mapped_column(
        Enum(TrainingEventStatus, name="training_event_status", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TrainingEventStatus.SCHEDULED,
        server_default=TrainingEventStatus.SCHEDULED.value,
    )

    trainer = relationship("User", foreign_keys=[trainer_id])
    resource = relationship("Resource", foreign_keys=[resource_id])
    enrollments = relationship("Enrollment", back_populates="event", cascade="all, delete-orphan")
