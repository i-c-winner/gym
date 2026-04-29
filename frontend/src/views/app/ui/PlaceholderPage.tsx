"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/shared/auth/auth-context";
import type { TelegramUser } from "@/shared/auth/auth-context";

declare global {
  interface Window {
    __onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export function PlaceholderPage() {
  const { status, isAuthenticated, user, login, logout, checkAuth } = useAuth();
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    if (!widgetRef.current || !botUsername) {
      return;
    }

    window.__onTelegramAuth = (telegramUser: TelegramUser) => {
      login(telegramUser);
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

    return () => {
      if (window.__onTelegramAuth) {
        delete window.__onTelegramAuth;
      }
    };
  }, [botUsername, login]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          border: "1px solid rgba(20, 32, 19, 0.08)",
          borderRadius: "16px",
          background: "#ffffff",
          padding: "32px 24px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(20, 32, 19, 0.06)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            lineHeight: 1.1,
          }}
        >
          Фронтенд временно в режиме заглушки
        </h1>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: "16px",
            lineHeight: 1.5,
            color: "#4f5b4e",
          }}
        >
          Здесь будет новая версия интерфейса.
        </p>

        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            borderRadius: "12px",
            background: "#f5f7f2",
            textAlign: "left",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", color: "#4f5b4e" }}>
            Статус авторизации: <strong>{status}</strong>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#4f5b4e" }}>
            Пользователь авторизован: <strong>{isAuthenticated ? "да" : "нет"}</strong>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#4f5b4e" }}>
            Пользователь Telegram: <strong>{user?.first_name ?? "не выбран"}</strong>
          </p>
        </div>

        <div
          style={{
            marginTop: "20px",
            display: "grid",
            gap: "12px",
            justifyItems: "center",
          }}
        >
          <div
            ref={widgetRef}
            style={{
              width: "100%",
              minHeight: "54px",
              display: "grid",
              placeItems: "center",
            }}
          />

          {!botUsername ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#8b5a5a" }}>
              Укажите `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` в `.env.local`, чтобы включить Telegram Login Widget.
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "20px",
          }}
        >
          <button
            onClick={() => login()}
            style={{
              minHeight: "40px",
              padding: "0 16px",
              borderRadius: "10px",
              border: "none",
              background: "#2e7d32",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Пометить как авторизованного
          </button>
          <button
            onClick={logout}
            style={{
              minHeight: "40px",
              padding: "0 16px",
              borderRadius: "10px",
              border: "1px solid rgba(20, 32, 19, 0.12)",
              background: "#fff",
              color: "#142013",
              cursor: "pointer",
            }}
          >
            Сбросить авторизацию
          </button>
          <button
            onClick={checkAuth}
            style={{
              minHeight: "40px",
              padding: "0 16px",
              borderRadius: "10px",
              border: "1px solid rgba(20, 32, 19, 0.12)",
              background: "#fff",
              color: "#142013",
              cursor: "pointer",
            }}
          >
            Проверить статус
          </button>
        </div>
      </section>
    </main>
  );
}
