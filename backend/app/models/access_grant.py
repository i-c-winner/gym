from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class AccessGrant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "access_grants"
    __table_args__ = (
        UniqueConstraint("user_id", "resource_id", "order_id", name="uq_access_grants_order"),
    )

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id: Mapped[str | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    grant_type: Mapped[str] = mapped_column(String(32), nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_lifetime: Mapped[bool] = mapped_column(default=False, nullable=False)

    user = relationship("User", back_populates="accesses")
    resource = relationship("Resource", back_populates="accesses")
