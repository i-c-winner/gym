"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { CardShell } from "@/shared/ui/CardShell";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import type { ProgramCardItem, ProgramCardSize } from "./types";
import { ProgramCardStat } from "./ProgramCardStat";

export const sizeConfig: Record<
  ProgramCardSize,
  {
    columns: { xs: 12; sm?: 6; md?: 6; xl?: 3 | 4 | 6 };
    imageHeight: { xs: number; sm?: number; md?: number };
    titleSize: { xs: string; md?: string };
    padding: { xs: number; md?: number };
    showDescription: boolean;
    showDetails: boolean;
  }
> = {
  small: {
    columns: { xs: 12, sm: 6, xl: 3 },
    imageHeight: { xs: 140, md: 150 },
    titleSize: { xs: "1.125rem" },
    padding: { xs: 2 },
    showDescription: false,
    showDetails: false,
  },
  middle: {
    columns: { xs: 12, sm: 6, xl: 4 },
    imageHeight: { xs: 190, md: 220 },
    titleSize: { xs: "1.5rem", md: "1.75rem" },
    padding: { xs: 2, md: 2.5 },
    showDescription: true,
    showDetails: true,
  },
  high: {
    columns: { xs: 12, md: 6 },
    imageHeight: { xs: 220, sm: 260 },
    titleSize: { xs: "1.875rem", md: "2.25rem" },
    padding: { xs: 2, md: 2.5 },
    showDescription: true,
    showDetails: true,
  },
};

type ProgramCardProps = {
  item: ProgramCardItem;
  size: ProgramCardSize;
  actionLabel?: string;
  durationLabel?: string;
  lessonsLabel?: string;
  progressLabel?: string;
};

function ProgramCard({
  item,
  size,
  actionLabel,
  durationLabel,
  lessonsLabel,
  progressLabel,
}: ProgramCardProps) {
  const config = sizeConfig[size];
  const itemActionLabel = item.actionLabel ?? actionLabel;

  return (
    <CardShell>
      <Box sx={{ p: size === "small" ? 0 : 1.5 }}>
        <Box
          sx={{
            minHeight: config.imageHeight,
            borderTopLeftRadius: size === "small" ? 16 : 12,
            borderTopRightRadius: size === "small" ? 16 : 12,
            borderBottomLeftRadius: size === "small" ? 0 : 12,
            borderBottomRightRadius: size === "small" ? 0 : 12,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            backgroundImage: `linear-gradient(180deg, rgba(47,42,36,0.02) 0%, rgba(47,42,36,0.66) 100%), url('${item.image}')`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          {size !== "small" && item.status ? (
            <Chip
              label={item.status}
              sx={{
                position: "absolute",
                top: 14,
                left: 14,
                bgcolor: "rgba(255, 253, 248, 0.92)",
                color: "text.primary",
                fontWeight: 600,
              }}
            />
          ) : null}

          {size !== "small" ? (
            <Box sx={{ p: config.padding, width: "100%" }}>
              <Typography
                sx={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: config.titleSize,
                  lineHeight: 1.08,
                  color: "#fffdf8",
                  textShadow: "0 2px 18px rgba(38, 31, 24, 0.32)",
                }}
              >
                {item.title}
              </Typography>
              {config.showDescription && item.description ? (
                <Typography
                  sx={{
                    mt: 1,
                    maxWidth: 480,
                    color: "#fffdf8",
                    fontSize: "1rem",
                    lineHeight: 1.55,
                    textShadow: "0 2px 18px rgba(38, 31, 24, 0.28)",
                  }}
                >
                  {item.description}
                </Typography>
              ) : null}
            </Box>
          ) : null}
        </Box>

        <Box sx={{ p: config.padding }}>
          {size === "small" ? (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: config.titleSize, fontWeight: 600, color: "text.primary" }}>
                  {item.title}
                </Typography>
                {item.lessons ? (
                  <Typography sx={{ mt: 0.5, color: "text.secondary" }}>{item.lessons}</Typography>
                ) : null}
              </Box>
              <IconButton
                component={Link}
                href={item.href ?? "#"}
                sx={{
                  border: "1px solid rgba(184, 159, 116, 0.4)",
                  color: "secondary.main",
                  flexShrink: 0,
                }}
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            </Stack>
          ) : null}

          {config.showDetails ? (
            <Grid container spacing={1.5}>
              {item.lessons ? (
                <Grid size={{ xs: 6, sm: 4 }}>
                  <ProgramCardStat
                    icon={PlayCircleOutlineRoundedIcon}
                    label={lessonsLabel}
                    value={item.lessons}
                  />
                </Grid>
              ) : null}
              {item.duration ? (
                <Grid size={{ xs: 6, sm: 4 }}>
                  <ProgramCardStat
                    icon={AccessTimeRoundedIcon}
                    label={durationLabel}
                    value={item.duration}
                  />
                </Grid>
              ) : null}
              {itemActionLabel ? (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Button
                    fullWidth
                    component={Link}
                    href={item.href ?? "#"}
                    endIcon={<ChevronRightRoundedIcon />}
                    sx={{
                      minHeight: 48,
                      px: 2,
                      borderRadius: 999,
                      bgcolor: "rgba(184, 159, 116, 0.18)",
                      color: "text.primary",
                    }}
                  >
                    {itemActionLabel}
                  </Button>
                </Grid>
              ) : null}
            </Grid>
          ) : null}

          {config.showDetails && typeof item.progress === "number" ? (
            <>
              <Stack direction="row" sx={{ mt: 2.25, mb: 1, justifyContent: "space-between" }}>
                <Typography sx={{ color: "text.secondary" }}>{progressLabel}</Typography>
                <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                  {item.progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={item.progress}
                sx={{
                  height: 7,
                  borderRadius: 999,
                  bgcolor: "rgba(184, 159, 116, 0.18)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    bgcolor: item.accent ?? "secondary.main",
                  },
                }}
              />
            </>
          ) : null}
        </Box>
      </Box>
    </CardShell>
  );
}

export { ProgramCard };
export type { ProgramCardProps };
