"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import type { TrainerSession } from "@/shared/api/gym";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

type SessionCardProps = {
  session: TrainerSession;
  classTypeTitle: string;
  warnedCount: number;
  isPast: boolean;
  onClick: () => void;
};

export function SessionCard({ session, classTypeTitle, warnedCount, isPast, onClick }: SessionCardProps) {
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
