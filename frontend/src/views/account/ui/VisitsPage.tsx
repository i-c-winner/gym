"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme, useMediaQuery } from "@mui/material";
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import type { EventInput } from "@fullcalendar/core";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";
import {
  getAdminUsers,
  getAdminUserSchedule,
  type TrainerUser,
  type ScheduleEvent,
} from "@/shared/api/gym";

// ── Цвета ─────────────────────────────────────────────────────────────────────

const COLOR_ATTENDED = "#43a047"; // зелёный  — тренер отметил посещение
const COLOR_MISSED   = "#ef5350"; // красный  — тренер отметил отсутствие
const COLOR_UNMARKED = "#f9a825"; // жёлтый   — прошедшее, не отмечено

function eventColor(ev: ScheduleEvent): string {
  const isPast = new Date(ev.scheduled_at) < new Date();
  if (ev.booking_status === "attended") return COLOR_ATTENDED;
  if (ev.booking_status === "absent" || ev.booking_status === "no_show") return COLOR_MISSED;
  if (ev.booking_status === "confirmed" && isPast) return COLOR_UNMARKED;
  return COLOR_ATTENDED; // предстоящие — нейтрально зелёные
}

function toFcEvent(ev: ScheduleEvent): EventInput | null {
  if (ev.booking_status === "cancelled") return null;
  const color = eventColor(ev);
  return {
    id: ev.booking_id,
    title: ev.class_type_title,
    start: ev.scheduled_at,
    end: ev.ends_at,
    backgroundColor: color,
    borderColor: "transparent",
    textColor: "#fff",
    extendedProps: ev,
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

// ── Стили FullCalendar ────────────────────────────────────────────────────────

const fcStyles = (
  isDark: boolean,
  paperBg: string,
  textPrimary: string,
  textSecondary: string,
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
  "& .fc-button-active, & .fc-button-primary:not(:disabled):active": {
    bgcolor: "#4a5b4a !important",
  },
  "& .fc-col-header-cell": { color: textSecondary },
  "& .fc-event": { cursor: "default", borderRadius: "6px !important" },
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

// ── Отображение имени пользователя ────────────────────────────────────────────

function userLabel(u: TrainerUser): string {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
  if (name && u.telephone) return `${name} · ${u.telephone}`;
  return name || u.telephone || u.id;
}

// ── Компонент ─────────────────────────────────────────────────────────────────

function VisitsPage() {
  const router   = useRouter();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const isDark   = muiTheme.palette.mode === "dark";
  const { status, user, logout } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay();
  const navItems = useAccountNavItems("/account/visits");

  const isAdmin = user?.role === "admin";

  const [users,         setUsers]         = useState<TrainerUser[]>([]);
  const [selectedId,    setSelectedId]    = useState<string>("");
  const [events,        setEvents]        = useState<ScheduleEvent[]>([]);
  const [loadingUsers,  setLoadingUsers]  = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Редирект
  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous") { router.replace("/"); return; }
    if (status === "authenticated" && !isAdmin) { router.replace("/account"); return; }
  }, [status, isAdmin, router]);

  // Загружаем список пользователей
  useEffect(() => {
    if (status !== "authenticated" || !isAdmin) return;
    setLoadingUsers(true);
    getAdminUsers()
      .then(setUsers)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка загрузки пользователей"))
      .finally(() => setLoadingUsers(false));
  }, [status, isAdmin]);

  // Загружаем расписание выбранного пользователя
  const loadSchedule = useCallback(async (userId: string) => {
    setLoadingEvents(true);
    setError(null);
    try {
      const data = await getAdminUserSchedule(userId);
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки расписания");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) { setEvents([]); return; }
    void loadSchedule(selectedId);
  }, [selectedId, loadSchedule]);

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

  const fcEvents: EventInput[] = events
    .map(toFcEvent)
    .filter((e): e is EventInput => e !== null);

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

            {/* Селект пользователя */}
            <CardShell>
              <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
                <FormControl fullWidth size="small" disabled={loadingUsers}>
                  <InputLabel id="user-select-label">
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                      <PersonOutlineOutlinedIcon sx={{ fontSize: "1rem" }} />
                      <span>Выберите пользователя</span>
                    </Stack>
                  </InputLabel>
                  <Select
                    labelId="user-select-label"
                    value={selectedId}
                    label={
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <PersonOutlineOutlinedIcon sx={{ fontSize: "1rem" }} />
                        <span>Выберите пользователя</span>
                      </Stack>
                    }
                    onChange={(e) => setSelectedId(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {loadingUsers ? (
                      <MenuItem disabled value="">
                        <CircularProgress size={16} sx={{ mr: 1 }} /> Загрузка...
                      </MenuItem>
                    ) : (
                      users.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                          {userLabel(u)}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>
            </CardShell>

            {/* Легенда */}
            {selectedId && (
              <CardShell>
                <Box sx={{ px: { xs: 2, md: 3 }, py: 1.75 }}>
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: { xs: 1.5, sm: 3 } }}>
                    <LegendDot color={COLOR_ATTENDED} label="Посетил" />
                    <LegendDot color={COLOR_MISSED}   label="Не пришёл" />
                    <LegendDot color={COLOR_UNMARKED} label="Тренер не отметил" />
                  </Stack>
                </Box>
              </CardShell>
            )}

            {/* Календарь */}
            <CardShell>
              <Box
                sx={{
                  p: { xs: 1, md: 2.5 },
                  overflowX: "hidden",
                  ...fcStyles(isDark, paperBg, textPrimary, textSecondary),
                }}
              >
                {loadingEvents ? (
                  <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    locale={ruLocale}
                    initialView={isMobile ? "listMonth" : "dayGridMonth"}
                    headerToolbar={
                      isMobile
                        ? { left: "prev,next", center: "title", right: "today" }
                        : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listMonth" }
                    }
                    buttonText={{ today: "Сегодня", month: "Месяц", week: "Неделя", list: "Список" }}
                    events={fcEvents}
                    height="auto"
                    eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
                    noEventsContent={
                      <Stack sx={{ py: 6, alignItems: "center", gap: 1 }}>
                        <CalendarMonthOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography sx={{ color: "text.secondary" }}>
                          {selectedId
                            ? "Нет занятий на этот период"
                            : "Выберите пользователя для просмотра посещений"}
                        </Typography>
                      </Stack>
                    }
                  />
                )}
              </Box>
            </CardShell>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export { VisitsPage };
