from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.currency_rate import CurrencyRate

# Значения по умолчанию — используются если в таблице нет нужной строки
DEFAULT_CURRENCY = "UZS"
DEFAULT_COEFFICIENT = Decimal("13500")


class CurrencyService:
    """Логический слой конверсии валют для фронтенда.

    Фронтенд вызывает get_by_currency() при каждом отображении суммы.
    Функция конверсии (умножение/деление/кастомная логика) будет определена позже —
    сейчас сервис только предоставляет коэффициент и код валюты.
    """

    async def get_by_currency(
        self,
        db: AsyncSession,
        currency: str,
    ) -> CurrencyRate | None:
        """Найти активную строку по коду валюты.

        Возвращает None если строка не найдена или не активна —
        в этом случае фронтенд должен использовать значения по умолчанию.
        """
        return await db.scalar(
            select(CurrencyRate).where(
                CurrencyRate.currency == currency.upper(),
                CurrencyRate.is_active.is_(True),
            )
        )

    async def get_default(self, db: AsyncSession) -> CurrencyRate | None:
        """Вернуть строку для валюты по умолчанию (UZS)."""
        return await self.get_by_currency(db, DEFAULT_CURRENCY)

    async def get_active_rates(self, db: AsyncSession) -> list[CurrencyRate]:
        """Список всех активных коэффициентов."""
        result = await db.scalars(
            select(CurrencyRate).where(CurrencyRate.is_active.is_(True))
        )
        return list(result.all())

    def fallback_coefficient(self) -> Decimal:
        """Коэффициент по умолчанию если база недоступна или строка не найдена."""
        return DEFAULT_COEFFICIENT

    def fallback_currency(self) -> str:
        """Валюта по умолчанию."""
        return DEFAULT_CURRENCY


currency_service = CurrencyService()
