import { Box, Button, IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { CardShell } from "@/shared/ui/CardShell";

type ContinueLessonCardProps = {
  title: string;
  subtitle: string;
  duration: string;
  progress: number;
  image: string;
};

function ContinueLessonCard({
  title,
  subtitle,
  duration,
  progress,
  image,
}: ContinueLessonCardProps) {
  return (
    <CardShell>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography
          sx={{
            mb: 2,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: { xs: "1.75rem", md: "2rem" },
            color: "text.primary",
          }}
        >
          Продолжить урок
        </Typography>

        <Box
          sx={{
            position: "relative",
            height: 180,
            borderRadius: 3,
            overflow: "hidden",
            backgroundImage: `url('${image}')`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(47, 42, 36, 0.08)",
            }}
          >
            <IconButton
              sx={{
                width: 72,
                height: 72,
                bgcolor: "rgba(255, 253, 248, 0.96)",
                color: "text.primary",
              }}
            >
              <PlayArrowRoundedIcon sx={{ fontSize: 40 }} />
            </IconButton>
          </Box>
          <Typography
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "#fffdf8",
              fontWeight: 600,
            }}
          >
            {duration}
          </Typography>
        </Box>

        <Stack
          direction="row"
          sx={{ mt: 2, gap: 2, justifyContent: "space-between", alignItems: "center" }}
        >
          <Box>
            <Typography sx={{ fontSize: "1.375rem", fontWeight: 600, color: "text.primary" }}>
              {title}
            </Typography>
            <Typography sx={{ color: "text.secondary" }}>{subtitle}</Typography>
          </Box>
          <Button
            sx={{
              px: 2.5,
              py: 1,
              borderRadius: 999,
              bgcolor: "rgba(184, 159, 116, 0.18)",
              color: "text.primary",
            }}
          >
            Продолжить
          </Button>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 2,
            height: 6,
            borderRadius: 999,
            bgcolor: "rgba(184, 159, 116, 0.18)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              bgcolor: "secondary.main",
            },
          }}
        />
      </Box>
    </CardShell>
  );
}

export { ContinueLessonCard };