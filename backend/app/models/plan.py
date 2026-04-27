from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class PlanDuration(StrEnum):
    MONTH_1 = "1m"
    MONTH_3 = "3m"
    MONTH_6 = "6m"
    LIFETIME = "lifetime"


class Plan(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "plans"
    __table_args__ = (UniqueConstraint("resource_id", "code", name="uq_plans_resource_code"),)

    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    duration_type: Mapped[PlanDuration] = mapped_column(Enum(PlanDuration, name="plan_duration"), nullable=False)
    duration_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    resource = relationship("Resource", back_populates="plans")
    orders = relationship("Order", back_populates="plan")
