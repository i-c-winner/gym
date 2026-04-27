from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Resource(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "resources"

    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    plans = relationship("Plan", back_populates="resource", cascade="all, delete-orphan")
    accesses = relationship("AccessGrant", back_populates="resource", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="resource")
