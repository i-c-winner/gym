"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import { useCurrencyRate } from "@/shared/hooks/useCurrencyRate";
import { formatPrice } from "@/shared/lib/formatPrice";
import {
  previewSubscription,
  type ClassType,
  type DiscountCredit,
  type Subscription,
  type SubscriptionPreview,
} from "@/shared/api/gym";
import type { PeriodInfo } from "@/shared/lib/schedulePeriods";
import { ProjectedCalendar, generateProjectedEvents } from "./ProjectedCalendar";

type PurchaseDialogProps = {
  period: PeriodInfo | null;
  classTypes: ClassType[];
  existingSubs: Subscription[];
  credits: DiscountCredit[];
  onClose: () => void;
  onSuccess: () => void;
};

export function PurchaseDialog({
  period,
  classTypes,
  existingSubs,
  credits,
  onClose,
}: PurchaseDialogProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { rate } = useCurrencyRate();
  const [selectedTypeId, setSelectedTypeId] = useState(classTypes[0]?.id ?? "");
  const [preview, setPreview] = useState<SubscriptionPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [highlightTypeId, setHighlightTypeId] = useState<string | null>(classTypes[0]?.id ?? null);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(() => {
    const ct = classTypes.find((c) => c.id === (classTypes[0]?.id ?? ""));
    return new Set(ct?.schedules.map((s) => s.day_of_week) ?? []);
  });

  const toggleDay = useCallback((ourDay: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(ourDay)) { next.delete(ourDay); } else { next.add(ourDay); }
      return next;
    });
  }, []);

  const availableCredits = credits.filter(
    (c) => !c.is_used && c.class_type_id === selectedTypeId,
  ).length;

  const hasConflict = existingSubs.some(
    (s) =>
      s.class_type_id === selectedTypeId &&
      ["active", "pending_payment"].includes(s.status) &&
      period &&
      new Date(s.period_start) <= period.end &&
      new Date(s.period_end) >= period.start,
  );

  useEffect(() => {
    if (!selectedTypeId || !period) return;
    setPreview(null);
    setLoadingPreview(true);
    previewSubscription(selectedTypeId, period.type)
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setLoadingPreview(false));
  }, [selectedTypeId, period]);

  useEffect(() => {
    setHighlightTypeId(selectedTypeId || null);
  }, [selectedTypeId]);

  const effectiveTypeId = highlightTypeId ?? selectedTypeId;

  useEffect(() => {
    const ct = classTypes.find((c) => c.id === (highlightTypeId ?? selectedTypeId));
    setSelectedDays(new Set(ct?.schedules.map((s) => s.day_of_week) ?? []));
  }, [highlightTypeId, selectedTypeId, classTypes]);

  const allScheduledDays = useMemo(() => {
    const ct = classTypes.find((c) => c.id === effectiveTypeId);
    return new Set(ct?.schedules.map((s) => s.day_of_week) ?? []);
  }, [classTypes, effectiveTypeId]);

  const isFullSelection = useMemo(
    () => [...allScheduledDays].every((d) => selectedDays.has(d)),
    [allScheduledDays, selectedDays],
  );

  const customDaysCount = useMemo(() => {
    if (!period) return 0;
    const ct = classTypes.find((c) => c.id === selectedTypeId);
    if (!ct) return 0;
    let count = 0;
    const endExcl = new Date(period.end);
    endExcl.setDate(endExcl.getDate() + 1);
    const cur = new Date(period.start);
    cur.setHours(0, 0, 0, 0);
    while (cur < endExcl) {
      const jsDay = cur.getDay();
      const ourDay = jsDay === 0 ? 6 : jsDay - 1;
      if (selectedDays.has(ourDay) && ct.schedules.some((s) => s.day_of_week === ourDay)) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }, [period, classTypes, selectedTypeId, selectedDays]);

  const purchaseActiveDaysPerWeek = useMemo(() => {
    const ct = classTypes.find((c) => c.id === effectiveTypeId);
    if (!ct) return 0;
    return ct.schedules.filter((s) => selectedDays.has(s.day_of_week)).length;
  }, [classTypes, effectiveTypeId, selectedDays]);

  const priceCalc = useMemo(() => {
    if (!preview || preview.days_count === 0) return null;
    if (isFullSelection) return {
      daysCount: preview.days_count,
      gross: Number(preview.gross_amount),
      discount: Number(preview.discount_amount),
      total: Number(preview.total_amount),
      grossStr: preview.gross_amount,
      discountStr: preview.discount_amount,
      totalStr: preview.total_amount,
    };
    const ratio = customDaysCount / preview.days_count;
    const gross    = Number(preview.gross_amount)    * ratio;
    const discount = Number(preview.discount_amount) * ratio;
    const total    = Number(preview.total_amount)    * ratio;
    const fmt = (n: number) => String(Math.round(n * 100) / 100);
    return { daysCount: customDaysCount, gross, discount, total, grossStr: fmt(gross), discountStr: fmt(discount), totalStr: fmt(total) };
  }, [preview, isFullSelection, customDaysCount]);

  const projectedEvents = useMemo(() => {
    if (!period || !calendarOpen) return [];
    return generateProjectedEvents(classTypes, period.start, period.end, highlightTypeId, selectedDays, selectedTypeId);
  }, [period, classTypes, highlightTypeId, calendarOpen, selectedDays, selectedTypeId]);

  const handleGoToPay = () => {
    if (!preview || !period || !priceCalc) return;
    const ct = classTypes.find((c) => c.id === selectedTypeId);
    const q = new URLSearchParams({
      class_type_id:    selectedTypeId,
      period_type:      period.type,
      class_type_title: ct?.title ?? "",
      period_label:     period.label,
      range_label:      period.rangeLabel,
      total_amount:     priceCalc.totalStr,
      gross_amount:     priceCalc.grossStr,
      discount_amount:  priceCalc.discountStr,
      days_count:       String(priceCalc.daysCount),
      currency:         preview.currency,
    });
    router.push(`/account/gym-buy?${q.toString()}`);
  };

  if (!period) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={calendarOpen ? "md" : "xs"}
      fullWidth
      fullScreen={isMobile && calendarOpen}
      scroll="paper"
      slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
    >
      <DialogTitle sx={{ fontFamily: "Georgia, serif", fontSize: "1.375rem", pb: 1 }}>
        Купить подписку
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Box sx={{ bgcolor: "rgba(106,123,106,0.08)", borderRadius: 2, p: 1.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "text.primary" }}>
              {period.label}
            </Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
              {period.rangeLabel}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mb: 0.75 }}>
              Что бы выбрать подходящее время и дни недели, посмотрите расписание.
            </Typography>
            <Select
              fullWidth size="small"
              value={selectedTypeId}
              onChange={(e) => { setSelectedTypeId(e.target.value); setHighlightTypeId(e.target.value); }}
              sx={{ borderRadius: 2 }}
            >
              {classTypes.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
              ))}
            </Select>
          </Box>

          {availableCredits > 0 && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CardGiftcardOutlinedIcon sx={{ fontSize: 18, color: "secondary.main" }} />
              <Typography sx={{ fontSize: "0.875rem", color: "secondary.main", fontWeight: 600 }}>
                {availableCredits} кредит{availableCredits > 1 ? "а" : ""} будет применён
              </Typography>
            </Stack>
          )}

          {hasConflict && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              На этот период уже есть активная подписка
            </Alert>
          )}

          {loadingPreview ? (
            <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
          ) : preview && priceCalc ? (
            <Box sx={{ bgcolor: "rgba(62,56,47,0.04)", borderRadius: 2, p: 1.5 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                  Занятий в периоде
                  {!isFullSelection && (
                    <Typography component="span" sx={{ fontSize: "0.75rem", color: "primary.main", ml: 0.75 }}>
                      (по выбранным дням)
                    </Typography>
                  )}
                </Typography>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>{priceCalc.daysCount}</Typography>
              </Stack>
              {priceCalc.discount > 0 && (
                <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                  <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>Скидка по кредитам</Typography>
                  <Typography sx={{ fontSize: "0.875rem", color: "secondary.main", fontWeight: 600 }}>
                    −{formatPrice(priceCalc.discountStr, rate.coefficient, rate.currency)}
                  </Typography>
                </Stack>
              )}
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 700 }}>Итого</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "1.125rem", color: "primary.main" }}>
                  {formatPrice(priceCalc.totalStr, rate.coefficient, rate.currency)}
                </Typography>
              </Stack>
              <Typography sx={{ mt: 0.75, fontSize: "0.75rem", color: "text.disabled" }}>
                Свободных мест: {preview.available_spots}
              </Typography>
            </Box>
          ) : null}

          <Button
            size="small"
            variant={calendarOpen ? "contained" : "outlined"}
            startIcon={<CalendarMonthOutlinedIcon />}
            onClick={() => setCalendarOpen((v) => !v)}
            sx={{
              alignSelf: "flex-start",
              borderRadius: 2,
              fontSize: "0.8125rem",
              borderColor: "primary.main",
              color: calendarOpen ? "#fff" : "primary.main",
              bgcolor: calendarOpen ? "primary.main" : "transparent",
              "&:hover": { bgcolor: calendarOpen ? "primary.dark" : "rgba(106,123,106,0.07)" },
            }}
          >
            {calendarOpen ? "Скрыть расписание" : "Посмотреть расписание"}
          </Button>

          {calendarOpen && (
            <ProjectedCalendar
              period={period}
              classTypes={classTypes}
              effectiveTypeId={effectiveTypeId}
              selectedDays={selectedDays}
              projectedEvents={projectedEvents}
              allScheduledDays={allScheduledDays}
              isFullSelection={isFullSelection}
              onToggleDay={toggleDay}
              onResetDays={() => setSelectedDays(new Set(allScheduledDays))}
            />
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, flexDirection: "column", alignItems: "stretch", gap: 1.5 }}>
        {preview && priceCalc && (
          <Box
            sx={(t) => ({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.25,
              borderRadius: 2,
              bgcolor: t.palette.mode === "dark" ? "rgba(106,123,106,0.12)" : "rgba(106,123,106,0.08)",
              border: `1px solid ${t.palette.mode === "dark" ? "rgba(106,123,106,0.25)" : "rgba(106,123,106,0.2)"}`,
            })}
          >
            <Stack spacing={0.25}>
              <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
                {purchaseActiveDaysPerWeek}{" "}
                {purchaseActiveDaysPerWeek === 1 ? "день" : purchaseActiveDaysPerWeek < 5 ? "дня" : "дней"} в неделю
                {" · "}
                {priceCalc.daysCount}{" "}
                {priceCalc.daysCount === 1 ? "занятие" : priceCalc.daysCount < 5 ? "занятия" : "занятий"}
              </Typography>
              {!isFullSelection && (
                <Typography sx={{ fontSize: "0.7rem", color: "text.disabled" }}>по выбранным дням</Typography>
              )}
            </Stack>
            <Typography sx={{ fontWeight: 700, fontSize: "1.125rem", color: "primary.main" }}>
              {formatPrice(priceCalc.totalStr, rate.coefficient, rate.currency)}
            </Typography>
          </Box>
        )}

        {purchaseActiveDaysPerWeek < 2 && (
          <Typography sx={{ fontSize: "0.75rem", color: "warning.main", textAlign: "center" }}>
            Выберите минимум 2 дня посещения в неделю
          </Typography>
        )}

        <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 1 }}>
          <Button  onClick={onClose} sx={{ borderRadius: 3, color: "text.secondary" }}>
            Отмена
          </Button>
          <Button
            onClick={handleGoToPay}
            disabled={!preview || !priceCalc || hasConflict || loadingPreview || preview.available_spots === 0 || purchaseActiveDaysPerWeek < 2}
            variant="contained"
            sx={{ borderRadius: 3, px: 3, bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}
          >
            {loadingPreview ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "К оплате →"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
