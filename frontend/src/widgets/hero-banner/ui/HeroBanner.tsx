import { Box, Button, Typography } from "@mui/material";
import { CardShell } from "@/shared/ui/CardShell";

function HeroBanner() {
  return (
    <CardShell>
      <Box
        sx={{
          minHeight: { xs: 360, md: 420 },
          borderRadius: 4,
          overflow: "hidden",
          display: "grid",
          alignItems: "end",
          backgroundImage:
            "linear-gradient(90deg, rgba(244,240,232,0.96) 0%, rgba(244,240,232,0.72) 40%, rgba(244,240,232,0.12) 70%), url('/images/top.jpeg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          <Typography
            sx={{
              maxWidth: 380,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: { xs: "2.25rem", md: "4rem" },
              lineHeight: 1.02,
              color: "text.primary",
            }}
          >
            Гибкость. Сила. Грация.
          </Typography>
          <Typography
            sx={{
              mt: 2,
              maxWidth: 280,
              fontSize: { xs: "1rem", md: "1.375rem" },
              lineHeight: 1.5,
              color: "text.secondary",
            }}
          >
            Видеоуроки гимнастики для любого уровня подготовки
          </Typography>
          <Button
            sx={{
              mt: 3,
              px: 3.5,
              py: 1.6,
              borderRadius: 999,
              bgcolor: "secondary.main",
              color: "#fffdf8",
              fontSize: "1rem",
            }}
          >
            Продолжить тренировку
          </Button>
        </Box>
      </Box>
    </CardShell>
  );
}

export { HeroBanner };