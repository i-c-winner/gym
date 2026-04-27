from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class OrderStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    CANCELED = "canceled"


class Order(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (UniqueConstraint("provider_order_id", name="uq_orders_provider_order_id"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="RESTRICT"), nullable=False, index=True)
    plan_id: Mapped[str] = mapped_column(ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus, name="order_status"), default=OrderStatus.PENDING, nullable=False)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    provider_order_id: Mapped[str | None] = mapped_column(String(128), nullable=True)

    user = relationship("User", back_populates="orders")
    resource = relationship("Resource", back_populates="orders")
    plan = relationship("Plan", back_populates="orders")
    payment_events = relationship("PaymentEvent", back_populates="order")
