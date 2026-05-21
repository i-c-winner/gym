from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.currency_rate import CurrencyRateDefault, CurrencyRateRead
from app.services.currency_service import currency_service

router = APIRouter(prefix="/currency", tags=["currency"])


@router.get(
    "/rate",
    response_model=CurrencyRateRead | CurrencyRateDefault,
    summary="Получить коэффициент конверсии",
    description=(
        "Возвращает коэффициент для указанной валюты. "
        "Если валюта не найдена — возвращает значения по умолчанию "
        "(UZS, коэффициент 13500, поле is_default=true). "
        "Фронтенд вызывает этот эндпоинт при каждом отображении суммы."
    ),
)
async def get_rate(
    currency: str = Query(
        default="UZS",
        description="Код валюты (например UZS, USD, RUB)",
        min_length=1,
        max_length=8,
    ),
    db: AsyncSession = Depends(get_db),
) -> CurrencyRateRead | CurrencyRateDefault:
    rate = await currency_service.get_by_currency(db, currency)
    if rate:
        return CurrencyRateRead.model_validate(rate)
    return CurrencyRateDefault(
        currency=currency_service.fallback_currency(),
        coefficient=currency_service.fallback_coefficient(),
    )


@router.get(
    "/rates",
    response_model=list[CurrencyRateRead],
    summary="Список всех активных коэффициентов",
    description="Возвращает все активные строки таблицы currency_rates.",
)
async def list_rates(
    db: AsyncSession = Depends(get_db),
) -> list[CurrencyRateRead]:
    rates = await currency_service.get_active_rates(db)
    return [CurrencyRateRead.model_validate(r) for r in rates]
