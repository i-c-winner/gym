import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const highlights = [
  {
    title: "Тренировки",
    description: "Подготовленная зона для силовой и функциональной нагрузки.",
    icon: <FitnessCenterRoundedIcon />,
  },
  {
    title: "Выносливость",
    description: "Кардио-сценарии и персональные планы под уровень клиента.",
    icon: <DirectionsRunRoundedIcon />,
  },
  {
    title: "Ритм",
    description: "Гибкий UX-скелет для расписания, абонементов и личного кабинета.",
    icon: <BoltRoundedIcon />,
  },
];

export function HomeHero() {
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Stack spacing={6}>
          <Stack spacing={3} sx={{ maxWidth: 720 }}>
            <Chip
              label="Next.js + TypeScript + MUI"
              color="primary"
              sx={{ alignSelf: "flex-start", fontWeight: 700 }}
            />
            <Typography
              component="h1"
              variant="h2"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.04em",
                textWrap: "balance",
              }}
            >
              Frontend-приложение подготовлено для дальнейшей разработки.
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 640 }}>
              Базовый scaffold уже разделен по FSD-слоям, подключен App Router и
              настроен MUI как основная UI-библиотека.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="contained" size="large">
                Начать разработку
              </Button>
              <Button variant="outlined" size="large">
                Подключить API
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            {highlights.map((item) => (
              <Card
                key={item.title}
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.72)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 3,
                        color: "primary.main",
                        backgroundColor: "primary.light",
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="h5" fontWeight={700}>
                      {item.title}
                    </Typography>
                    <Typography color="text.secondary">{item.description}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
