"use client";

import type React from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "@/shared/auth/auth-context";
import { I18nProvider } from "@/shared/i18n/provider";
import { theme } from "@/shared/theme/theme";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export { Providers };
