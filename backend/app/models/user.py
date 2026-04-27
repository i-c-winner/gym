from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    telephone: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    telegram_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(32), nullable=True)

    accesses = relationship("AccessGrant", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
