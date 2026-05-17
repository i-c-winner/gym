from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class DiscountCredit(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "discount_credits"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    class_type_id: Mapped[str] = mapped_column(
        ForeignKey("class_types.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    # Source: the absence_request that generated this credit
    source_absence_request_id: Mapped[str] = mapped_column(
        ForeignKey("absence_requests.id", ondelete="RESTRICT"), nullable=False, index=True, unique=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_used: Mapped[bool] = mapped_column(default=False, nullable=False, index=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Subscription this credit was applied to
    applied_to_subscription_id: Mapped[str | None] = mapped_column(
        ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True
    )

    user = relationship("User")
    class_type = relationship("ClassType")
    source_absence_request = relationship("AbsenceRequest")
    applied_to_subscription = relationship("Subscription", back_populates="applied_credits")