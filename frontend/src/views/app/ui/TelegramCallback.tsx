"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "@/features/auth/model/auth-context";
import type { TelegramUser } from "@/features/auth/model/auth-context";

export function TelegramCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const { authenticateWithTelegram } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const id = params.get("id");
    const hash = params.get("hash");
    const auth_date = params.get("auth_date");

    if (!id || !hash || !auth_date) {
      router.replace("/?error=telegram_invalid");
      return;
    }

    const tgUser: TelegramUser = {
      id: Number(id),
      hash,
      auth_date: Number(auth_date),
      first_name: params.get("first_name") ?? undefined,
      last_name: params.get("last_name") ?? undefined,
      username: params.get("username") ?? undefined,
      photo_url: params.get("photo_url") ?? undefined,
    };

    authenticateWithTelegram(tgUser)
      .then(() => router.replace("/account"))
      .catch(() => router.replace("/?error=telegram_auth"));
  }, [authenticateWithTelegram, params, router]);

  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress sx={{ color: "#6a7b6a" }} />
        <Typography sx={{ mt: 2, color: "text.secondary", fontSize: "0.9375rem" }}>
          Вход через Telegram…
        </Typography>
      </Box>
    </Box>
  );
}