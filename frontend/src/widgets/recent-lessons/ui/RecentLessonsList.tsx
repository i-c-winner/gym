import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { CardShell } from "@/shared/ui/CardShell";

type RecentLessonItem = {
  title: string;
  subtitle: string;
  duration: string;
  progress: number;
  image: string;
};

type RecentLessonsListProps = {
  items: RecentLessonItem[];
};

function RecentLessonsList({ items }: RecentLessonsListProps) {
  return (
    <Box>
      <Typography
        sx={{
          mb: 1.5,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: { xs: "1.75rem", md: "2rem" },
          color: "text.primary",
        }}
      >
        Последние уроки
      </Typography>
      <Stack spacing={1.5}>
        {items.map((item) => (
          <CardShell key={item.title}>
            <Box
              sx={{
                p: 1.5,
                display: "grid",
                gridTemplateColumns: { xs: "88px 1fr", md: "112px 1fr auto" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  height: { xs: 72, md: 84 },
                  borderRadius: 2,
                  backgroundImage: `url('${item.image}')`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, color: "text.primary" }}>
                  {item.title}
                </Typography>
                <Typography sx={{ mt: 0.25, color: "text.secondary" }}>
                  {item.subtitle}
                </Typography>
              </Box>
              <Box sx={{ minWidth: { xs: "100%", md: 180 }, gridColumn: { xs: "1 / -1", md: "auto" } }}>
                <Typography sx={{ mb: 1, textAlign: "right", color: "text.secondary" }}>
                  {item.duration}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={item.progress}
                  sx={{
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
            </Box>
          </CardShell>
        ))}
      </Stack>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Button sx={{ color: "secondary.main" }}>Смотреть все уроки</Button>
      </Box>
    </Box>
  );
}

export { RecentLessonsList };
export type { RecentLessonItem };