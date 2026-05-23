"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";
import { BOOKING_STATUS_COLOR } from "@/shared/config/bookingStatus";
import { getPeriods } from "@/shared/lib/schedulePeriods";
import { EventPopover, type PopoverState } from "@/widgets/schedule/ui/EventPopover";
import { PeriodCard } from "@/widgets/schedule/ui/PeriodCard";
import { PurchaseDialog } from "@/widgets/schedule/ui/PurchaseDialog";
import {
  getUserSchedule,
  getUserCredits,
  getUserClassTypes,
  getUserSubscriptions,
  getUserAbsenceRequests,
  type ScheduleEvent,
  type DiscountCredit,
  type AbsenceRequest,
  type ClassType,
  type Subscription,
} from "@/shared/api/gym";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import type { PeriodInfo } from "@/shared/lib/schedulePeriods";

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
      backgroundColor: BOOKING_STATUS_COLOR[colorKey] ?? "#9e9e9e",
      borderColor: "transparent",
      textColor: "#fff",
      extendedProps: e,
    };
  });

  const handleEventClick = useCallback((info: EventClickArg) => {
    setPopover({ anchor: info.el, event: info.event.extendedProps as ScheduleEvent });
  }, []);

  const missedTotal = events.filter(
    (e) => e.booking_status === "no_show" || e.booking_status === "absent",
  ).length;

  const unusedCreditsTotal = credits.filter((c) => !c.is_used).length;

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
        <Grid size={{ xs: 12, lg: 2.25 }}>
          <AccountSidebar
            navItems={navItems}
            onLogout={() => void logout().then(() => router.replace("/"))}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 9.75 }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            <AccountPageHeader
              title="Мои занятия"
              subtitle="Расписание ваших offline-занятий"
              displayName={displayName}
              profileSubtitle={profileSubtitle}
              backHref="/account"
            />

            {buySuccess && (
              <Alert severity="success" sx={{ borderRadius: 3 }}>
                Подписка успешно оформлена! Занятия добавлены в календарь.
              </Alert>
            )}

            {/* Основной календарь */}
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
                  ...(theme.palette.mode === "dark" && {
                    "& .fc": {
                      "--fc-page-bg-color": theme.palette.background.paper,
                      "--fc-neutral-bg-color": "rgba(143,163,143,0.07)",
                      "--fc-neutral-text-color": theme.palette.text.secondary,
                      "--fc-border-color": "rgba(143,163,143,0.18)",
                      "--fc-list-event-hover-bg-color": "rgba(143,163,143,0.12)",
                      "--fc-today-bg-color": "rgba(143,163,143,0.10)",
                    },
                    "& .fc-list-table td, & .fc-list-table th": {
                      background: `${theme.palette.background.paper} !important`,
                      color: `${theme.palette.text.primary} !important`,
                      borderColor: "rgba(143,163,143,0.15) !important",
                    },
                    "& .fc-list-event:hover td": { background: "rgba(143,163,143,0.12) !important" },
                    "& .fc-list-event-title a, & .fc-list-event-title": {
                      color: `${theme.palette.text.primary} !important`,
                    },
                    "& .fc-list-event-time": { color: `${theme.palette.text.secondary} !important` },
                    "& .fc-list-day-cushion": { background: "rgba(143,163,143,0.14) !important" },
                    "& .fc-list-day-text, & .fc-list-day-side-text": {
                      color: `${theme.palette.text.primary} !important`,
                    },
                    "& .fc-daygrid-day": { background: `${theme.palette.background.paper} !important` },
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

            {/* Секция покупки подписки */}
            <CardShell>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
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

                  <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
                    <Stack sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: unusedCreditsTotal > 0 ? "secondary.main" : "text.disabled", lineHeight: 1 }}>
                        {unusedCreditsTotal}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <CardGiftcardOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>кредитов</Typography>
                      </Stack>
                    </Stack>
                    <Box sx={{ width: "1px", bgcolor: "divider", alignSelf: "stretch" }} />
                    <Stack sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: missedTotal > 0 ? "#ef5350" : "text.disabled", lineHeight: 1 }}>
                        {missedTotal}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>пропущено</Typography>
                    </Stack>
                  </Stack>
                </Stack>

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
