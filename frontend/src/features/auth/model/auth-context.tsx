"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { User } from "@/entities/user";
import { ApiError } from "@/shared/api";

import { authApi } from "../api/auth-api";
import type { AuthStatus, LoginPayload, RegisterPayload } from "./types";

const CSRF_STORAGE_KEY = "gym.csrfToken";

type AuthContextValue = {
  user: User | null;
  csrfToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  checkAuth: () => Promise<User | null>;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  refresh: () => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

function readStoredCsrfToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(CSRF_STORAGE_KEY);
}

function storeCsrfToken(csrfToken: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (csrfToken) {
    window.localStorage.setItem(CSRF_STORAGE_KEY, csrfToken);
    return;
  }

  window.localStorage.removeItem(CSRF_STORAGE_KEY);
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");

  const applySession = useCallback((nextUser: User, nextCsrfToken: string) => {
    setUser(nextUser);
    setCsrfToken(nextCsrfToken);
    storeCsrfToken(nextCsrfToken);
    setStatus("authenticated");

    return nextUser;
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setCsrfToken(null);
    storeCsrfToken(null);
    setStatus("anonymous");
  }, []);

  const checkAuth = useCallback(async () => {
    setStatus("loading");

    try {
      const currentUser = await authApi.me();
      const storedCsrfToken = readStoredCsrfToken();

      setUser(currentUser);
      setCsrfToken(storedCsrfToken);
      setStatus("authenticated");

      return currentUser;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        return null;
      }

      setStatus("anonymous");
      throw error;
    }
  }, [clearSession]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setStatus("loading");
      const session = await authApi.login(payload);

      return applySession(session.user, session.csrfToken);
    },
    [applySession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setStatus("loading");
      const session = await authApi.register(payload);

      return applySession(session.user, session.csrfToken);
    },
    [applySession],
  );

  const refresh = useCallback(async () => {
    const token = csrfToken ?? readStoredCsrfToken();

    if (!token) {
      clearSession();
      throw new Error("CSRF token is missing");
    }

    setStatus("loading");
    const session = await authApi.refresh(token);

    return applySession(session.user, session.csrfToken);
  }, [applySession, clearSession, csrfToken]);

  const logout = useCallback(async () => {
    const token = csrfToken ?? readStoredCsrfToken();

    if (token) {
      await authApi.logout(token);
    }

    clearSession();
  }, [clearSession, csrfToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      csrfToken,
      status,
      isAuthenticated: status === "authenticated",
      checkAuth,
      login,
      register,
      refresh,
      logout,
    }),
    [checkAuth, csrfToken, login, logout, refresh, register, status, user],
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
