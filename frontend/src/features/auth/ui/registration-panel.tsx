"use client";

import TelegramIcon from "@mui/icons-material/Telegram";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/shared/api";

import { useAuth } from "../model/auth-context";

type TelegramAuthUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    onTelegramRegister?: (user: TelegramAuthUser) => void;
  }
}

const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export function RegistrationPanel() {
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const { register, login, status, authError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isTelegramRegistering, setIsTelegramRegistering] = useState(false);

  useEffect(() => {
    const container = widgetContainerRef.current;

    if (!container || !telegramBotUsername) {
      return undefined;
    }

    container.innerHTML = "";

    window.onTelegramRegister = (telegramUser) => {
      setError(null);
      setIsTelegramRegistering(true);

      void register({
        telegram_auth: telegramUser,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      })
        .catch((registrationError: unknown) => {
          if (
            registrationError instanceof ApiError &&
            registrationError.status === 409
          ) {
            return login({ telegram_auth: telegramUser });
          }

          throw registrationError;
        })
        .catch((registrationError: unknown) => {
          setError(
            registrationError instanceof Error
              ? registrationError.message
              : "Не удалось зарегистрироваться через Telegram",
          );
        })
        .finally(() => {
          setIsTelegramRegistering(false);
        });
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", telegramBotUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramRegister(user)");

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
      delete window.onTelegramRegister;
    };
  }, [login, register]);

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
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            px: { xs: 3, sm: 5 },
            py: { xs: 4, sm: 6 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography component="h1" variant="h4" sx={{ fontWeight: 700 }}>
                Регистрация
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Выберите способ создания аккаунта
              </Typography>
            </Box>

            {authError ? <Alert severity="warning">{authError}</Alert> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}

            <Stack spacing={2}>
              <Box
                sx={{
                  minHeight: 48,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {telegramBotUsername ? (
                  <Box ref={widgetContainerRef} />
                ) : (
                  <Button
                    disabled
                    fullWidth
                    size="large"
                    startIcon={<TelegramIcon />}
                    variant="contained"
                  >
                    Регистрация через Telegram
                  </Button>
                )}
              </Box>

              <Button
                disabled
                fullWidth
                size="large"
                startIcon={<PhoneIphoneRoundedIcon />}
                variant="outlined"
              >
                Регистрация по телефону
              </Button>
            </Stack>

            {telegramBotUsername ? null : (
              <Alert severity="info">
                Укажите NEXT_PUBLIC_TELEGRAM_BOT_USERNAME для Telegram Login Widget
              </Alert>
            )}

            {isTelegramRegistering || status === "loading" ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <CircularProgress size={18} />
                <Typography color="text.secondary" variant="body2">
                  Выполняется регистрация
                </Typography>
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
