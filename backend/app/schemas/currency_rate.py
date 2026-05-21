from decimal import Decimal

from pydantic import BaseModel


class CurrencyRateRead(BaseModel):
    """Схема для отображения на фронтенде."""

    id: str
    currency: str
    coefficient: Decimal
    is_active: bool

    model_config = {"from_attributes": True}


class CurrencyRateDefault(BaseModel):
    """Возвращается когда запрошенная валюта не найдена — фолбэк-значения."""

    currency: str
    coefficient: Decimal
    is_default: bool = True
