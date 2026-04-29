"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "@/shared/auth/auth-context";
import { theme } from "@/shared/theme/theme";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}

export { Providers };
