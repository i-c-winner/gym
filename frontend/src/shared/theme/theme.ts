"use client";

import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#2e7d32",
      light: "#c8e6c9",
    },
    secondary: {
      main: "#ef6c00",
    },
    background: {
      default: "#edf2e8",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: "var(--font-sans), sans-serif",
    h2: {
      fontWeight: 800,
    },
    h5: {
      fontWeight: 700,
    },
  },
});
