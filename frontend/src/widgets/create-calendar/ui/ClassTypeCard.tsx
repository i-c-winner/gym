"use client";

import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import { CardShell } from "@/shared/ui/CardShell";
import type { ClassType, TrainerUser } from "@/shared/api/gym";
import { DAY_LABELS, trainerLabel } from "../model/types";

type ClassTypeCardProps = {
  ct: ClassType;
  trainers: TrainerUser[];
  onEdit: () => void;
  onToggle: () => void;
};

export function ClassTypeCard({ ct, trainers, onEdit, onToggle }: ClassTypeCardProps) {
  const trainer = trainers.find((t) => t.id === ct.trainer_id);
  const days = ct.schedules.map((s) => DAY_LABELS[s.day_of_week]).join(", ");

  return (
    <CardShell>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "text.primary" }}>
                {ct.title}
              </Typography>
              <Chip
                label={ct.is_active ? "Активно" : "Неактивно"}
                size="small"
                sx={{
                  bgcolor: ct.is_active ? "rgba(106, 123, 106, 0.14)" : "rgba(62,56,47,0.08)",
                  color: ct.is_active ? "primary.main" : "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              />
            </Stack>
            {trainer && (
              <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                {trainerLabel(trainer)}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Редактировать">
              <IconButton onClick={onEdit} sx={{ width: 44, height: 44 }}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={ct.is_active ? "Деактивировать" : "Активировать"}>
              <IconButton onClick={onToggle} color={ct.is_active ? "default" : "primary"} sx={{ width: 44, height: 44 }}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1.5 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
              {ct.duration_minutes} мин
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <GroupOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
            <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
              до {ct.max_participants} чел.
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.8125rem", color: "secondary.main", fontWeight: 600 }}>
            {Number(ct.base_rate_per_day).toLocaleString("ru-RU")} ₽/день
          </Typography>
        </Stack>

        {days && (
          <Typography sx={{ mt: 1, fontSize: "0.8125rem", color: "text.secondary" }}>
            {days}
          </Typography>
        )}
      </Box>
    </CardShell>
  );
}
