"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme, useMediaQuery } from "@mui/material";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  GlobalStyles,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import type { EventInput } from "@fullcalendar/core";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";
import {
  getAdminSessionsStats,
  getAdminSessionParticipants,
  type SessionStat,
  type SessionParticipant,
} from "@/shared/api/gym";

// ── Цвета ─────────────────────────────────────────────────────────────────────

const COLOR_ATTENDED = "#43a047";
const COLOR_MISSED   = "#ef5350";
const COLOR_UNMARKED = "#f9a825";
const COLOR_UPCOMING = "#6a7b6a";
const COLOR_NEUTRAL  = "#8a9a8a";

function sessionColor(s: SessionStat): string {
  const isPast = new Date(s.scheduled_at) < new Date();
  if (!isPast) return COLOR_UPCOMING;
  if (s.booked_count === 0) return COLOR_NEUTRAL;
  if (s.attended_count === s.booked_count) return COLOR_ATTENDED;
  if (s.attended_count > 0) return COLOR_UNMARKED;
  return COLOR_MISSED;
}

function sessionToFcEvent(s: SessionStat): EventInput {
  return {
    id: s.session_id,
    title: s.class_type_title,
    start: s.scheduled_at,
    end: s.ends_at,
    backgroundColor: sessionColor(s),
    borderColor: "transparent",
    extendedProps: s,
  };
}

// ── Легенда ───────────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>{label}</Typography>
    </Stack>
  );
}

// ── Статус бронирования ───────────────────────────────────────────────────────

function bookingStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "attended")  return "Посетил";
  if (s === "absent" || s === "no_show") return "Не пришёл";
  if (s === "confirmed") return "Записан";
  return status;
}

function bookingStatusColor(status: string): "success" | "error" | "warning" | "default" {
  const s = status.toLowerCase();
  if (s === "attended") return "success";
  if (s === "absent" || s === "no_show") return "error";
  if (s === "confirmed") return "warning";
  return "default";
}

// ── Стили FullCalendar ────────────────────────────────────────────────────────

const fcStyles = (
  isDark: boolean,
  paperBg: string,
  textPrimary: string,
  textSecondary: string
) => ({
  "& .fc": { fontFamily: "inherit" },
  "& .fc-toolbar-title": {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "clamp(1rem, 2vw, 1.4rem)",
    color: textPrimary,
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
  "& .fc-button-active, & .fc-button-primary:not(:disabled):active": { bgcolor: "#4a5b4a !important" },
  "& .fc-col-header-cell": { color: textSecondary },
  "& .fc-event": { cursor: "pointer", borderRadius: "6px !important" },
  "& .fc-daygrid-event": { px: "4px" },
  ...(isDark && {
    "& .fc": {
      "--fc-page-bg-color": paperBg,
      "--fc-neutral-bg-color": "rgba(143,163,143,0.07)",
      "--fc-neutral-text-color": textSecondary,
      "--fc-border-color": "rgba(143,163,143,0.18)",
      "--fc-list-event-hover-bg-color": "rgba(143,163,143,0.12)",
      "--fc-today-bg-color": "rgba(143,163,143,0.10)",
    },
    "& .fc-list-table td, & .fc-list-table th": {
      background: `${paperBg} !important`,
      color: `${textPrimary} !important`,
      borderColor: "rgba(143,163,143,0.15) !important",
    },
    "& .fc-list-event:hover td": { background: "rgba(143,163,143,0.12) !important" },
    "& .fc-list-event-title a, & .fc-list-event-title": { color: `${textPrimary} !important` },
    "& .fc-list-event-time": { color: `${textSecondary} !important` },
    "& .fc-list-day-cushion": { background: "rgba(143,163,143,0.14) !important" },
    "& .fc-list-day-text, & .fc-list-day-side-text": { color: `${textPrimary} !important` },
    "& .fc-daygrid-day": { background: `${paperBg} !important` },
    "& .fc-daygrid-day-number, & .fc-col-header-cell-cushion": { color: `${textPrimary} !important` },
    "& .fc-scrollgrid, & .fc-theme-standard td, & .fc-theme-standard th": {
      borderColor: "rgba(143,163,143,0.18) !important",
    },
  }),
});

// ── Диалог участников ─────────────────────────────────────────────────────────

type DialogState = {
  sessionId: string;
  title: string;
  subtitle: string;
};

function ParticipantsDialog({
  state,
  onClose,
}: {
  state: DialogState;
  onClose: () => void;
}) {
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    getAdminSessionParticipants(state.sessionId)
      .then(setParticipants)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [state.sessionId]);

  const attended = participants.filter(p => p.booking_status.toLowerCase() === "attended").length;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", fontWeight: 600, color: "text.primary" }}>
              {state.title}
            </Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary", mt: 0.25 }}>
              {state.subtitle}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -1 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 1.5, pb: 2 }}>
        {loading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : err ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>
        ) : participants.length === 0 ? (
          <Stack sx={{ py: 4, alignItems: "center", gap: 1 }}>
            <GroupOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
            <Typography sx={{ color: "text.secondary" }}>Нет записавшихся</Typography>
          </Stack>
        ) : (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 1.5, px: 0.5 }}>
              <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
                Записано: <strong>{participants.length}</strong>
              </Typography>
              <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
                Посетило: <strong style={{ color: COLOR_ATTENDED }}>{attended}</strong>
              </Typography>
            </Stack>

            <List disablePadding>
              {participants.map((p, i) => (
                <Box key={p.booking_id}>
                  {i > 0 && <Divider component="li" />}
                  <ListItem
                    sx={{ py: 1, px: 0.5 }}
                    secondaryAction={
                      <Chip
                        label={bookingStatusLabel(p.booking_status)}
                        color={bookingStatusColor(p.booking_status)}
                        size="small"
                        sx={{ fontSize: "0.6875rem", height: 22 }}
                      />
                    }
                  >
                    <ListItemText
                      primary={p.user_name}
                      secondary={p.telephone ?? undefined}
                      slotProps={{
                        primary: { style: { fontSize: "0.9rem" } },
                        secondary: { style: { fontSize: "0.8125rem" } },
                      }}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────

function VisitsPage() {
  const router = useRouter();
  const muiTheme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const isDark = muiTheme.palette.mode === "dark";
  const { status, user, logout } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay();
  const navItems = useAccountNavItems("/account/visits");

  const isAdmin = user?.role === "admin";

  const [sessions, setSessions]       = useState<SessionStat[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  // Редирект
  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous") { router.replace("/"); return; }
    if (status === "authenticated" && !isAdmin) { router.replace("/account"); return; }
  }, [status, isAdmin, router]);

  // Загрузка данных
  useEffect(() => {
    if (status !== "authenticated" || !isAdmin) return;
    setLoading(true);
    setError(null);
    getAdminSessionsStats()
      .then(setSessions)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [status, isAdmin]);

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const paperBg       = muiTheme.palette.background.paper;
  const textPrimary   = muiTheme.palette.text.primary;
  const textSecondary = muiTheme.palette.text.secondary;

  const fcEvents: EventInput[] = sessions.map(sessionToFcEvent);

  return (
    <>
    <GlobalStyles styles={{
      "@keyframes fc-marquee": {
        "0%":   { transform: "translateX(0)" },
        "100%": { transform: "translateX(var(--marquee-offset, -80px))" },
      },
    }} />
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
              title="Посещения"
              subtitle="Сводный календарь посещаемости занятий"
              displayName={displayName}
              profileSubtitle={profileSubtitle}
              backHref="/account"
            />

            {error && (
              <Alert severity="error" sx={{ borderRadius: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Легенда */}
            <CardShell>
              <Box sx={{ px: { xs: 2, md: 3 }, py: 1.75 }}>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: { xs: 1.5, sm: 3 } }}>
                  <LegendDot color={COLOR_ATTENDED} label="Все посетили" />
                  <LegendDot color={COLOR_MISSED}   label="Никто не пришёл" />
                  <LegendDot color={COLOR_UNMARKED} label="Частично" />
                  <LegendDot color={COLOR_UPCOMING} label="Предстоящее занятие" />
                  <LegendDot color={COLOR_NEUTRAL}  label="Нет записей" />
                </Stack>
              </Box>
            </CardShell>

            {/* Календарь */}
            <CardShell>
              <Box sx={{ p: { xs: 1, md: 2.5 }, overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}>
                <Box sx={{ minWidth: 750, ...fcStyles(isDark, paperBg, textPrimary, textSecondary) }}>
                  {loading ? (
                    <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                      locale={ruLocale}
                      initialView="dayGridMonth"
                      headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listMonth" }}
                      buttonText={{ today: "Сегодня", month: "Месяц", week: "Неделя", list: "Список" }}
                      events={fcEvents}
                      height="auto"
                      eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
                      eventContent={(arg) => {
                        const s = arg.event.extendedProps as SessionStat;
                        const isPast = new Date(s.scheduled_at) < new Date();
                        const dt = new Date(s.scheduled_at);
                        const timeStr = dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <Box sx={{ px: 0.5, py: 0.125, lineHeight: 1.25, width: "100%", overflow: "hidden" }}>
                            <Typography
                              component="div"
                              sx={{ fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {timeStr} {s.class_type_title}
                            </Typography>
                            <Typography component="div" sx={{ fontSize: "0.6875rem", opacity: 0.88, whiteSpace: "nowrap" }}>
                              {isPast
                                ? `${s.booked_count} зап · ${s.attended_count} пос`
                                : `${s.booked_count} записано`}
                            </Typography>
                          </Box>
                        );
                      }}
                      eventClick={(info) => {
                        const s = info.event.extendedProps as SessionStat;
                        const dt = new Date(s.scheduled_at);
                        const dateStr = dt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
                        const timeStr = dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
                        setDialogState({
                          sessionId: s.session_id,
                          title: s.class_type_title,
                          subtitle: `${dateStr}, ${timeStr}`,
                        });
                      }}
                      noEventsContent={
                        <Stack sx={{ py: 6, alignItems: "center", gap: 1 }}>
                          <CalendarMonthOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                          <Typography sx={{ color: "text.secondary" }}>
                            Нет занятий на этот период
                          </Typography>
                        </Stack>
                      }
                    />
                  )}
                </Box>
              </Box>
            </CardShell>
          </Stack>
        </Grid>
      </Grid>
    </Box>

    {dialogState && (
      <ParticipantsDialog
        state={dialogState}
        onClose={() => setDialogState(null)}
      />
    )}
    </>
  );
}

export { VisitsPage };
