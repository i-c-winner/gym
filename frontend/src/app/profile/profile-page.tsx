"use client";

import Link from "next/link";
import { useEffect } from "react";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import FaceRoundedIcon from "@mui/icons-material/FaceRounded";
import TelegramIcon from "@mui/icons-material/Telegram";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { RegistrationPanel, useAuth } from "@/features/auth";

const profileLabels = [
  { key: "telephone", label: "Телефон", icon: <CallRoundedIcon fontSize="small" /> },
  { key: "telegramId", label: "Telegram ID", icon: <TelegramIcon fontSize="small" /> },
  { key: "age", label: "Возраст", icon: <BadgeRoundedIcon fontSize="small" /> },
  { key: "gender", label: "Пол", icon: <FaceRoundedIcon fontSize="small" /> },
] as const;

export function ProfilePage() {
  const { checkAuth, status, user, authError } = useAuth();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkAuth().catch((error: unknown) => {
        console.error("Profile auth check failed", error);
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkAuth]);

  if (status === "anonymous") {
    return <RegistrationPanel />;
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

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
            px: { xs: 3, sm: 5 },
            py: { xs: 4, sm: 5 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Stack spacing={3}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
                  Личный кабинет
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Ваши данные и текущий статус авторизации
                </Typography>
              </Box>

              <Button component={Link} href="/" startIcon={<ArrowBackRoundedIcon />} variant="outlined">
                На главную
              </Button>
            </Stack>

            {authError ? <Alert severity="warning">{authError}</Alert> : null}

            <Paper
              elevation={0}
              sx={{
                px: { xs: 2.5, sm: 3 },
                py: { xs: 2.5, sm: 3 },
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, rgba(46,125,50,0.12), rgba(239,108,0,0.08))",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">
                  Статус
                </Typography>
                <Typography variant="h5">
                  {status === "authenticated" ? "Пользователь авторизован" : "Проверяем авторизацию"}
                </Typography>
                <Typography color="text.secondary">
                  {fullName || user?.telephone || user?.telegramId || "Данные пользователя недоступны"}
                </Typography>
              </Stack>
            </Paper>

            <Divider />

            <Stack spacing={2}>
              {profileLabels.map(({ key, label, icon }) => {
                const value = user?.[key];

                return (
                  <Paper
                    key={key}
                    elevation={0}
                    sx={{
                      px: 2.5,
                      py: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        {icon}
                        <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
                      </Stack>

                      <Typography color={value ? "text.primary" : "text.secondary"}>
                        {value ? String(value) : "Не указано"}
                      </Typography>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
