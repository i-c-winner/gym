from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ClassType(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "class_types"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    trainer_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    max_participants: Mapped[int] = mapped_column(Integer, nullable=False)
    base_rate_per_day: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    trainer = relationship("User", foreign_keys=[trainer_id])
    schedules = relationship("ClassSchedule", back_populates="class_type", cascade="all, delete-orphan")
    sessions = relationship("ClassSession", back_populates="class_type")
    subscriptions = relationship("Subscription", back_populates="class_type")