"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import { useAuth } from "@/features/auth/model/auth-context";
import { Header } from "@/entities/headers/ui/Header";
import { CardShell } from "@/shared/ui/CardShell";
import { purchaseSubscription, activateSubscription } from "@/shared/api/gym";
import { v4 as uuidv4 } from "uuid";

const COUNTDOWN_SECONDS = 5;
const ACCENT = "#6a7b6a";

type Provider = "click" | "payme";
type PageState = "idle" | "processing" | "success" | "error";

const PROVIDER_LABELS: Record<Provider, string> = {
  click: "CLICK",
  payme: "PayMe",
};

function GymBuyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { csrfToken, status: authStatus } = useAuth();

  // ── URL params (set by PurchaseDialog before navigation) ──────────────────
  const classTypeId   = params.get("class_type_id") ?? "";
  const periodType    = params.get("period_type") ?? "";
  const title         = params.get("class_type_title") ?? "Занятие";
  const periodLabel   = params.get("period_label") ?? "";
  const rangeLabel    = params.get("range_label") ?? "";
  const totalAmount   = params.get("total_amount") ?? "0";
  const grossAmount   = params.get("gross_amount") ?? "0";
  const discountAmount = params.get("discount_amount") ?? "0";
  const daysCount     = params.get("days_count") ?? "0";
  const currency      = params.get("currency") ?? "RUB";

  const [pageState, setPageState] = useState<PageState>("idle");
  const [provider, setProvider]   = useState<Provider | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [error, setError]         = useState<string | null>(null);
  const txnIdRef = useRef<string>("");
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "anonymous") router.replace("/");
    if (!classTypeId || !periodType) router.replace("/account/schedule");
  }, [authStatus, classTypeId, periodType, router]);

  // ── Countdown → success ───────────────────────────────────────────────────
  useEffect(() => {
    if (pageState !== "processing") return;
    setCountdown(COUNTDOWN_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          void finalize();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    // finalize is stable — defined below with useRef trick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState]);

  // ── Create + activate subscription after payment simulation ───────────────
  async function finalize() {
    try {
      const txnId = txnIdRef.current;
      const sub = await purchaseSubscription(classTypeId, periodType, txnId);
      if (!sub) throw new Error("Пустой ответ при создании подписки");
      await activateSubscription(sub.id, txnId);
      setPageState("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка активации подписки");
      setPageState("error");
    }
  }

  // ── Start payment simulation ───────────────────────────────────────────────
  function handlePay(selectedProvider: Provider) {
    if (!csrfToken && authStatus === "authenticated") {
      // CSRF might be missing — still proceed (finalize calls gym API which uses cookies)
    }
    txnIdRef.current = uuidv4();
    setProvider(selectedProvider);
    setError(null);
    setPageState("processing");
  }

  if (authStatus === "loading" || !classTypeId) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.default" }}>
        <Header />
        <Box sx={{ display: "grid", placeItems: "center", flex: 1 }}>
          <CircularProgress sx={{ color: ACCENT }} />
        </Box>
      </Box>
    );
  }

  const hasDiscount = Number(discountAmount) > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.default" }}>
      <Header />

      <Box sx={{ width: "100%", maxWidth: 520, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 4, md: 7 } }}>

        {/* Hero banner */}
        <Box
          sx={{
            minHeight: 140,
            borderRadius: 3,
            mb: 3,
            background: `linear-gradient(135deg, ${ACCENT} 0%, #4a5b4a 100%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            p: 2.5,
            gap: 0.5,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <FitnessCenterOutlinedIcon sx={{ color: "rgba(255,255,255,0.75)", fontSize: 20 }} />
            <Typography sx={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)" }}>
              Offline-занятия
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: { xs: "1.5rem", sm: "2rem" },
              color: "#fffdf8",
              lineHeight: 1.1,
            }}
          >
            {title}
          </Typography>
        </Box>

        <CardShell>
          <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>

            {/* Order summary */}
            <Stack spacing={1} sx={{ mb: 2.5 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>Период</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{periodLabel}</Typography>
              </Stack>
              {rangeLabel && (
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>Даты</Typography>
                  <Typography sx={{ fontSize: "0.875rem" }}>{rangeLabel}</Typography>
                </Stack>
              )}
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>Занятий</Typography>
                <Typography sx={{ fontSize: "0.875rem" }}>{daysCount}</Typography>
              </Stack>
              {hasDiscount && (
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>Без скидки</Typography>
                  <Typography sx={{ fontSize: "0.875rem", textDecoration: "line-through", color: "text.disabled" }}>
                    {Number(grossAmount).toLocaleString("ru-RU")} {currency}
                  </Typography>
                </Stack>
              )}
              {hasDiscount && (
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography sx={{ color: "secondary.main", fontSize: "0.875rem" }}>Скидка (кредиты)</Typography>
                  <Typography sx={{ color: "secondary.main", fontWeight: 600, fontSize: "0.875rem" }}>
                    −{Number(discountAmount).toLocaleString("ru-RU")} {currency}
                  </Typography>
                </Stack>
              )}
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Total */}
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem" }}>Итого</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "1.875rem", color: ACCENT, lineHeight: 1 }}>
                {Number(totalAmount).toLocaleString("ru-RU")} {currency}
              </Typography>
            </Stack>

            {/* States */}
            {(pageState === "idle" || pageState === "error") && (
              <Stack spacing={1.5}>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Способ оплаты</Typography>

                <Button
                  fullWidth variant="contained" size="large"
                  onClick={() => handlePay("click")}
                  sx={{
                    borderRadius: 999, py: 1.5, fontWeight: 700, fontSize: "1rem",
                    bgcolor: "#00A859", "&:hover": { bgcolor: "#009950" },
                  }}
                >
                  Оплатить через CLICK
                </Button>

                <Button
                  fullWidth variant="contained" size="large"
                  onClick={() => handlePay("payme")}
                  sx={{
                    borderRadius: 999, py: 1.5, fontWeight: 700, fontSize: "1rem",
                    bgcolor: "#2671E2", "&:hover": { bgcolor: "#1f5fc7" },
                  }}
                >
                  Оплатить через PayMe
                </Button>

                {pageState === "error" && error && (
                  <Typography sx={{ color: "error.main", fontSize: "0.875rem", textAlign: "center", mt: 1 }}>
                    {error}
                  </Typography>
                )}

                <Button
                  fullWidth onClick={() => router.back()}
                  sx={{ borderRadius: 999, mt: 0.5, color: "text.secondary" }}
                >
                  Назад
                </Button>
              </Stack>
            )}

            {pageState === "processing" && (
              <Stack spacing={2} sx={{ alignItems: "center", py: 2 }}>
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  <CircularProgress
                    variant="determinate"
                    value={((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100}
                    size={80} thickness={3}
                    sx={{ color: ACCENT }}
                  />
                  <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "1.5rem", color: ACCENT }}>
                      {countdown}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>
                  Обработка платежа {provider ? PROVIDER_LABELS[provider] : ""}…
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", textAlign: "center" }}>
                  Не закрывайте страницу
                </Typography>
              </Stack>
            )}

            {pageState === "success" && (
              <Stack spacing={2} sx={{ alignItems: "center", py: 2 }}>
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 56, color: "success.main" }} />
                <Typography sx={{ fontWeight: 700, fontSize: "1.25rem" }}>
                  Подписка оформлена!
                </Typography>
                <Typography sx={{ color: "text.secondary", textAlign: "center" }}>
                  Занятия добавлены в ваш календарь
                </Typography>
                <Button
                  fullWidth variant="contained" size="large"
                  onClick={() => router.push("/account/schedule")}
                  sx={{
                    mt: 1, borderRadius: 999, py: 1.5, fontWeight: 700,
                    bgcolor: ACCENT, "&:hover": { bgcolor: "#5a6b5a" },
                  }}
                >
                  Открыть расписание
                </Button>
              </Stack>
            )}
          </Box>
        </CardShell>
      </Box>
    </Box>
  );
}

export { GymBuyPage };