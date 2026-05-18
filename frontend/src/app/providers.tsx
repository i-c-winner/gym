"use client";

import type React from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "@/features/auth/model/auth-context";
import { I18nProvider } from "@/shared/i18n/provider";
import { lightTheme, darkTheme } from "@/shared/theme/theme";
import { ThemeModeProvider, useThemeMode } from "@/shared/theme/ThemeModeContext";

function ThemedApp({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeModeProvider>
      <ThemedApp>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </ThemedApp>
    </ThemeModeProvider>
  );
}

export { Providers };
