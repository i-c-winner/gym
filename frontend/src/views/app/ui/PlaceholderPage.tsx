"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/features/auth/model/auth-context";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) return "+7" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 11) return "+" + digits;
  if (!raw.startsWith("+")) return "+" + digits;
  return raw.trim();
}

export function PlaceholderPage() {
  const router = useRouter();
  const { status, isAuthenticated, authenticateWithPhone } = useAuth();
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telegramIframeUrl, setTelegramIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && isAuthenticated) {
      router.replace("/account");
    }
  }, [isAuthenticated, router, status]);

  // Build iframe URL client-side so window.location.origin is available
  useEffect(() => {
    if (!botId) return;
    const origin = window.location.origin;
    const returnTo = `${origin}/auth/telegram`;
    setTelegramIframeUrl(
      `https://oauth.telegram.org/auth` +
      `?bot_id=${botId}` +
      `&origin=${encodeURIComponent(origin)}` +
      `&request_access=write` +
      `&return_to=${encodeURIComponent(returnTo)}` +
      `&embed=1`,
    );
  }, [botId]);

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

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

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
            {telegramIframeUrl
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

          {telegramIframeUrl && (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography sx={{ fontSize: "0.8125rem", color: "#8a8278", px: 1 }}>
                  или
                </Typography>
              </Divider>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <iframe
                  src={telegramIframeUrl}
                  frameBorder="0"
                  scrolling="no"
                  style={{ width: 220, height: 44, display: "block" }}
                  title="Войти через Telegram"
                />
              </Box>
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