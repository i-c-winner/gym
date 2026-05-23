"use client";

import { Button, Stack, Typography } from "@mui/material";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import type { PeriodInfo } from "@/shared/lib/schedulePeriods";

type PeriodCardProps = {
  period: PeriodInfo;
  missedCount: number;
  onClick: () => void;
};

export function PeriodCard({ period, missedCount, onClick }: PeriodCardProps) {
  return (
    <Button
      onClick={onClick}
      sx={(theme) => ({
        flex: "1 1 0",
        minWidth: { xs: "calc(50% - 6px)", sm: 140 },
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.5,
        p: 2,
        borderRadius: 3,
        border: `1.5px solid ${theme.palette.mode === "dark" ? "rgba(143,163,143,0.25)" : "rgba(106,123,106,0.25)"}`,
        bgcolor: theme.palette.mode === "dark" ? "rgba(143,163,143,0.08)" : "rgba(255,253,248,0.7)",
        color: "text.primary",
        textAlign: "left",
        "&:hover": {
          bgcolor: theme.palette.mode === "dark" ? "rgba(143,163,143,0.16)" : "rgba(106,123,106,0.07)",
          borderColor: "primary.main",
        },
        transition: "all 0.15s",
      })}
    >
      <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.2, color: "primary.main" }}>
        {period.label}
      </Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.3 }}>
        {period.rangeLabel}
      </Typography>
      {missedCount > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mt: 0.25 }}>
          <CardGiftcardOutlinedIcon sx={{ fontSize: 13, color: "secondary.main" }} />
          <Typography sx={{ fontSize: "0.7rem", color: "secondary.main", fontWeight: 600 }}>
            {missedCount} кред.
          </Typography>
        </Stack>
      )}
    </Button>
  );
}
