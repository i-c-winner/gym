"use client";

import { useEffect, useState } from "react";
import { getCurrencyRate, type CurrencyRate } from "@/shared/api/currency";

const DEFAULT_RATE: CurrencyRate = {
  currency: "UZS",
  coefficient: 13500,
  is_default: true,
};

/**
 * Хук для получения коэффициента конверсии с бэкенда.
 *
 * Фронтенд использует этот хук всякий раз когда нужно отобразить сумму.
 * Пока данные загружаются — используются значения по умолчанию (UZS, 13500),
 * чтобы интерфейс не "прыгал".
 *
 * @param currency - код валюты (по умолчанию "UZS")
 */
export function useCurrencyRate(currency = "UZS"): {
  rate: CurrencyRate;
  loading: boolean;
} {
  const [rate, setRate] = useState<CurrencyRate>(DEFAULT_RATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCurrencyRate(currency).then((result) => {
      if (!cancelled) {
        setRate(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currency]);

  return { rate, loading };
}
