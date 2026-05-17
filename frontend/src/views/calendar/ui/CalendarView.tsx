"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/model/auth-context";
import { readCsrfToken } from "@/shared/api/client";
import {
  confirmAttendance,
  createEvent,
  getEnrollments,
  getEvents,
  getTrainers,
  type Enrollment,
  type TrainerInfo,
  type TrainingEvent,
} from "@/shared/api/schedule";

const TrainingCalendar = dynamic(() => import("./TrainingCalendar"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <CircularProgress />
    </Box>
  ),
});

type CreateForm = {
  title: string;
  description: string;
  trainer_id: string;
  start_at: string;
  end_at: string;
  max_participants: string;
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#6a7b6a",
  completed: "#78909c",
  cancelled: "#c62828",
};

function CalendarView() {
  const router = useRouter();
  const { t } = useTranslation();
  const { status, user, csrfToken } = useAuth();

  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const [trainers, setTrainers] = useState<TrainerInfo[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>({
    title: "",
    description: "",
    trainer_id: "",
    start_at: "",
    end_at: "",
    max_participants: "",
  });

  const [selectedEvent, setSelectedEvent] = useState<TrainingEvent | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const isAdmin = user?.role === "admin";
  const isTrainerOrAdmin = user?.role === "trainer" || isAdmin;

  useEffect(() => {
    if (!isAdmin || status !== "authenticated") return;
    void getTrainers().catch(() => []).then(setTrainers);
  }, [isAdmin, status]);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/");
      return;
    }
    if (status === "authenticated" && user?.role === "user") {
      router.replace("/account/programs");
    }
  }, [status, user, router]);

  useEffect(() => {
    if (!dateRange || !isTrainerOrAdmin || status !== "authenticated") return;
    let cancelled = false;
    void getEvents({ start: dateRange.start, end: dateRange.end })
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch(() => { if (!cancelled) setEvents([]); });
    return () => { cancelled = true; };
  }, [dateRange, isTrainerOrAdmin, status]);

  const handleDatesSet = useCallback((start: string, end: string) => {
    setDateRange({ start, end });
  }, []);

  const handleDateSelect = useCallback(
    (start: string, end: string) => {
      if (!isAdmin) return;
      setCreateError(null);
      setCreateForm({
        title: "",
        description: "",
        trainer_id: user?.id ?? "",
        start_at: start.slice(0, 16),
        end_at: end.slice(0, 16),
        max_participants: "",
      });
      setCreateOpen(true);
    },
    [isAdmin, user],
  );

  const handleEventClick = useCallback(
    async (eventId: string) => {
      const event = events.find((e) => e.id === eventId) ?? null;
      setSelectedEvent(event);
      setEnrollments([]);
      if (!event || !isTrainerOrAdmin) return;
      setLoadingEnrollments(true);
      try {
        setEnrollments(await getEnrollments(eventId));
      } catch {
        setEnrollments([]);
      } finally {
        setLoadingEnrollments(false);
      }
    },
    [events, isTrainerOrAdmin],
  );

  const handleCreateSubmit = async () => {
    const token = csrfToken ?? readCsrfToken();
    if (!token) {
      setCreateError(t("calendar.csrfError"));
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await createEvent(
        {
          title: createForm.title.trim(),
          description: createForm.description.trim() || null,
          trainer_id: createForm.trainer_id,
          start_at: `${createForm.start_at}:00`,
          end_at: `${createForm.end_at}:00`,
          max_participants: createForm.max_participants ? Number(createForm.max_participants) : null,
        },
        token,
      );
      if (created) {
        setEvents((prev) => [...prev, created]);
        setCreateOpen(false);
      }
    } catch (err) {
      const e = err as Error & { message?: string };
      setCreateError(e.message ?? t("calendar.createError"));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleMarkAttendance = async (attended: boolean) => {
    const token = csrfToken ?? readCsrfToken();
    if (!selectedEvent || !token) return;
    const pendingEnrollments = enrollments.filter(
      (e) => e.status === "enrolled" || e.status === "notified_absent",
    );
    if (!pendingEnrollments.length) return;
    setAttendanceLoading(true);
    try {
      const updated = await confirmAttendance(
        selectedEvent.id,
        pendingEnrollments.map((e) => ({ enrollment_id: e.id, attended })),
        token,
      );
      setEnrollments((prev) =>
        prev.map((e) => updated.find((u) => u.id === e.id) ?? e),
      );
      setEvents((prev) =>
        prev.map((ev) => (ev.id === selectedEvent.id ? { ...ev, status: "completed" } : ev)),
      );
    } catch {
      // silent
    } finally {
      setAttendanceLoading(false);
    }
  };

  const calendarEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start_at,
        end: e.end_at,
        backgroundColor: STATUS_COLORS[e.status] ?? "#6a7b6a",
        borderColor: "transparent",
        extendedProps: { status: e.status, trainer_id: e.trainer_id },
      })),
    [events],
  );

  if (status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100dvh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh", px: { xs: 2, sm: 3, md: 5 }, py: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <IconButton
          component={Link}
          href="/main"
          aria-label={t("header.main")}
          sx={{
            color: "text.secondary",
            border: "1px solid rgba(62, 56, 47, 0.12)",
            borderRadius: "50%",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "rgba(184, 159, 116, 0.12)",
              borderColor: "rgba(184, 159, 116, 0.3)",
              color: "secondary.main",
            },
          }}
        >
          <HomeRoundedIcon sx={{ fontSize: "1.4rem" }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "text.primary", fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {t("calendar.title")}
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: "background.paper",
          borderRadius: 3,
          p: { xs: 1.5, sm: 2.5 },
          border: "1px solid rgba(62,56,47,0.08)",
          boxShadow: "0 4px 20px rgba(62,56,47,0.06)",
          "& .fc-button": {
            bgcolor: "primary.main !important",
            borderColor: "primary.main !important",
            textTransform: "none",
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: "0.875rem",
          },
          "& .fc-button-active, & .fc-button:focus": {
            bgcolor: "primary.dark !important",
            boxShadow: "none !important",
          },
          "& .fc-today-button": {
            opacity: 1,
          },
          "& .fc-col-header-cell": { fontWeight: 600, fontSize: "0.875rem" },
          "& .fc-timegrid-slot-label": { fontSize: "0.75rem", color: "text.secondary" },
          "& .fc-event": { borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 500 },
        }}
      >
        <TrainingCalendar
          events={calendarEvents}
          isAdmin={isAdmin}
          onDatesSet={handleDatesSet}
          onDateSelect={handleDateSelect}
          onEventClick={(id) => void handleEventClick(id)}
        />
      </Box>

      {/* Создать занятие */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("calendar.createEvent")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {createError && (
              <Typography variant="body2" color="error">{createError}</Typography>
            )}
            <TextField
              label={t("calendar.eventTitle")}
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              required
              fullWidth
              size="small"
            />
            <FormControl fullWidth size="small" required>
              <InputLabel>{t("calendar.eventTrainer")}</InputLabel>
              <Select
                value={createForm.trainer_id}
                label={t("calendar.eventTrainer")}
                onChange={(e) => setCreateForm((f) => ({ ...f, trainer_id: e.target.value }))}
                displayEmpty
              >
                {trainers.length === 0 && (
                  <MenuItem disabled value="">
                    <em>{t("calendar.noTrainers")}</em>
                  </MenuItem>
                )}
                {trainers.map((trainer) => {
                  const name = trainer.first_name || trainer.last_name
                    ? `${trainer.first_name ?? ""} ${trainer.last_name ?? ""}`.trim()
                    : null;
                  return (
                    <MenuItem key={trainer.user_id} value={trainer.user_id}>
                      <Box>
                        <Typography variant="body2" sx={{ lineHeight: 1.3 }}>
                          {name ?? trainer.user_id.slice(0, 8)}
                        </Typography>
                        {trainer.telegram_id && (
                          <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1 }}>
                            @{trainer.telegram_id}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <TextField
              label={t("calendar.eventStart")}
              type="datetime-local"
              value={createForm.start_at}
              onChange={(e) => setCreateForm((f) => ({ ...f, start_at: e.target.value }))}
              required
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={t("calendar.eventEnd")}
              type="datetime-local"
              value={createForm.end_at}
              onChange={(e) => setCreateForm((f) => ({ ...f, end_at: e.target.value }))}
              required
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={t("calendar.eventMaxParticipants")}
              type="number"
              value={createForm.max_participants}
              onChange={(e) => setCreateForm((f) => ({ ...f, max_participants: e.target.value }))}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <TextField
              label={t("calendar.eventDescription")}
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} size="small">
            {t("calendar.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => void handleCreateSubmit()}
            disabled={!createForm.title || !createForm.trainer_id || !createForm.start_at || !createForm.end_at || createLoading}
          >
            {createLoading ? <CircularProgress size={16} color="inherit" /> : t("calendar.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Детали занятия */}
      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{selectedEvent?.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            {selectedEvent?.description && (
              <Typography variant="body2" color="text.secondary">
                {selectedEvent.description}
              </Typography>
            )}
            <Typography variant="body2">
              <b>{t("calendar.eventStatus")}:</b>{" "}
              {selectedEvent ? t(`calendar.status.${selectedEvent.status}`, { defaultValue: selectedEvent.status }) : ""}
            </Typography>
            <Typography variant="body2">
              <b>{t("calendar.eventStart")}:</b>{" "}
              {selectedEvent ? new Date(selectedEvent.start_at).toLocaleString("ru-RU") : ""}
            </Typography>
            <Typography variant="body2">
              <b>{t("calendar.eventEnd")}:</b>{" "}
              {selectedEvent ? new Date(selectedEvent.end_at).toLocaleString("ru-RU") : ""}
            </Typography>
            {selectedEvent?.max_participants != null && (
              <Typography variant="body2">
                <b>{t("calendar.eventMaxParticipants")}:</b> {selectedEvent.max_participants}
              </Typography>
            )}

            {isTrainerOrAdmin && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {t("calendar.enrollments")}
                  {!loadingEnrollments && ` (${enrollments.length})`}
                </Typography>
                {loadingEnrollments ? (
                  <CircularProgress size={20} />
                ) : enrollments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("calendar.noEnrollments")}
                  </Typography>
                ) : (
                  <Stack spacing={0.5}>
                    {enrollments.map((enrollment) => (
                      <Box
                        key={enrollment.id}
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          bgcolor: "rgba(62,56,47,0.04)",
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {enrollment.user_id.slice(0, 8)}…
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              enrollment.status === "attended"
                                ? "success.main"
                                : enrollment.status === "missed"
                                  ? "error.main"
                                  : enrollment.status === "notified_absent"
                                    ? "warning.main"
                                    : "text.secondary",
                            fontWeight: 600,
                          }}
                        >
                          {t(`calendar.enrollmentStatus.${enrollment.status}`, { defaultValue: enrollment.status })}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}

                {isTrainerOrAdmin &&
                  selectedEvent?.status === "scheduled" &&
                  new Date(selectedEvent.end_at) < new Date() &&
                  enrollments.some((e) => e.status === "enrolled" || e.status === "notified_absent") && (
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={attendanceLoading}
                        onClick={() => void handleMarkAttendance(true)}
                      >
                        {t("calendar.markAllAttended")}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={attendanceLoading}
                        onClick={() => void handleMarkAttendance(false)}
                      >
                        {t("calendar.markAllAbsent")}
                      </Button>
                    </Stack>
                  )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button size="small" onClick={() => setSelectedEvent(null)}>
            {t("calendar.close")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export { CalendarView };
