from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class PaymentEventStatus(StrEnum):
    RECEIVED = "received"
    PROCESSED = "processed"
    IGNORED = "ignored"
    FAILED = "failed"


class PaymentEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payment_events"
    __table_args__ = (UniqueConstraint("provider", "provider_event_id", name="uq_payment_events_provider_event"),)

    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    provider_event_id: Mapped[str] = mapped_column(String(128), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    order_id: Mapped[str | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[PaymentEventStatus] = mapped_column(
        Enum(PaymentEventStatus, name="payment_event_status"),
        default=PaymentEventStatus.RECEIVED,
        nullable=False,
    )
    signature: Mapped[str | None] = mapped_column(String(255), nullable=True)

    order = relationship("Order", back_populates="payment_events")
