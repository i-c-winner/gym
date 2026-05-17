from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class SubscriptionPeriod(StrEnum):
    CURRENT_MONTH_REST = "current_month_rest"
    NEXT_MONTH = "next_month"
    NEXT_3_MONTHS = "next_3_months"
    NEXT_6_MONTHS = "next_6_months"


class SubscriptionStatus(StrEnum):
    PENDING_PAYMENT = "pending_payment"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Subscription(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        UniqueConstraint("user_id", "class_type_id", "period_start", name="uq_subscription_user_type_start"),
    )

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    class_type_id: Mapped[str] = mapped_column(
        ForeignKey("class_types.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    period_type: Mapped[SubscriptionPeriod] = mapped_column(
        Enum(SubscriptionPeriod, name="subscription_period", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    days_count: Mapped[int] = mapped_column(nullable=False)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="RUB", nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, name="subscription_status", values_callable=lambda x: [e.value for e in x]),
        default=SubscriptionStatus.PENDING_PAYMENT,
        nullable=False,
        index=True,
    )
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User")
    class_type = relationship("ClassType", back_populates="subscriptions")
    bookings = relationship("Booking", back_populates="subscription")
    payments = relationship("SubscriptionPayment", back_populates="subscription")
    applied_credits = relationship("DiscountCredit", back_populates="applied_to_subscription")