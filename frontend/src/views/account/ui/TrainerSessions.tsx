"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery, useTheme } from "@mui/material";
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
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";
import {
  getTrainerPastSessions,
  getTrainerUpcomingSessions,
  getSessionParticipants,
  getTrainerAbsenceRequests,
  markAttendance,
  getUserClassTypes,
  type TrainerSession,
  type SessionParticipant,
  type AbsenceRequest,
  type ClassType,
} from "@/shared/api/gym";

// ── Booking status labels / colors ────────────────────────────────────────────

const BOOKING_STATUS_LABEL: Record<string, string> = {
  confirmed:  "Записан",
  absent:     "Отсутствовал",
  cancelled:  "Отменено",
  no_show:    "Не явился",
  attended:   "Посетил",
};
const BOOKING_STATUS_COLOR: Record<string, string> = {
  confirmed:  "#6a7b6a",
  absent:     "#9e9e9e",
  cancelled:  "#bdbdbd",
  no_show:    "#ef5350",
  attended:   "#43a047",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// ── Session card ──────────────────────────────────────────────────────────────

function SessionCard({
  session,
  classTypeTitle,
  warnedCount,
  isPast,
  onClick,
}: {
  session: TrainerSession;
  classTypeTitle: string;
  warnedCount: number;
  isPast: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={(theme) => ({
        p: 2,
        borderRadius: 3,
        border: `1.5px solid ${theme.palette.mode === "dark" ? "rgba(143,163,143,0.20)" : "rgba(106,123,106,0.20)"}`,
        bgcolor: theme.palette.mode === "dark" ? "background.paper" : "rgba(255,253,248,0.8)",
        cursor: "pointer",
        transition: "all 0.15s",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: theme.palette.mode === "dark" ? "rgba(143,163,143,0.10)" : "rgba(106,123,106,0.05)",
        },
      })}
    >
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" }, gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: "text.primary", mb: 0.5 }}>
            {classTypeTitle}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.5 }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
              {formatDateTime(session.scheduled_at)} – {formatTime(session.ends_at)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <GroupOutlinedIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
              до {session.max_participants_snapshot} чел. · {session.duration_minutes_snapshot} мин
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={session.status === "completed" ? "Завершено" : "Запланировано"}
            size="small"
            sx={{
              bgcolor: session.status === "completed" ? "#6a7b6a" : "#b89f74",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
          {warnedCount > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <WarningAmberRoundedIcon sx={{ fontSize: 14, color: "#b89f74" }} />
              <Typography sx={{ fontSize: "0.75rem", color: "#b89f74", fontWeight: 600 }}>
                {warnedCount} предупр.
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>

      <Box sx={{ mt: 1.5, textAlign: "right" }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600 }}>
          {isPast ? "Отметить явку →" : "Посмотреть участников →"}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Attendance dialog ─────────────────────────────────────────────────────────

function AttendanceDialog({
  session,
  classTypeTitle,
  absenceRequests,
  csrfToken,
  onClose,
  onSaved,
}: {
  session: TrainerSession;
  classTypeTitle: string;
  absenceRequests: AbsenceRequest[];
  csrfToken: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<Record<string, boolean | null>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isPast = session.status === "completed";

  // Warning booking ids for this session
  const warnedBookingIds = new Set(
    absenceRequests
      .filter((r) => r.status === "pending")
      .map((r) => r.booking_id),
  );

  useEffect(() => {
    getSessionParticipants(session.id)
      .then((list) => {
        setParticipants(list);
        // Pre-fill marks from existing booking status
        const initial: Record<string, boolean | null> = {};
        for (const p of list) {
          if (p.status === "attended") initial[p.id] = true;
          else if (p.status === "no_show" || p.status === "absent") initial[p.id] = false;
          else initial[p.id] = null; // unset
        }
        setMarks(initial);
      })
      .catch(() => setError("Не удалось загрузить участников"))
      .finally(() => setLoading(false));
  }, [session.id]);

  const handleMark = (bookingId: string, attended: boolean | null) => {
    setMarks((prev) => ({ ...prev, [bookingId]: attended }));
  };

  const handleSave = async () => {
    if (!csrfToken) return;
    const toMark = Object.entries(marks)
      .filter(([, v]) => v !== null)
      .map(([id, attended]) => ({ booking_id: id, attended: attended as boolean }));
    if (!toMark.length) { onClose(); return; }
    setSaving(true);
    setError(null);
    try {
      await markAttendance(session.id, toMark, csrfToken);
      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 1000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const participantName = (p: SessionParticipant) =>
    [p.user_first_name, p.user_last_name].filter(Boolean).join(" ") || p.user_telephone || "—";

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: 4 }, p: 0.5, m: { xs: 0, sm: 2 }, maxHeight: { xs: "100dvh", sm: "90dvh" }, alignSelf: { xs: "flex-end", sm: "center" } } } }}>
      <DialogTitle sx={{ fontFamily: "Georgia, serif", fontSize: "1.25rem", pb: 0.5 }}>
        {classTypeTitle}
        <Typography component="span" sx={{ display: "block", fontSize: "0.8125rem", color: "text.secondary", fontFamily: "inherit", fontWeight: 400, mt: 0.25 }}>
          {formatDateTime(session.scheduled_at)} – {formatTime(session.ends_at)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {loading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        ) : participants.length === 0 ? (
          <Typography sx={{ color: "text.secondary", py: 2, textAlign: "center" }}>
            Нет участников
          </Typography>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            {participants.map((p, i) => {
              const hasWarning = warnedBookingIds.has(p.id);
              const alreadyResolved = p.status !== "confirmed";
              const mark = marks[p.id];

              return (
                <Box key={p.id}>
                  {i > 0 && <Divider sx={{ mb: 1.5 }} />}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <PersonOutlineRoundedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                        <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          {participantName(p)}
                        </Typography>
                        {hasWarning && (
                          <Chip
                            label="Предупредил"
                            size="small"
                            icon={<WarningAmberRoundedIcon sx={{ fontSize: "12px !important" }} />}
                            sx={{ bgcolor: "rgba(184,159,116,0.12)", color: "#b89f74", fontSize: "0.7rem", fontWeight: 600, height: 20 }}
                          />
                        )}
                      </Stack>
                      {p.user_telephone && (
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25, pl: 2.75 }}>
                          {p.user_telephone}
                        </Typography>
                      )}
                      {alreadyResolved && (
                        <Chip
                          label={BOOKING_STATUS_LABEL[p.status] ?? p.status}
                          size="small"
                          sx={{
                            mt: 0.5, ml: 2.75,
                            bgcolor: BOOKING_STATUS_COLOR[p.status] ?? "#9e9e9e",
                            color: "#fff",
                            fontSize: "0.7rem",
                            height: 20,
                          }}
                        />
                      )}
                    </Box>

                    {/* Mark toggle — only for past sessions and unresolved bookings */}
                    {isPast && !alreadyResolved && (
                      <ToggleButtonGroup
                        exclusive
                        value={mark === null ? null : mark ? "yes" : "no"}
                        onChange={(_, v) => handleMark(p.id, v === null ? null : v === "yes")}
                        sx={{ flexShrink: 0 }}
                      >
                        <ToggleButton
                          value="yes"
                          sx={{
                            fontSize: "0.75rem", px: 1.5, minHeight: 44, borderRadius: "8px 0 0 8px",
                            "&.Mui-selected": { bgcolor: "#43a047", color: "#fff", "&:hover": { bgcolor: "#388e3c" } },
                          }}
                        >
                          <CheckCircleOutlineRoundedIcon sx={{ fontSize: 15, mr: 0.5 }} />
                          Был
                        </ToggleButton>
                        <ToggleButton
                          value="no"
                          sx={{
                            fontSize: "0.75rem", px: 1.5, minHeight: 44, borderRadius: "0 8px 8px 0",
                            "&.Mui-selected": {
                              bgcolor: hasWarning ? "#9e9e9e" : "#ef5350",
                              color: "#fff",
                              "&:hover": { bgcolor: hasWarning ? "#757575" : "#e53935" },
                            },
                          }}
                        >
                          <CancelOutlinedIcon sx={{ fontSize: 15, mr: 0.5 }} />
                          Не был
                        </ToggleButton>
                      </ToggleButtonGroup>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}

        {saved && (
          <Alert severity="success" sx={{ borderRadius: 2, mt: 2 }}>
            Явка сохранена
          </Alert>
        )}
        {error && !loading && (
          <Alert severity="error" sx={{ borderRadius: 2, mt: 2 }}>{error}</Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ borderRadius: 3, color: "text.secondary" }}>
          Закрыть
        </Button>
        {isPast && (
          <Button
            onClick={() => void handleSave()}
            disabled={saving || saved || !csrfToken}
            variant="contained"
            sx={{ borderRadius: 3, px: 3 }}
          >
            {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Сохранить"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

function TrainerSessions() {
  const router = useRouter();
  const { status, user, logout, csrfToken } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay();
  const navItems = useAccountNavItems("/account/trainer");

  const [tab, setTab] = useState(0);
  const [pastSessions, setPastSessions] = useState<TrainerSession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<TrainerSession[]>([]);
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<TrainerSession | null>(null);

  const isTrainer = user?.role === "trainer" || user?.role === "admin";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous" || !isTrainer) {
      router.replace("/account");
    }
  }, [status, isTrainer, router]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [past, upcoming, absReqs, cts] = await Promise.all([
        getTrainerPastSessions(),
        getTrainerUpcomingSessions(),
        getTrainerAbsenceRequests(),
        getUserClassTypes(),
      ]);
      setPastSessions(past);
      setUpcomingSessions(upcoming);
      setAbsenceRequests(absReqs);
      setClassTypes(cts);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && isTrainer) void loadAll();
  }, [status, isTrainer, loadAll]);

  const classTypeMap = new Map(classTypes.map((ct) => [ct.id, ct.title]));

  // Map session_id → count of pending warnings for that session
  const warnCountBySession = new Map<string, number>();
  for (const r of absenceRequests) {
    if (r.status === "pending" && r.class_session_id) {
      warnCountBySession.set(r.class_session_id, (warnCountBySession.get(r.class_session_id) ?? 0) + 1);
    }
  }

  const warnedBookingIds = new Set(
    absenceRequests.filter((r) => r.status === "pending").map((r) => r.booking_id),
  );

  const sessions = tab === 0 ? [...pastSessions].reverse() : upcomingSessions;

  if (status === "loading" || (loading && sessions.length === 0)) {
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
              title="Занятия тренера"
              subtitle="Отметьте явку участников после занятия"
              displayName={displayName}
              profileSubtitle={profileSubtitle}
              backHref="/account"
            />

            <CardShell>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {/* Stats row */}
                <Stack
                  direction="row"
                  sx={{ mb: 3, gap: { xs: 1.5, sm: 3 }, flexWrap: "wrap" }}
                >
                  <Stack sx={{ alignItems: "center", minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: warnedBookingIds.size > 0 ? "#b89f74" : "text.disabled", lineHeight: 1 }}>
                      {warnedBookingIds.size}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <WarningAmberRoundedIcon sx={{ fontSize: 12, color: "text.secondary" }} />
                      <Typography sx={{ fontSize: { xs: "0.6875rem", sm: "0.75rem" }, color: "text.secondary", whiteSpace: "nowrap" }}>
                        предупреждений
                      </Typography>
                    </Stack>
                  </Stack>
                  <Divider orientation="vertical" flexItem />
                  <Stack sx={{ alignItems: "center", minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: "primary.main", lineHeight: 1 }}>
                      {upcomingSessions.length}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: "0.6875rem", sm: "0.75rem" }, color: "text.secondary", whiteSpace: "nowrap" }}>
                      предстоящих
                    </Typography>
                  </Stack>
                  <Divider orientation="vertical" flexItem />
                  <Stack sx={{ alignItems: "center", minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: "text.secondary", lineHeight: 1 }}>
                      {pastSessions.length}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: "0.6875rem", sm: "0.75rem" }, color: "text.secondary", whiteSpace: "nowrap" }}>
                      завершённых
                    </Typography>
                  </Stack>
                </Stack>

                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v as number)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    mb: 2.5,
                    "& .MuiTab-root": { fontFamily: "inherit", fontSize: { xs: "0.8125rem", sm: "0.9rem" }, textTransform: "none", minHeight: 44 },
                    "& .Mui-selected": { color: "primary.main", fontWeight: 700 },
                    "& .MuiTabs-indicator": { bgcolor: "primary.main" },
                  }}
                >
                  <Tab label={`Завершённые (${pastSessions.length})`} />
                  <Tab label={`Предстоящие (${upcomingSessions.length})`} />
                </Tabs>

                {loading ? (
                  <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : sessions.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Typography sx={{ color: "text.secondary" }}>
                      {tab === 0 ? "Нет завершённых занятий" : "Нет предстоящих занятий"}
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {sessions.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        classTypeTitle={classTypeMap.get(s.class_type_id) ?? "—"}
                        warnedCount={warnCountBySession.get(s.id) ?? 0}
                        isPast={tab === 0}
                        onClick={() => setActiveSession(s)}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </CardShell>
          </Stack>
        </Grid>
      </Grid>

      {activeSession && (
        <AttendanceDialog
          session={activeSession}
          classTypeTitle={classTypeMap.get(activeSession.class_type_id) ?? "—"}
          absenceRequests={absenceRequests}
          csrfToken={csrfToken}
          onClose={() => setActiveSession(null)}
          onSaved={() => void loadAll()}
        />
      )}
    </Box>
  );
}

export { TrainerSessions };