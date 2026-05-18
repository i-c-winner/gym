"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";
import { getAdminSessions, getAdminClassTypes, getAdminUsers } from "@/shared/api/gym";
import type { AdminSession, ClassType, TrainerUser } from "@/shared/api/gym";
import type { EventClickArg, EventInput } from "@fullcalendar/core";

// ── Color palette for class types ─────────────────────────────────────────────

const PALETTE = [
  "#6a7b6a", "#b89f74", "#5c7a8a", "#8a6a7a",
  "#7a8a5c", "#6a6a8a", "#8a7a5c", "#5c8a7a",
];

const SESSION_STATUS_LABEL: Record<string, string> = {
  scheduled:  "Запланировано",
  completed:  "Завершено",
  cancelled:  "Отменено",
};
const SESSION_STATUS_OPACITY: Record<string, number> = {
  scheduled: 1,
  completed: 0.55,
  cancelled: 0.3,
};

// ── Event popover ─────────────────────────────────────────────────────────────

type PopoverState = { anchor: Element; session: AdminSession } | null;

function SessionPopover({ state, onClose }: { state: PopoverState; onClose: () => void }) {
  if (!state) return null;
  const s = state.session;
  const start = new Date(s.scheduled_at);
  const end = new Date(s.ends_at);
  return (
    <Popover
      open
      anchorEl={state.anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: { borderRadius: 3, p: 2, maxWidth: { xs: "90vw", sm: 270 }, boxShadow: "0 8px 24px rgba(62,56,47,0.13)" },
        },
      }}
    >
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "text.primary" }}>
          {s.class_type_title}
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            {start.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <PersonOutlineRoundedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            {s.trainer_name}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <GroupOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            до {s.max_participants} чел. · {s.duration_minutes} мин
          </Typography>
        </Stack>

        <Chip
          label={SESSION_STATUS_LABEL[s.status] ?? s.status}
          size="small"
          sx={{
            alignSelf: "flex-start",
            bgcolor:
              s.status === "completed" ? "#43a047" :
              s.status === "cancelled" ? "#bdbdbd" : "#6a7b6a",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      </Stack>
    </Popover>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

function AllSessions() {
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay();
  const navItems = useAccountNavItems("/account/create_calendar");

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [trainers, setTrainers] = useState<TrainerUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterClass, setFilterClass] = useState("");
  const [filterTrainer, setFilterTrainer] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [popover, setPopover] = useState<PopoverState>(null);

  // Admin guard
  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous" || user?.role !== "admin") {
      router.replace("/account");
    }
  }, [status, user, router]);

  // Color map: class_type_id → color
  const colorMap = useCallback(
    (id: string) => {
      const idx = classTypes.findIndex((ct) => ct.id === id);
      return PALETTE[idx % PALETTE.length] ?? PALETTE[0];
    },
    [classTypes],
  );

  // Load metadata once
  useEffect(() => {
    if (status !== "authenticated" || user?.role !== "admin") return;
    Promise.all([
      getAdminClassTypes(true),
      getAdminUsers(),
    ]).then(([cts, users]) => {
      setClassTypes(cts);
      setTrainers(users.filter((u) => u.role === "trainer" || u.role === "admin"));
    }).catch(() => {});
  }, [status, user]);

  // Load sessions when filters change
  useEffect(() => {
    if (status !== "authenticated" || user?.role !== "admin") return;
    setLoading(true);
    getAdminSessions({
      class_type_id: filterClass || undefined,
      trainer_id: filterTrainer || undefined,
    })
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [status, user, filterClass, filterTrainer]);

  const fcEvents: EventInput[] = sessions.map((s) => {
    const color = colorMap(s.class_type_id);
    const opacity = SESSION_STATUS_OPACITY[s.status] ?? 1;
    return {
      id: s.session_id,
      title: s.class_type_title,
      start: s.scheduled_at,
      end: s.ends_at,
      backgroundColor: color,
      borderColor: "transparent",
      textColor: "#fff",
      opacity,
      extendedProps: s,
    };
  });

  const handleEventClick = useCallback((info: EventClickArg) => {
    setPopover({ anchor: info.el, session: info.event.extendedProps as AdminSession });
  }, []);

  if (status === "loading") {
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
              title="Все занятия"
              subtitle="Полное расписание по всем типам занятий"
              displayName={displayName}
              profileSubtitle={profileSubtitle}
              backHref="/account/create_calendar"
            />

            <CardShell>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {/* Filters */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
                    <InputLabel>Тип занятия</InputLabel>
                    <Select
                      value={filterClass}
                      label="Тип занятия"
                      onChange={(e) => setFilterClass(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">Все занятия</MenuItem>
                      {classTypes.map((ct) => (
                        <MenuItem key={ct.id} value={ct.id}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Box
                              sx={{
                                width: 10, height: 10, borderRadius: "50%",
                                bgcolor: colorMap(ct.id), flexShrink: 0,
                              }}
                            />
                            {ct.title}
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
                    <InputLabel>Тренер</InputLabel>
                    <Select
                      value={filterTrainer}
                      label="Тренер"
                      onChange={(e) => setFilterTrainer(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">Все тренеры</MenuItem>
                      {trainers.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {[t.first_name, t.last_name].filter(Boolean).join(" ") || t.telephone || t.id.slice(0, 8)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {(filterClass || filterTrainer) && (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Chip
                        label="Сбросить фильтры"
                        size="small"
                        onDelete={() => { setFilterClass(""); setFilterTrainer(""); }}
                        sx={{ borderRadius: 2 }}
                      />
                    </Box>
                  )}
                </Stack>

                {/* Color legend */}
                {!filterClass && classTypes.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2.5 }}>
                    {classTypes.map((ct) => (
                      <Chip
                        key={ct.id}
                        label={ct.title}
                        size="small"
                        onClick={() => setFilterClass(ct.id)}
                        sx={{
                          cursor: "pointer",
                          bgcolor: colorMap(ct.id),
                          color: "#fff",
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          "&:hover": { opacity: 0.85 },
                        }}
                      />
                    ))}
                  </Stack>
                )}

                {/* Calendar */}
                <Box
                  sx={{
                    position: "relative",
                    overflowX: "hidden",
                    "& .fc": { fontFamily: "inherit" },
                    "& .fc-toolbar-title": {
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: { xs: "1rem", md: "1.4rem" },
                      color: "#2f2a24",
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
                    "& .fc-col-header-cell": { color: "#5f584f" },
                    "& .fc-event": { cursor: "pointer", borderRadius: "6px !important" },
                    "& .fc-daygrid-event": { px: "4px" },
                  }}
                >
                  {loading && (
                    <Box
                      sx={{
                        position: "absolute", inset: 0, zIndex: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        bgcolor: "rgba(255,253,248,0.7)", borderRadius: 2,
                      }}
                    >
                      <CircularProgress size={36} />
                    </Box>
                  )}
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
                        <Typography sx={{ color: "text.secondary" }}>
                          {loading ? "" : "Нет занятий для выбранных фильтров"}
                        </Typography>
                      </Stack>
                    }
                  />
                </Box>
              </Box>
            </CardShell>
          </Stack>
        </Grid>
      </Grid>

      <SessionPopover state={popover} onClose={() => setPopover(null)} />
    </Box>
  );
}

export { AllSessions };