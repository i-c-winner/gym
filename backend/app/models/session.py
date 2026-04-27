from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Session(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "sessions"
    __table_args__ = (UniqueConstraint("refresh_token_hash", name="uq_sessions_refresh_token_hash"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    refresh_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    csrf_token: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="sessions")
