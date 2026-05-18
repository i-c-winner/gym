"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { request, readCsrfToken, writeCsrfToken, buildApiError } from "@/shared/api/client";
import type { ApiError } from "@/shared/api/client";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

type AuthUser = {
  id: string;
  telephone: string | null;
  telegram_id: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  role?: "admin" | "trainer" | "user";
  created_at?: string;
};

type AuthPayload = {
  user_id: string;
  telephone: string | null;
  telegram_id: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  role: "admin" | "trainer" | "user";
  csrf_token: string;
};

type AuthContextValue = {
  status: AuthStatus;
  isAuthenticated: boolean;
  user: AuthUser | null;
  csrfToken: string | null;
  checkAuth: () => Promise<void>;
  authenticateWithTelegram: (telegramUser: TelegramUser) => Promise<void>;
  authenticateWithPhone: (telephone: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthPayload(payload: AuthPayload): AuthUser {
  return {
    id: payload.user_id,
    telephone: payload.telephone,
    telegram_id: payload.telegram_id,
    first_name: payload.first_name,
    last_name: payload.last_name,
    age: payload.age,
    gender: payload.gender,
    role: payload.role,
  };
}

function finalizeAuth(
  payload: AuthPayload | null,
  setUser: (u: AuthUser) => void,
  setCsrfToken: (t: string) => void,
  setStatus: (s: AuthStatus) => void,
) {
  if (!payload) throw buildApiError("Пустой ответ авторизации");
  writeCsrfToken(payload.csrf_token);
  setUser(mapAuthPayload(payload));
  setCsrfToken(payload.csrf_token);
  setStatus("authenticated");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await request<AuthUser>("/me", { method: "GET" });
      setUser(currentUser);
      setCsrfToken(readCsrfToken());
      setStatus("authenticated");
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 401) {
        setUser(null);
        setCsrfToken(null);
        writeCsrfToken(null);
        setStatus("anonymous");
        return;
      }
      throw error;
    }
  }, []);

  const authenticateWithTelegram = useCallback(async (telegramUser: TelegramUser) => {
    const body = JSON.stringify({ telegram_auth: telegramUser });
    try {
      const payload = await request<AuthPayload>("/auth/register", { method: "POST", body });
      finalizeAuth(payload, setUser, setCsrfToken, setStatus);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status !== 409) throw error;
      const payload = await request<AuthPayload>("/auth/login", { method: "POST", body });
      finalizeAuth(payload, setUser, setCsrfToken, setStatus);
    }
  }, []);

  const authenticateWithPhone = useCallback(async (telephone: string) => {
    const body = JSON.stringify({ telephone });
    try {
      const payload = await request<AuthPayload>("/auth/register", { method: "POST", body });
      finalizeAuth(payload, setUser, setCsrfToken, setStatus);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status !== 409) throw error;
      const payload = await request<AuthPayload>("/auth/login", { method: "POST", body });
      finalizeAuth(payload, setUser, setCsrfToken, setStatus);
    }
  }, []);

  const logout = useCallback(async () => {
    const storedCsrfToken = csrfToken ?? readCsrfToken();
    if (storedCsrfToken) {
      // Best-effort: сервер может вернуть 403/401, но мы всё равно очищаем локальную сессию
      try {
        await request("/auth/logout", {
          method: "POST",
          headers: { "X-CSRF-Token": storedCsrfToken },
        });
      } catch {
        // ignore — local state is cleared below regardless
      }
    }
    writeCsrfToken(null);
    setUser(null);
    setCsrfToken(null);
    setStatus("anonymous");
  }, [csrfToken]);

  useEffect(() => {
    let isMounted = true;
    async function bootstrapAuth(): Promise<void> {
      try {
        await checkAuth();
      } catch {
        if (!isMounted) return;
        setUser(null);
        setCsrfToken(null);
        setStatus("anonymous");
      }
    }
    void bootstrapAuth();
    return () => { isMounted = false; };
  }, [checkAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === "authenticated",
      user,
      csrfToken,
      checkAuth,
      authenticateWithTelegram,
      authenticateWithPhone,
      logout,
    }),
    [authenticateWithPhone, authenticateWithTelegram, checkAuth, csrfToken, logout, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export type { AuthUser, TelegramUser };
