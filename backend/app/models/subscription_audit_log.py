from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class AuditAction(StrEnum):
    ENROLLED = "enrolled"
    CANCELLED = "cancelled"
    NOTIFIED = "notified"
    CONFIRMED_ATTENDED = "confirmed_attended"
    CONFIRMED_ABSENT = "confirmed_absent"
    EXTENDED = "extended"
    EXPIRED = "expired"
    EXHAUSTED = "exhausted"


class SubscriptionAuditLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "subscription_audit_logs"

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    subscription_id: Mapped[str] = mapped_column(ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    enrollment_id: Mapped[str | None] = mapped_column(ForeignKey("enrollments.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction, name="audit_action", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    classes_before: Mapped[int] = mapped_column(Integer, nullable=False)
    classes_after: Mapped[int] = mapped_column(Integer, nullable=False)
    extensions_before: Mapped[int] = mapped_column(Integer, nullable=False)
    extensions_after: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    subscription = relationship("Subscription", back_populates="audit_logs")
