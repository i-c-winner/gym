"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "gym.theme";

const ThemeModeContext = createContext<{
  mode: ThemeMode;
  toggle: () => void;
}>({ mode: "light", toggle: () => {} });

function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") setMode("dark");
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeModeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

function useThemeMode() {
  return useContext(ThemeModeContext);
}

export { ThemeModeProvider, useThemeMode };
