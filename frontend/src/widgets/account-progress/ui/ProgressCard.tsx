import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { CardShell } from "@/shared/ui/CardShell";

type WeekDay = {
  label: string;
  checked: boolean;
};

type ProgressCardProps = {
  percentage: number;
  completedCount: number;
  totalCount: number;
  totalTime: string;
  weekDays: WeekDay[];
};

function ProgressCard({
  percentage,
  completedCount,
  totalCount,
  totalTime,
  weekDays,
}: ProgressCardProps) {
  const filledDeg = Math.round(percentage * 3.6);

  return (
    <CardShell>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}>
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: { xs: "1.75rem", md: "2rem" },
              color: "text.primary",
            }}
          >
            Мой прогресс
          </Typography>
          <Button sx={{ color: "secondary.main" }}>Смотреть все</Button>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row", xl: "row" }} spacing={3} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 134,
              height: 134,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: `conic-gradient(#b98173 0deg ${filledDeg}deg, rgba(185, 129, 115, 0.14) ${filledDeg}deg 360deg)`,
            }}
          >
            <Box
              sx={{
                width: 102,
                height: 102,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: "background.paper",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "2rem",
                  color: "text.primary",
                }}
              >
                {percentage}%
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, color: "text.primary" }}>
              Тренировок в этом месяце
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary" }}>
              {completedCount} из {totalCount}
            </Typography>
            <Typography sx={{ mt: 0.5, color: "text.secondary" }}>{totalTime}</Typography>
          </Box>
        </Stack>

        <Grid container spacing={1} sx={{ mt: 3 }}>
          {weekDays.map((day) => (
            <Grid key={day.label} size={{ xs: 12 / 7 }}>
              <Stack spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ color: "text.secondary" }}>{day.label}</Typography>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: day.checked ? "secondary.main" : "transparent",
                    border: day.checked ? "none" : "1px solid rgba(184, 159, 116, 0.38)",
                    color: "#fffdf8",
                  }}
                >
                  {day.checked ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : null}
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
    </CardShell>
  );
}

export { ProgressCard };
export type { WeekDay };