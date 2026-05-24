"use client";

import { useEffect, useState } from "react";
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
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from "@/shared/config/bookingStatus";
import {
  getSessionParticipants,
  markAttendance,
  type TrainerSession,
  type TrainerParticipant,
  type AbsenceRequest,
} from "@/shared/api/gym";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

type AttendanceDialogProps = {
  session: TrainerSession;
  classTypeTitle: string;
  absenceRequests: AbsenceRequest[];
  csrfToken: string | null;
  isPast: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function AttendanceDialog({
  session,
  classTypeTitle,
  absenceRequests,
  csrfToken,
  isPast,
  onClose,
  onSaved,
}: AttendanceDialogProps) {
  const [participants, setParticipants] = useState<TrainerParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<Record<string, boolean | null>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const warnedBookingIds = new Set(
    absenceRequests.filter((r) => r.status === "pending").map((r) => r.booking_id),
  );

  useEffect(() => {
    getSessionParticipants(session.id)
      .then((list) => {
        setParticipants(list);
        const initial: Record<string, boolean | null> = {};
        for (const p of list) {
          if (p.status === "attended") initial[p.id] = true;
          else if (p.status === "no_show" || p.status === "absent") initial[p.id] = false;
          else initial[p.id] = null;
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

  const participantName = (p: TrainerParticipant) =>
    [p.user_first_name, p.user_last_name].filter(Boolean).join(" ") || p.user_telephone || "—";

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: 4 }, p: 0.5, m: { xs: 0, sm: 2 }, maxHeight: { xs: "100dvh", sm: "90dvh" }, alignSelf: { xs: "flex-end", sm: "center" } } } }}
    >
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
          <Typography sx={{ color: "text.secondary", py: 2, textAlign: "center" }}>Нет участников</Typography>
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
          <Alert severity="success" sx={{ borderRadius: 2, mt: 2 }}>Явка сохранена</Alert>
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
