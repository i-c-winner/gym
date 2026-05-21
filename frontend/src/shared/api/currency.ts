import { request } from "./client";

export type CurrencyRate = {
  currency: string;
  coefficient: number;
  /** true если строка не найдена в БД и вернулись значения по умолчанию */
  is_default?: boolean;
};

const DEFAULT_CURRENCY = "UZS";

/**
 * Получить коэффициент конверсии с бэкенда.
 * Если запрос не удался — возвращает фолбэк (UZS, 13500).
 */
export async function getCurrencyRate(
  currency: string = DEFAULT_CURRENCY,
): Promise<CurrencyRate> {
  try {
    const result = await request<CurrencyRate>(
      `/currency/rate?currency=${encodeURIComponent(currency)}`,
      { method: "GET" },
    );
    if (result) return result;
  } catch {
    // сеть недоступна или бэкенд вернул ошибку — используем фолбэк
  }
  return { currency: DEFAULT_CURRENCY, coefficient: 13500, is_default: true };
}
