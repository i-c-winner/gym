"use client";

import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { DAY_LABELS, type ScheduleDraft } from "../model/types";

type ScheduleEditorProps = {
  schedule: ScheduleDraft[];
  onChange: (next: ScheduleDraft[]) => void;
};

export function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  const toggle = (i: number) => {
    const next = schedule.map((s, idx) =>
      idx === i ? { ...s, enabled: !s.enabled } : s,
    );
    onChange(next);
  };

  const setTime = (i: number, time: string) => {
    const next = schedule.map((s, idx) => (idx === i ? { ...s, time } : s));
    onChange(next);
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 1.5 }}>
        Расписание
      </Typography>
      <Stack spacing={1}>
        {DAY_LABELS.map((label, i) => (
          <Stack
            key={label}
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center", flexWrap: { xs: "wrap", sm: "nowrap" } }}
          >
            <Chip
              label={label}
              onClick={() => toggle(i)}
              sx={{
                minWidth: 48,
                fontWeight: 600,
                cursor: "pointer",
                bgcolor: schedule[i].enabled ? "primary.main" : "rgba(62,56,47,0.07)",
                color: schedule[i].enabled ? "primary.contrastText" : "text.secondary",
                "&:hover": {
                  bgcolor: schedule[i].enabled ? "primary.dark" : "rgba(62,56,47,0.13)",
                },
                transition: "background 0.15s",
              }}
            />
            {schedule[i].enabled && (
              <TextField
                size="small"
                type="time"
                value={schedule[i].time}
                onChange={(e) => setTime(i, e.target.value)}
                sx={{ width: { xs: "100%", sm: 130 } }}
                slotProps={{ htmlInput: { step: 300 } }}
              />
            )}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
