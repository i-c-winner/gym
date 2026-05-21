"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { BigButtons } from "@/widgets/bigButtons/BigButtons";
import { getPlansByResourceSlug, type Plan } from "@/shared/api/plans";
import { useCurrencyRate } from "@/shared/hooks/useCurrencyRate";
import { formatPrice } from "@/shared/lib/formatPrice";

const DURATION_ORDER: Record<string, number> = {
  monthly: 0,
  biannual: 1,
  six_months: 1,
  annual: 2,
  yearly: 2,
};

const FALLBACK_PLANS = [
  { id: "1", title: "Месяц",    price: "" },
  { id: "2", title: "6 Месяцев", price: "" },
  { id: "3", title: "Год",      price: "" },
];

function Orders() {
  const { t } = useTranslation();
  const { rate } = useCurrencyRate();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    getPlansByResourceSlug("flexibility")
      .then((data) => {
        if (data.length > 0) {
          const sorted = [...data].sort(
            (a, b) =>
              (DURATION_ORDER[a.duration_type] ?? 99) -
              (DURATION_ORDER[b.duration_type] ?? 99),
          );
          setPlans(sorted);
        }
      })
      .catch(() => {/* keep empty — fallback renders below */});
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1240px",
        mx: "auto",
        px: { xs: 2, sm: 3, md: 0 },
        py: { xs: 5, md: 7 },
      }}
    >
      <Typography className="orders-title">
        Присоедениться к занятиям
      </Typography>

      <Box
        sx={{
          mt: { xs: 3, md: 4 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: { xs: 2.5, md: 2 },
        }}
      >
        {plans.length > 0
          ? plans.map((plan) => (
              <BigButtons
                key={plan.id}
                title={t(`programBuy.plans.${plan.duration_type}.title`, {
                  defaultValue: plan.title || plan.duration_type,
                })}
                price={formatPrice(plan.price_amount, rate.coefficient, rate.currency)}
                textButton={t("orders.trialButton", { defaultValue: "Попробовать" })}
                subtitle={t(`programBuy.plans.${plan.duration_type}.description`, {
                  defaultValue: "",
                })}
              />
            ))
          : FALLBACK_PLANS.map((fb) => (
              <BigButtons
                key={fb.id}
                title={fb.title}
                price="—"
                textButton="Попробовать"
                subtitle=""
              />
            ))}
      </Box>
    </Box>
  );
}

export { Orders };
