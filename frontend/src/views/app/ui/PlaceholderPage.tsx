"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import TelegramIcon from "@mui/icons-material/Telegram";
import { useAuth } from "@/features/auth/model/auth-context";
import type { TelegramUser } from "@/features/auth/model/auth-context";

declare global {
  interface Window {
    __onTelegramAuth?: (user: TelegramUser) => void;
  }
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) return "+7" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 11) return "+" + digits;
  if (!raw.startsWith("+")) return "+" + digits;
  return raw.trim();
}

function buildTelegramOAuthUrl(): string | null {
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
  if (!botId || typeof window === "undefined") return null;
  const origin = window.location.origin;
  const returnTo = `${origin}/auth/telegram`;
  return (
    `https://oauth.telegram.org/auth` +
    `?bot_id=${botId}` +
    `&origin=${encodeURIComponent(origin)}` +
    `&request_access=write` +
    `&return_to=${encodeURIComponent(returnTo)}`
  );
}

export function PlaceholderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, isAuthenticated, authenticateWithTelegram, authenticateWithPhone } = useAuth();
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetFailed, setWidgetFailed] = useState(false);

  // Show error from callback redirect
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "telegram_invalid" || err === "telegram_auth") {
      setError("Не удалось войти через Telegram. Попробуйте ещё раз.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "authenticated" && isAuthenticated) {
      router.replace("/account");
    }
  }, [isAuthenticated, router, status]);

  // Load Telegram inline widget; detect failure after 4s
  useEffect(() => {
    if (!widgetRef.current || !botUsername) return;

    window.__onTelegramAuth = (telegramUser: TelegramUser) => {
      setLoading(true);
      void authenticateWithTelegram(telegramUser)
        .then(() => router.replace("/account"))
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Ошибка входа через Telegram");
          setLoading(false);
        });
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-lang", "ru");
    script.setAttribute("data-onauth", "window.__onTelegramAuth(user)");
    widgetRef.current.innerHTML = "";
    widgetRef.current.appendChild(script);

    // Detect if widget rendered: Telegram appends an <iframe> inside the container
    const timer = setTimeout(() => {
      const hasIframe = widgetRef.current?.querySelector("iframe");
      if (!hasIframe) setWidgetFailed(true);
    }, 4000);

    return () => {
      clearTimeout(timer);
      delete window.__onTelegramAuth;
    };
  }, [authenticateWithTelegram, botUsername, router]);

  const handlePhoneLogin = async () => {
    const formatted = formatPhone(phone);
    if (formatted.length < 8) {
      setError("Введите корректный номер телефона");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authenticateWithPhone(formatted);
      router.replace("/account");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка входа";
      setError(msg === "Invalid credentials" ? "Номер не найден. Проверьте правильность." : msg);
      setLoading(false);
    }
  };

  const handleTelegramRedirect = () => {
    const url = buildTelegramOAuthUrl();
    if (url) window.location.href = url;
  };

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const showTelegramSection = !!(botUsername || botId);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background:
          "radial-gradient(circle at top, rgba(46,125,50,0.12), transparent 32%), linear-gradient(180deg, #f4f7f2 0%, #edf2e8 100%)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <Stack sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: { xs: "2.25rem", sm: "2.75rem" },
              color: "#2f2a24",
              lineHeight: 1.05,
            }}
          >
            Balance
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: "1rem", color: "#5f584f" }}>
            Онлайн-занятия и расписание
          </Typography>
        </Stack>

        {/* Card */}
        <Box
          sx={{
            borderRadius: 4,
            bgcolor: "rgba(255,253,248,0.94)",
            border: "1px solid rgba(62,56,47,0.08)",
            boxShadow: "0 16px 48px rgba(62,56,47,0.10)",
            p: { xs: 3, sm: 4 },
          }}
        >
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "1.5rem",
              color: "#2f2a24",
              mb: 0.5,
            }}
          >
            Вход
          </Typography>
          <Typography sx={{ fontSize: "0.9375rem", color: "#5f584f", mb: 3 }}>
            {showTelegramSection
              ? "Введите номер телефона или войдите через Telegram"
              : "Введите номер телефона"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              label="Номер телефона"
              placeholder="+7 900 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handlePhoneLogin(); }}
              disabled={loading}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneOutlinedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
            />
            <Button
              onClick={() => void handlePhoneLogin()}
              disabled={loading || !phone.trim()}
              fullWidth
              sx={{
                minHeight: 52,
                borderRadius: 3,
                fontSize: "1rem",
                fontWeight: 600,
                bgcolor: "#6a7b6a",
                color: "#fff",
                "&:hover": { bgcolor: "#5a6b5a" },
                "&:disabled": { opacity: 0.55 },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Войти"}
            </Button>
          </Stack>

          {showTelegramSection && (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography sx={{ fontSize: "0.8125rem", color: "#8a8278", px: 1 }}>
                  или
                </Typography>
              </Divider>

              {/* Inline widget (works when domain is configured in BotFather) */}
              <Box
                ref={widgetRef}
                sx={{
                  display: widgetFailed ? "none" : "flex",
                  justifyContent: "center",
                  minHeight: 54,
                }}
              />

              {/* Fallback button (shown when widget doesn't load) */}
              {widgetFailed && (
                <Button
                  onClick={handleTelegramRedirect}
                  fullWidth
                  disabled={loading}
                  startIcon={<TelegramIcon />}
                  sx={{
                    minHeight: 52,
                    borderRadius: 3,
                    fontSize: "1rem",
                    fontWeight: 600,
                    bgcolor: "#2AABEE",
                    color: "#fff",
                    "&:hover": { bgcolor: "#1a9bde" },
                    "&:disabled": { opacity: 0.55 },
                  }}
                >
                  Войти через Telegram
                </Button>
              )}
            </>
          )}
        </Box>

        <Typography sx={{ mt: 3, textAlign: "center", fontSize: "0.8125rem", color: "#8a8278", lineHeight: 1.6 }}>
          Нет аккаунта? Введите номер телефона — он будет создан автоматически.
        </Typography>
      </Box>
    </Box>
  );
}