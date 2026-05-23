"use client";

import { useState } from "react";
import {
  Button,
  Chip,
  CircularProgress,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from "@/shared/config/bookingStatus";
import { createAbsenceRequest, type AbsenceRequest, type ScheduleEvent } from "@/shared/api/gym";

export type PopoverState = { anchor: Element; event: ScheduleEvent } | null;

export function EventPopover({
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
          label={BOOKING_STATUS_LABEL[displayStatus] ?? displayStatus}
          size="small"
          sx={{
            alignSelf: "flex-start",
            bgcolor: BOOKING_STATUS_COLOR[displayStatus] ?? "#9e9e9e",
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
