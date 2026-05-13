import { Box, Chip, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { CardShell } from "@/shared/ui/CardShell";

type ProgramHeroProps = {
  image: string;
  accent: string;
  progress: number;
  status: string;
  lessonsLabel: string;
  durationLabel: string;
  progressLabel: string;
  lessonsValue: string;
  durationValue: string;
};

function ProgramHero({
  image,
  accent,
  progress,
  status,
  lessonsLabel,
  durationLabel,
  progressLabel,
  lessonsValue,
  durationValue,
}: ProgramHeroProps) {
  return (
    <CardShell>
      <Box sx={{ p: 1.5 }}>
        <Box
          sx={{
            minHeight: { xs: 220, sm: 320 },
            borderRadius: 3,
            overflow: "hidden",
            position: "relative",
            backgroundImage: `linear-gradient(180deg, rgba(47,42,36,0.02) 0%, rgba(47,42,36,0.55) 100%), url('${image}')`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <Chip
            label={status}
            sx={{
              position: "absolute",
              top: 14,
              left: 14,
              bgcolor: "rgba(255, 253, 248, 0.92)",
              color: "text.primary",
              fontWeight: 600,
            }}
          />
        </Box>

        <Box sx={{ p: { xs: 1, md: 1.5 }, pt: 2 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <PlayCircleOutlineRoundedIcon sx={{ color: "secondary.main" }} />
                <Box>
                  <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
                    {lessonsLabel}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                    {lessonsValue}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <AccessTimeRoundedIcon sx={{ color: "secondary.main" }} />
                <Box>
                  <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
                    {durationLabel}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                    {durationValue}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" sx={{ mb: 1, justifyContent: "space-between" }}>
            <Typography sx={{ color: "text.secondary" }}>{progressLabel}</Typography>
            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>{progress}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 7,
              borderRadius: 999,
              bgcolor: "rgba(184, 159, 116, 0.18)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                bgcolor: accent,
              },
            }}
          />
        </Box>
      </Box>
    </CardShell>
  );
}

export { ProgramHero };