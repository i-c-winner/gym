"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { appTheme } from "@/shared/theme/theme";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
