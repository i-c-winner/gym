"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Popover,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";
import { useCurrencyRate } from "@/shared/hooks/useCurrencyRate";
import { formatPrice } from "@/shared/lib/formatPrice";
import {
  getUserSchedule,
  getUserCredits,
  getUserClassTypes,
  getUserSubscriptions,
  getUserAbsenceRequests,
  createAbsenceRequest,
  previewSubscription,
  type ScheduleEvent,
  type DiscountCredit,
  type AbsenceRequest,
  type ClassType,
  type Subscription,
  type SubscriptionPreview,
} from "@/shared/api/gym";
import type { EventClickArg, EventInput } from "@fullcalendar/core";

// ── Period helpers ────────────────────────────────────────────────────────────

const MONTHS_RU = [
  "январь","февраль","март","апрель","май","июнь",
  "июль","август","сентябрь","октябрь","ноябрь","декабрь",
];
const MONTHS_RU_GEN = [
  "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря",
];
const MONTHS_RU_CAP = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(1);
  r.setMonth(r.getMonth() + n);
  return r;
}
function lastDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

type PeriodInfo = {
  type: string;
  label: string;       // short label for button
  rangeLabel: string;  // e.g. "1–31 мая"
  start: Date;
  end: Date;
};

function getPeriods(today: Date): PeriodInfo[] {
  const nextFirst = addMonths(today, 1);
  const endNextMonth = lastDay(nextFirst);
  const end3 = lastDay(addMonths(today, 3));
  const end6 = lastDay(addMonths(today, 6));
  const endCurrent = lastDay(today);

  const fmt = (d: Date) => `${d.getDate()} ${MONTHS_RU_GEN[d.getMonth()]}`;
  const monthYear = (d: Date) => `${MONTHS_RU_CAP[d.getMonth()]} ${d.getFullYear()}`;
  const rangeMonths = (a: Date, b: Date) =>
    a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
      ? monthYear(a)
      : a.getFullYear() === b.getFullYear()
      ? `${MONTHS_RU_CAP[a.getMonth()]} – ${MONTHS_RU[b.getMonth()]} ${b.getFullYear()}`
      : `${MONTHS_RU_CAP[a.getMonth()]} ${a.getFullYear()} – ${MONTHS_RU[b.getMonth()]} ${b.getFullYear()}`;

  return [
    {
      type: "current_month_rest",
      label: `до конца ${MONTHS_RU_GEN[today.getMonth()]}`,
      rangeLabel: `${fmt(today)} – ${fmt(endCurrent)} ${today.getFullYear()}`,
      start: today,
      end: endCurrent,
    },
    {
      type: "next_month",
      label: monthYear(nextFirst),
      rangeLabel: `1 – ${endNextMonth.getDate()} ${MONTHS_RU_GEN[nextFirst.getMonth()]} ${nextFirst.getFullYear()}`,
      start: nextFirst,
      end: endNextMonth,
    },
    {
      type: "next_3_months",
      label: rangeMonths(nextFirst, end3),
      rangeLabel: `1 ${MONTHS_RU_GEN[nextFirst.getMonth()]} – ${end3.getDate()} ${MONTHS_RU_GEN[end3.getMonth()]} ${end3.getFullYear()}`,
      start: nextFirst,
      end: end3,
    },
    {
      type: "next_6_months",
      label: rangeMonths(nextFirst, end6),
      rangeLabel: `1 ${MONTHS_RU_GEN[nextFirst.getMonth()]} – ${end6.getDate()} ${MONTHS_RU_GEN[end6.getMonth()]} ${end6.getFullYear()}`,
      start: nextFirst,
      end: end6,
    },
  ];
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  confirmed:  "#6a7b6a",
  warned:     "#b89f74", // confirmed + pending absence warning (client-side virtual status)
  absent:     "#9e9e9e",
  cancelled:  "#bdbdbd",
  no_show:    "#ef5350",
  attended:   "#43a047",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed:  "Записан",
  warned:     "Предупреждение отправлено",
  absent:     "Отсутствовал",
  cancelled:  "Отменено",
  no_show:    "Не явился",
  attended:   "Посетил",
};

// ── Event popover ─────────────────────────────────────────────────────────────

type PopoverState = { anchor: Element; event: ScheduleEvent } | null;

function EventPopover({
  state,
  onClose,
  absenceRequests,
  csrfToken,
  onAbsenceCreated,
}: {
  state: PopoverState;
  onClose: () => void;
  absenceRequests: AbsenceRequest[];
  csrfToken: string | null;
  onAbsenceCreated: () => void;
}) {
  const [warning, setWarning] = useState<"idle" | "loading" | "done" | "error">("idle");

  if (!state) return null;
  const { event } = state;
  const start = new Date(event.scheduled_at);
  const end = new Date(event.ends_at);
  const now = new Date();

  const pendingRequest = absenceRequests.find(
    (r) => r.booking_id === event.booking_id && r.status === "pending",
  );
  const isFuture = start > now;
  const canWarn =
    event.booking_status === "confirmed" && isFuture && !pendingRequest && csrfToken;

  const displayStatus = pendingRequest ? "warned" : event.booking_status;

  const fmtFull = (d: Date) =>
    d.toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  const handleWarn = async () => {
    if (!csrfToken) return;
    setWarning("loading");
    try {
      await createAbsenceRequest(event.booking_id, csrfToken);
      setWarning("done");
      onAbsenceCreated();
      setTimeout(onClose, 1200);
    } catch {
      setWarning("error");
    }
  };

  return (
    <Popover
      open
      anchorEl={state.anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { sx: { borderRadius: 3, p: 2, maxWidth: 300, boxShadow: "0 8px 24px rgba(62,56,47,0.12)" } } }}
    >
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "text.primary" }}>
          {event.class_type_title}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <CalendarMonthOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            {fmtFull(start)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            {event.duration_minutes} мин · до {end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </Typography>
        </Stack>
        <Chip
          label={STATUS_LABEL[displayStatus] ?? displayStatus}
          size="small"
          sx={{
            alignSelf: "flex-start",
            bgcolor: STATUS_COLOR[displayStatus] ?? "#9e9e9e",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
        {event.class_type_description && (
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", lineHeight: 1.5 }}>
            {event.class_type_description}
          </Typography>
        )}

        {/* Absence warning action */}
        {warning === "done" ? (
          <Typography sx={{ fontSize: "0.8125rem", color: "secondary.main", fontWeight: 600 }}>
            Тренер уведомлён
          </Typography>
        ) : warning === "error" ? (
          <Typography sx={{ fontSize: "0.8125rem", color: "error.main" }}>
            Ошибка. Попробуйте ещё раз.
          </Typography>
        ) : canWarn ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => void handleWarn()}
            disabled={warning === "loading"}
            sx={{
              borderRadius: 2,
              borderColor: "#b89f74",
              color: "#b89f74",
              fontSize: "0.8125rem",
              "&:hover": { borderColor: "#a08060", bgcolor: "rgba(184,159,116,0.06)" },
            }}
          >
            {warning === "loading" ? (
              <CircularProgress size={14} sx={{ color: "#b89f74" }} />
            ) : (
              "Предупредить о пропуске"
            )}
          </Button>
        ) : null}
      </Stack>
    </Popover>
  );
}

// ── Projected calendar events ─────────────────────────────────────────────────

/**
 * Разворачивает повторяющиеся расписания classTypes в конкретные события
 * для заданного диапазона дат.
 * highlightTypeId === null → все события показываются одинаково (зелёные).
 * highlightTypeId === id   → этот тип контрастный, остальные приглушённые.
 */
function generateProjectedEvents(
  classTypes: ClassType[],
  periodStart: Date,
  periodEnd: Date,
  highlightTypeId: string | null,
  selectedDays: Set<number>,  // 0=Пн … 6=Вс (наш формат)
  selectedTypeId: string,     // тип, для которого работает выбор дней
): EventInput[] {
  const result: EventInput[] = [];
  const endExclusive = new Date(periodEnd);
  endExclusive.setDate(endExclusive.getDate() + 1);

  const cursor = new Date(periodStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < endExclusive) {
    // JS: 0=Sun … 6=Sat → наш формат: 0=Mon … 6=Sun
    const jsDay = cursor.getDay();
    const ourDay = jsDay === 0 ? 6 : jsDay - 1;

    for (const ct of classTypes) {
      for (const slot of ct.schedules) {
        if (slot.day_of_week !== ourDay) continue;
        const [hStr, mStr] = slot.start_time.split(":");
        const evStart = new Date(cursor);
        evStart.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
        const evEnd = new Date(evStart);
        evEnd.setMinutes(evEnd.getMinutes() + ct.duration_minutes);

        // Затемнение по выбору дня — только для выбранного в дропдауне типа
        const dimmedByDay = ct.id === selectedTypeId && !selectedDays.has(ourDay);

        // Подсветка по чипу-фильтру (независимо от выбора дней)
        const isHighlighted =
          !dimmedByDay && (highlightTypeId === null || ct.id === highlightTypeId);

        // Включаем параметры фильтра в id — FullCalendar не кэширует старые цвета
        const filterId = `${highlightTypeId ?? "all"}-${selectedTypeId}-${[...selectedDays].sort().join("")}`;
        result.push({
          id: `proj-${filterId}-${ct.id}-${evStart.getTime()}`,
          title: ct.title,
          start: evStart,
          end: evEnd,
          backgroundColor: dimmedByDay
            ? "rgba(80,80,80,0.1)"
            : (isHighlighted ? "#6a7b6a" : "rgba(160,160,160,0.28)"),
          borderColor: dimmedByDay
            ? "transparent"
            : (isHighlighted ? "#4a5f4a" : "rgba(160,160,160,0.4)"),
          textColor: dimmedByDay ? "#ccc" : (isHighlighted ? "#fff" : "#aaa"),
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

// ── Purchase dialog ───────────────────────────────────────────────────────────

function PurchaseDialog({
  period,
  classTypes,
  existingSubs,
  credits,
  onClose,
}: {
  period: PeriodInfo | null;
  classTypes: ClassType[];
  existingSubs: Subscription[];
  credits: DiscountCredit[];
  onClose: () => void;
  onSuccess: () => void; // kept for type compatibility
}) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { rate } = useCurrencyRate();
  const [selectedTypeId, setSelectedTypeId] = useState(classTypes[0]?.id ?? "");
  const [preview, setPreview] = useState<SubscriptionPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ── Calendar state ──────────────────────────────────────────────────────────
  const [calendarOpen, setCalendarOpen] = useState(false);
  // null = все контрастные; id = только этот тип контрастный, остальные приглушены
  const [highlightTypeId, setHighlightTypeId] = useState<string | null>(
    classTypes[0]?.id ?? null,
  );
  // Выбранные дни недели (0=Пн … 6=Вс, наш формат)
  // По умолчанию — все дни, на которых есть занятия выбранного типа
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

  // Count unused credits for selected class type
  const availableCredits = credits.filter(
    (c) => !c.is_used && c.class_type_id === selectedTypeId,
  ).length;

  // Check for overlapping active subscription
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

  // При смене дропдауна — синхронизируем чип с ним
  useEffect(() => {
    setHighlightTypeId(selectedTypeId || null);
  }, [selectedTypeId]);

  // Активный тип для выбора дней: чип (если выбран) или дропдаун
  const effectiveTypeId = highlightTypeId ?? selectedTypeId;

  // При смене чипа или дропдауна — сбрасываем выбранные дни под новый тип
  useEffect(() => {
    const ct = classTypes.find((c) => c.id === (highlightTypeId ?? selectedTypeId));
    setSelectedDays(new Set(ct?.schedules.map((s) => s.day_of_week) ?? []));
  }, [highlightTypeId, selectedTypeId, classTypes]);

  // Все дни эффективного типа (для кнопки "Сбросить" и isFullSelection)
  const allScheduledDays = useMemo(() => {
    const ct = classTypes.find((c) => c.id === effectiveTypeId);
    return new Set(ct?.schedules.map((s) => s.day_of_week) ?? []);
  }, [classTypes, effectiveTypeId]);

  const isFullSelection = useMemo(
    () => [...allScheduledDays].every((d) => selectedDays.has(d)),
    [allScheduledDays, selectedDays],
  );

  // Кол-во занятий выбранного типа на выбранных днях в периоде
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

  // Пропорциональный пересчёт цены по выбранным дням
  const priceCalc = useMemo(() => {
    if (!preview || preview.days_count === 0) return null;
    if (isFullSelection) return {
      daysCount:  preview.days_count,
      gross:      Number(preview.gross_amount),
      discount:   Number(preview.discount_amount),
      total:      Number(preview.total_amount),
      grossStr:   preview.gross_amount,
      discountStr: preview.discount_amount,
      totalStr:   preview.total_amount,
    };
    const ratio = customDaysCount / preview.days_count;
    const gross    = Number(preview.gross_amount)    * ratio;
    const discount = Number(preview.discount_amount) * ratio;
    const total    = Number(preview.total_amount)    * ratio;
    const fmt = (n: number) => String(Math.round(n * 100) / 100);
    return {
      daysCount: customDaysCount,
      gross, discount, total,
      grossStr:    fmt(gross),
      discountStr: fmt(discount),
      totalStr:    fmt(total),
    };
  }, [preview, isFullSelection, customDaysCount]);

  // Проецируем повторяющиеся слоты на даты периода
  const projectedEvents = useMemo(() => {
    if (!period || !calendarOpen) return [];
    return generateProjectedEvents(
      classTypes,
      period.start,
      period.end,
      highlightTypeId,
      selectedDays,
      selectedTypeId,
    );
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
      slotProps={{ paper: { sx: { borderRadius: calendarOpen && !isMobile ? 4 : 4, p: 1 } } }}
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

          {/* Class type selector */}
          <Box>
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mb: 0.75 }}>
              Тип занятия
            </Typography>
            <Select
              fullWidth size="small"
              value={selectedTypeId}
              onChange={(e) => {
                setSelectedTypeId(e.target.value);
                setHighlightTypeId(e.target.value);
              }}
              sx={{ borderRadius: 2 }}
            >
              {classTypes.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
              ))}
            </Select>
          </Box>

          {/* Credits hint */}
          {availableCredits > 0 && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CardGiftcardOutlinedIcon sx={{ fontSize: 18, color: "secondary.main" }} />
              <Typography sx={{ fontSize: "0.875rem", color: "secondary.main", fontWeight: 600 }}>
                {availableCredits} кредит{availableCredits > 1 ? "а" : ""} будет применён
              </Typography>
            </Stack>
          )}

          {/* Conflict warning */}
          {hasConflict && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              На этот период уже есть активная подписка
            </Alert>
          )}

          {/* Price preview */}
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
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {priceCalc.daysCount}
                </Typography>
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

          {hasConflict && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              На этот период уже есть активная подписка
            </Alert>
          )}

          {/* ── Кнопка раскрытия календаря ── */}
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
              "&:hover": {
                bgcolor: calendarOpen ? "primary.dark" : "rgba(106,123,106,0.07)",
              },
            }}
          >
            {calendarOpen ? "Скрыть расписание" : "Посмотреть расписание"}
          </Button>

          {/* ── Календарь занятий ── */}
          {calendarOpen && (
            <Box>
              {/* Чипы-фильтры */}
              <Stack
                direction="row"
                sx={{ flexWrap: "wrap", gap: 1, mb: 1.5 }}
              >
                <Chip
                  label="Все"
                  size="small"
                  onClick={() => setHighlightTypeId(null)}
                  variant={highlightTypeId === null ? "filled" : "outlined"}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    ...(highlightTypeId === null
                      ? { bgcolor: "#6a7b6a", color: "#fff" }
                      : { borderColor: "rgba(106,123,106,0.4)", color: "text.secondary" }),
                  }}
                />
                {classTypes.map((ct) => {
                  const active = highlightTypeId === ct.id;
                  return (
                    <Chip
                      key={ct.id}
                      label={ct.title}
                      size="small"
                      onClick={() =>
                        setHighlightTypeId((h) => (h === ct.id ? null : ct.id))
                      }
                      variant={active ? "filled" : "outlined"}
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        ...(active
                          ? { bgcolor: "#6a7b6a", color: "#fff" }
                          : { borderColor: "rgba(106,123,106,0.4)", color: "text.secondary" }),
                        "&:hover": {
                          bgcolor: active
                            ? "#5a6b5a"
                            : "rgba(106,123,106,0.08)",
                        },
                      }}
                    />
                  );
                })}
              </Stack>

              {/* Подсказки */}
              <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}>
                <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
                  Кликните на день недели в шапке календаря, чтобы включить/выключить его
                </Typography>
                {!isFullSelection && (
                  <Typography
                    onClick={() => setSelectedDays(new Set(allScheduledDays))}
                    sx={{
                      fontSize: "0.75rem",
                      color: "primary.main",
                      cursor: "pointer",
                      fontWeight: 600,
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Сбросить
                  </Typography>
                )}
              </Stack>

              {/* FullCalendar — горизонтальный скролл */}
              <Box
                sx={(t) => ({
                  border: `1px solid ${t.palette.divider}`,
                  borderRadius: 2,
                  overflowX: "auto",
                  overflowY: "hidden",
                  WebkitOverflowScrolling: "touch",
                })}
              >
              <Box
                sx={(t) => ({
                  minWidth: 560,
                  "& .fc": { fontFamily: "inherit", fontSize: "0.8125rem" },
                  "& .fc-toolbar-title": {
                    fontFamily: "Georgia, serif",
                    fontSize: "1rem !important",
                    color: t.palette.text.primary,
                  },
                  "& .fc-button": {
                    bgcolor: "#6a7b6a !important",
                    border: "none !important",
                    borderRadius: "8px !important",
                    px: "8px !important",
                    minHeight: "32px !important",
                    fontFamily: "inherit !important",
                    fontSize: "0.75rem !important",
                  },
                  "& .fc-button:hover": { bgcolor: "#5a6b5a !important" },
                  "& .fc-col-header-cell": { color: t.palette.text.secondary, p: "0 !important" },
                  "& .fc-col-header-cell-cushion": { p: "0 !important", display: "block" },
                  "& .fc-event": { cursor: "default", borderRadius: "4px !important" },
                  "& .fc-daygrid-event": { px: "2px" },
                  ...(t.palette.mode === "dark" && {
                    "& .fc": {
                      "--fc-page-bg-color": t.palette.background.paper,
                      "--fc-neutral-bg-color": "rgba(143,163,143,0.07)",
                      "--fc-border-color": "rgba(143,163,143,0.18)",
                      "--fc-today-bg-color": "rgba(143,163,143,0.10)",
                    },
                    "& .fc-daygrid-day": {
                      background: `${t.palette.background.paper} !important`,
                    },
                    "& .fc-daygrid-day-number, & .fc-col-header-cell-cushion": {
                      color: `${t.palette.text.primary} !important`,
                    },
                    "& .fc-scrollgrid, & .fc-theme-standard td, & .fc-theme-standard th": {
                      borderColor: "rgba(143,163,143,0.18) !important",
                    },
                  }),
                })}
              >
                <FullCalendar
                  key={`${effectiveTypeId}-${[...selectedDays].sort().join("")}`}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  locale={ruLocale}
                  initialView="dayGridMonth"
                  initialDate={period.start}
                  validRange={{
                    start: period.start.toISOString().slice(0, 10),
                    end: (() => {
                      const d = new Date(period.end);
                      d.setDate(d.getDate() + 1);
                      return d.toISOString().slice(0, 10);
                    })(),
                  }}
                  headerToolbar={{
                    left: "prev,next",
                    center: "title",
                    right: "",
                  }}
                  buttonText={{ today: "Сегодня" }}
                  dayHeaderContent={(args) => {
                    // JS: 0=Sun…6=Sat → наш: 0=Пн…6=Вс
                    const ourDay = args.dow === 0 ? 6 : args.dow - 1;
                    const ct = classTypes.find((c) => c.id === effectiveTypeId);
                    const hasSlot = ct?.schedules.some((s) => s.day_of_week === ourDay) ?? false;
                    const isOn = selectedDays.has(ourDay);
                    return (
                      <Box
                        onClick={hasSlot ? () => toggleDay(ourDay) : undefined}
                        title={hasSlot ? (isOn ? "Нажмите, чтобы исключить день" : "Нажмите, чтобы включить день") : undefined}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          py: 0.75,
                          cursor: hasSlot ? "pointer" : "default",
                          userSelect: "none",
                          fontWeight: isOn && hasSlot ? 700 : 400,
                          fontSize: "0.8125rem",
                          color: hasSlot
                            ? (isOn ? "#fff" : "text.secondary")
                            : "text.disabled",
                          bgcolor: hasSlot
                            ? (isOn ? "#6a7b6a" : "rgba(80,80,80,0.12)")
                            : "transparent",
                          transition: "all 0.15s",
                          "&:hover": hasSlot
                            ? { bgcolor: isOn ? "#5a6b5a" : "rgba(80,80,80,0.22)" }
                            : {},
                        }}
                      >
                        {args.text}
                      </Box>
                    );
                  }}
                  events={projectedEvents}
                  height="auto"
                  eventTimeFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    meridiem: false,
                  }}
                  noEventsContent={
                    <Typography
                      sx={{
                        py: 4,
                        textAlign: "center",
                        color: "text.secondary",
                        fontSize: "0.875rem",
                      }}
                    >
                      Нет занятий в выбранном периоде
                    </Typography>
                  }
                />
              </Box>
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, flexDirection: "column", alignItems: "stretch", gap: 1 }}>
        {selectedDays.size < 2 && (
          <Typography sx={{ fontSize: "0.75rem", color: "warning.main", textAlign: "center" }}>
            Выберите минимум 2 дня посещения в неделю
          </Typography>
        )}
        <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 1 }}>
          <Button onClick={onClose} sx={{ borderRadius: 3, color: "text.secondary" }}>
            Отмена
          </Button>
          <Button
            onClick={handleGoToPay}
            disabled={!preview || !priceCalc || hasConflict || loadingPreview || preview.available_spots === 0 || priceCalc.daysCount === 0 || selectedDays.size < 2}
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

// ── Period button ─────────────────────────────────────────────────────────────

function PeriodCard({
  period,
  missedCount,
  onClick,
}: {
  period: PeriodInfo;
  missedCount: number;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      sx={(theme) => ({
        flex: "1 1 0",
        minWidth: { xs: "calc(50% - 6px)", sm: 140 },
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.5,
        p: 2,
        borderRadius: 3,
        border: `1.5px solid ${theme.palette.mode === "dark" ? "rgba(143,163,143,0.25)" : "rgba(106,123,106,0.25)"}`,
        bgcolor: theme.palette.mode === "dark" ? "rgba(143,163,143,0.08)" : "rgba(255,253,248,0.7)",
        color: "text.primary",
        textAlign: "left",
        "&:hover": {
          bgcolor: theme.palette.mode === "dark" ? "rgba(143,163,143,0.16)" : "rgba(106,123,106,0.07)",
          borderColor: "primary.main",
        },
        transition: "all 0.15s",
      })}
    >
      <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.2, color: "primary.main" }}>
        {period.label}
      </Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.3 }}>
        {period.rangeLabel}
      </Typography>
      {missedCount > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.25 }}>
          <CardGiftcardOutlinedIcon sx={{ fontSize: 13, color: "secondary.main" }} />
          <Typography sx={{ fontSize: "0.7rem", color: "secondary.main", fontWeight: 600 }}>
            {missedCount} кред.
          </Typography>
        </Stack>
      )}
    </Button>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

function Schedule() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { status, logout, csrfToken } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay();
  const navItems = useAccountNavItems("/account/schedule");

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [credits, setCredits] = useState<DiscountCredit[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [existingSubs, setExistingSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [popover, setPopover] = useState<PopoverState>(null);
  const [buyPeriod, setBuyPeriod] = useState<PeriodInfo | null>(null);
  const [buySuccess, setBuySuccess] = useState(false);

  const today = useRef(new Date()).current;
  const periods = getPeriods(today);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [evts, absReqs, creds, cts, subs] = await Promise.all([
        getUserSchedule(),
        getUserAbsenceRequests(),
        getUserCredits(),
        getUserClassTypes(),
        getUserSubscriptions(),
      ]);
      setEvents(evts);
      setAbsenceRequests(absReqs);
      setCredits(creds);
      setClassTypes(cts);
      setExistingSubs(subs);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous") { router.replace("/"); return; }
    void loadAll();
  }, [status, router, loadAll]);

  const pendingWarningIds = new Set(
    absenceRequests.filter((r) => r.status === "pending").map((r) => r.booking_id),
  );

  const fcEvents: EventInput[] = events.map((e) => {
    const hasWarn = pendingWarningIds.has(e.booking_id) && e.booking_status === "confirmed";
    const colorKey = hasWarn ? "warned" : e.booking_status;
    return {
      id: e.booking_id,
      title: e.class_type_title,
      start: e.scheduled_at,
      end: e.ends_at,
      backgroundColor: STATUS_COLOR[colorKey] ?? "#9e9e9e",
      borderColor: "transparent",
      textColor: "#fff",
      extendedProps: e,
    };
  });

  const handleEventClick = useCallback((info: EventClickArg) => {
    setPopover({ anchor: info.el, event: info.event.extendedProps as ScheduleEvent });
  }, []);

  // Count missed days (no_show + absent) per class type for each period
  const missedTotal = events.filter(
    (e) => e.booking_status === "no_show" || e.booking_status === "absent",
  ).length;

  // Unused credits count (usable as discount on next purchase)
  const unusedCredits = credits.filter((c) => !c.is_used);
  const unusedCreditsTotal = unusedCredits.length;

  // Credits per period: for display purposes show total unused credits on each button
  const handleSuccess = async () => {
    setBuyPeriod(null);
    setBuySuccess(true);
    await loadAll();
    setTimeout(() => setBuySuccess(false), 4000);
  };

  if (status === "loading" || loading) {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh", px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 2.25 }}>
          <AccountSidebar
            navItems={navItems}
            onLogout={() => void logout().then(() => router.replace("/"))}
          />
        </Grid>

        {/* Content */}
        <Grid size={{ xs: 12, lg: 9.75 }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            <AccountPageHeader
              title="Мои занятия"
              subtitle="Расписание ваших offline-занятий"
              displayName={displayName}
              profileSubtitle={profileSubtitle}
              backHref="/account"
            />

            {/* Success banner */}
            {buySuccess && (
              <Alert severity="success" sx={{ borderRadius: 3 }}>
                Подписка успешно оформлена! Занятия добавлены в календарь.
              </Alert>
            )}

            {/* Calendar */}
            <CardShell>
              <Box
                sx={(theme) => ({
                  p: { xs: 1, md: 2.5 },
                  overflowX: "hidden",
                  "& .fc": { fontFamily: "inherit" },
                  "& .fc-toolbar-title": {
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: { xs: "1rem", md: "1.4rem" },
                    color: theme.palette.text.primary,
                  },
                  "& .fc-button": {
                    bgcolor: "#6a7b6a !important",
                    border: "none !important",
                    borderRadius: "10px !important",
                    px: "10px !important",
                    minHeight: "44px !important",
                    fontFamily: "inherit !important",
                    fontSize: "0.8125rem !important",
                  },
                  "& .fc-button:hover": { bgcolor: "#5a6b5a !important" },
                  "& .fc-button-active, & .fc-button-primary:not(:disabled):active": {
                    bgcolor: "#4a5b4a !important",
                  },
                  "& .fc-col-header-cell": { color: theme.palette.text.secondary },
                  "& .fc-event": { cursor: "pointer", borderRadius: "6px !important" },
                  "& .fc-daygrid-event": { px: "4px" },
                  // Dark mode — FullCalendar CSS variables + row overrides
                  ...(theme.palette.mode === "dark" && {
                    "& .fc": {
                      "--fc-page-bg-color": theme.palette.background.paper,
                      "--fc-neutral-bg-color": "rgba(143,163,143,0.07)",
                      "--fc-neutral-text-color": theme.palette.text.secondary,
                      "--fc-border-color": "rgba(143,163,143,0.18)",
                      "--fc-list-event-hover-bg-color": "rgba(143,163,143,0.12)",
                      "--fc-today-bg-color": "rgba(143,163,143,0.10)",
                    },
                    // Force all list-view cells to use readable colors
                    "& .fc-list-table td, & .fc-list-table th": {
                      background: `${theme.palette.background.paper} !important`,
                      color: `${theme.palette.text.primary} !important`,
                      borderColor: "rgba(143,163,143,0.15) !important",
                    },
                    "& .fc-list-event:hover td": {
                      background: "rgba(143,163,143,0.12) !important",
                    },
                    "& .fc-list-event-title a, & .fc-list-event-title": {
                      color: `${theme.palette.text.primary} !important`,
                    },
                    "& .fc-list-event-time": {
                      color: `${theme.palette.text.secondary} !important`,
                    },
                    "& .fc-list-day-cushion": {
                      background: "rgba(143,163,143,0.14) !important",
                    },
                    "& .fc-list-day-text, & .fc-list-day-side-text": {
                      color: `${theme.palette.text.primary} !important`,
                    },
                    // Grid/month view
                    "& .fc-daygrid-day": {
                      background: `${theme.palette.background.paper} !important`,
                    },
                    "& .fc-daygrid-day-number, & .fc-col-header-cell-cushion": {
                      color: `${theme.palette.text.primary} !important`,
                    },
                    "& .fc-scrollgrid, & .fc-theme-standard td, & .fc-theme-standard th": {
                      borderColor: "rgba(143,163,143,0.18) !important",
                    },
                  }),
                })}
              >
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                  locale={ruLocale}
                  initialView={isMobile ? "listMonth" : "dayGridMonth"}
                  headerToolbar={isMobile
                    ? { left: "prev,next", center: "title", right: "today" }
                    : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listMonth" }
                  }
                  buttonText={{ today: "Сегодня", month: "Месяц", week: "Неделя", list: "Список" }}
                  events={fcEvents}
                  eventClick={handleEventClick}
                  height="auto"
                  eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
                  noEventsContent={
                    <Stack sx={{ py: 6, alignItems: "center", gap: 1 }}>
                      <FitnessCenterOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography sx={{ color: "text.secondary" }}>Нет занятий</Typography>
                    </Stack>
                  }
                />
              </Box>
            </CardShell>

            {/* ── Buy subscription section ──────────────────────────────── */}
            <CardShell>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {/* Header */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2.5, gap: 1 }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: { xs: "1.375rem", md: "1.625rem" },
                        color: "text.primary",
                        lineHeight: 1.1,
                      }}
                    >
                      Купить подписку
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: "0.875rem", color: "text.secondary" }}>
                      Выберите период и получите доступ ко всем занятиям
                    </Typography>
                  </Box>

                  {/* Stats */}
                  <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
                    <Stack sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: unusedCreditsTotal > 0 ? "secondary.main" : "text.disabled", lineHeight: 1 }}>
                        {unusedCreditsTotal}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <CardGiftcardOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                          кредитов
                        </Typography>
                      </Stack>
                    </Stack>
                    <Box sx={{ width: "1px", bgcolor: "divider", alignSelf: "stretch" }} />
                    <Stack sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: missedTotal > 0 ? "#ef5350" : "text.disabled", lineHeight: 1 }}>
                        {missedTotal}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                        пропущено
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                {/* Period buttons */}
                {classTypes.length === 0 ? (
                  <Typography sx={{ color: "text.secondary", fontSize: "0.9375rem" }}>
                    Нет доступных типов занятий
                  </Typography>
                ) : (
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
                    {periods.map((p) => (
                      <PeriodCard
                        key={p.type}
                        period={p}
                        missedCount={unusedCreditsTotal}
                        onClick={() => setBuyPeriod(p)}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </CardShell>
          </Stack>
        </Grid>
      </Grid>

      <EventPopover
        state={popover}
        onClose={() => setPopover(null)}
        absenceRequests={absenceRequests}
        csrfToken={csrfToken}
        onAbsenceCreated={() => void loadAll()}
      />

      {buyPeriod && (
        <PurchaseDialog
          period={buyPeriod}
          classTypes={classTypes}
          existingSubs={existingSubs}
          credits={credits}
          onClose={() => setBuyPeriod(null)}
          onSuccess={() => void handleSuccess()}
        />
      )}
    </Box>
  );
}

export { Schedule };