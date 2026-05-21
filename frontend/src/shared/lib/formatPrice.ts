/**
 * Форматирование цены с применением коэффициента конверсии.
 *
 * Функция конверсии будет определена позже.
 * Сейчас: умножаем исходную сумму на коэффициент и округляем до целого.
 *
 * @param amount     - исходная сумма (число или строка из API)
 * @param coefficient - коэффициент из таблицы currency_rates
 * @param currency    - код валюты для отображения (например "UZS")
 * @returns строка вида "135 000 UZS"
 */
export function formatPrice(
  amount: number | string,
  coefficient: number,
  currency: string,
): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return `— ${currency}`;

  const converted = Math.round(numeric * coefficient);

  const formatted = converted.toLocaleString("ru-RU");
  return `${formatted} ${currency}`;
}
