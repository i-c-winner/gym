from decimal import Decimal

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class CurrencyRate(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Коэффициент конверсии для отображения сумм на фронтенде.

    Фронтенд умножает исходную сумму (в базовой валюте) на ``coefficient``
    и показывает результат с меткой ``currency``.

    Строка ищется по полю ``currency`` через CurrencyService.get_by_currency().
    Если строка не найдена, используется коэффициент по умолчанию (13500, UZS).
    """

    __tablename__ = "currency_rates"

    currency: Mapped[str] = mapped_column(
        String(8),
        unique=True,
        index=True,
        nullable=False,
        comment="Код валюты, например UZS, USD, RUB",
    )
    coefficient: Mapped[Decimal] = mapped_column(
        Numeric(18, 6),
        nullable=False,
        comment="Коэффициент перевода из базовой валюты в данную",
    )
    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
        comment="Только активные строки используются фронтендом",
    )
