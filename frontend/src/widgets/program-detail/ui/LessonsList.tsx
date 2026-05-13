import { Box, Chip, Stack, Typography } from "@mui/material";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import { CardShell } from "@/shared/ui/CardShell";

type LessonItem = {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
};

type LessonsListProps = {
  lessons: LessonItem[];
  accent: string;
};

function LessonsList({ lessons, accent }: LessonsListProps) {
  return (
    <CardShell>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={1}>
          {lessons.map((lesson) => (
            <Box
              key={lesson.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                borderRadius: 3,
                bgcolor: lesson.completed ? "rgba(184, 159, 116, 0.10)" : "rgba(62, 56, 47, 0.04)",
                border: "1px solid",
                borderColor: lesson.completed
                  ? "rgba(184, 159, 116, 0.24)"
                  : "rgba(62, 56, 47, 0.06)",
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <PlayCircleOutlineRoundedIcon
                  sx={{ color: lesson.completed ? accent : "text.disabled", fontSize: 28 }}
                />
                <Box>
                  <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                    {lesson.title}
                  </Typography>
                  <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                    {lesson.duration}
                  </Typography>
                </Box>
              </Stack>
              {lesson.completed ? (
                <Chip
                  label="Пройден"
                  size="small"
                  sx={{ bgcolor: "rgba(184, 159, 116, 0.18)", color: "text.primary", fontWeight: 600 }}
                />
              ) : null}
            </Box>
          ))}
        </Stack>
      </Box>
    </CardShell>
  );
}

export { LessonsList };
export type { LessonItem };