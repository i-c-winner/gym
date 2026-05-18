from datetime import time

from sqlalchemy import ForeignKey, Integer, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ClassSchedule(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One recurring weekly slot for a ClassType. day_of_week: 0=Mon…6=Sun."""

    __tablename__ = "class_schedules"
    __table_args__ = (
        UniqueConstraint("class_type_id", "day_of_week", name="uq_class_schedule_type_day"),
    )

    class_type_id: Mapped[str] = mapped_column(
        ForeignKey("class_types.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon … 6=Sun
    start_time: Mapped[time] = mapped_column(Time, nullable=False)

    class_type = relationship("ClassType", back_populates="schedules")