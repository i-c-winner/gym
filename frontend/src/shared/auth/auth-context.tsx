"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AUTH_STORAGE_KEY = "gym.isAuthenticated";
const AUTH_USER_STORAGE_KEY = "gym.telegramUser";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
};

type AuthContextValue = {
  status: AuthStatus;
  isAuthenticated: boolean;
  user: TelegramUser | null;
  checkAuth: () => void;
  login: (user?: TelegramUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readAuthFlag(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

function readAuthUser(): TelegramUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as TelegramUser;
  } catch {
    return null;
  }
}

function writeAuthFlag(value: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, String(value));
}

function writeAuthUser(user: TelegramUser | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<TelegramUser | null>(null);

  const checkAuth = useCallback(() => {
    const nextUser = readAuthUser();
    const nextStatus = readAuthFlag() ? "authenticated" : "anonymous";

    setUser(nextUser);
    setStatus(nextStatus);
  }, []);

  const login = useCallback((nextUser?: TelegramUser | null) => {
    writeAuthFlag(true);
    writeAuthUser(nextUser ?? null);
    setUser(nextUser ?? null);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    writeAuthFlag(false);
    writeAuthUser(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === "authenticated",
      user,
      checkAuth,
      login,
      logout,
    }),
    [checkAuth, login, logout, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export type { TelegramUser };
