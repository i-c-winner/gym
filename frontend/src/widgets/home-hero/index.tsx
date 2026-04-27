import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import type { AuthStatus } from "@/features/auth";

type HomeHeroProps = {
  authStatus: AuthStatus;
  userName?: string | null;
};

const authStatusText: Record<AuthStatus, string> = {
  idle: "Подготовка проверки авторизации",
  loading: "Проверяем авторизацию",
  authenticated: "Пользователь авторизован",
  anonymous: "Пользователь не авторизован",
};

export function HomeHero({ authStatus, userName }: HomeHeroProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "grid",
        alignItems: "center",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            minHeight: { xs: 280, sm: 360 },
            display: "grid",
            placeItems: "center",
            px: { xs: 3, sm: 6 },
            py: { xs: 5, sm: 8 },
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Box sx={{ maxWidth: 520, textAlign: "center" }}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
              Главная страница
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
              {authStatusText[authStatus]}
            </Typography>
            {authStatus === "authenticated" && userName ? (
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {userName}
              </Typography>
            ) : null}
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Здесь пока пусто
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
