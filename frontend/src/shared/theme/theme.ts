import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6a7b6a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#b89f74",
    },
    background: {
      default: "#f4f0e8",
      paper: "#fffdf8",
    },
    text: {
      primary: "#2f2a24",
      secondary: "#5f584f",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: [
      '"Open Sauce One"',
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "sans-serif",
    ].join(", "),
    h1: {
      fontWeight: 700,
      lineHeight: 1.05,
    },
    h2: {
      fontWeight: 700,
      lineHeight: 1.1,
    },
    h3: {
      fontWeight: 700,
      lineHeight: 1.1,
    },
    h4: {
      fontWeight: 700,
      lineHeight: 1.15,
    },
    h5: {
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 600,
      lineHeight: 1.2,
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
    body1: {
      lineHeight: 1.65,
    },
    body2: {
      lineHeight: 1.6,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at top, rgba(46, 125, 50, 0.14), transparent 32%), linear-gradient(180deg, #f4f7f2 0%, #edf2e8 100%)",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          "&.triptych-main-title": {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(2.125rem, 4vw, 3.25rem)",
            lineHeight: 1.05,
            color: "#3e382f",
          },
          "&.triptych-body": {
            fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
            lineHeight: 1.75,
            color: "#544d44",
          },
          "&.triptych-lead": {
            fontSize: "clamp(1rem, 1.3vw, 1.125rem)",
            lineHeight: 1.7,
            color: "#544d44",
          },
          "&.triptych-card-title": {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(1.75rem, 2.2vw, 2.125rem)",
            lineHeight: 1.1,
            color: "#3e382f",
          },
          "&.triptych-card-text": {
            fontSize: "1rem",
            lineHeight: 1.7,
            color: "#544d44",
          },
          "&.double-title": {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(1.875rem, 3.3vw, 2.875rem)",
            lineHeight: 1.08,
            color: "#3e382f",
          },
          "&.double-body": {
            fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
            lineHeight: 1.75,
            color: "#5d564d",
          },
          "&.double-mini-title": {
            fontSize: "1.125rem",
            fontWeight: 600,
            lineHeight: 1.25,
            color: "#3e382f",
          },
          "&.double-mini-text": {
            fontSize: "0.875rem",
            lineHeight: 1.65,
            color: "#5d564d",
          },
          "&.haos-title": {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(2rem, 3.8vw, 3.25rem)",
            lineHeight: 1.08,
            color: "#fffaf3",
            textAlign: "center",
            textShadow: "0 2px 16px rgba(62, 56, 47, 0.22)",
          },
          "&.haos-review": {
            textAlign: "center",
            fontSize: "0.9375rem",
            lineHeight: 1.6,
            color: "#52493f",
          },
          "&.thumbnail-title": {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(2.125rem, 3vw, 2.625rem)",
            fontWeight: 700,
            lineHeight: 1.06,
            color: "#fff9f2",
            textShadow: "0 2px 18px rgba(38, 31, 24, 0.32)",
          },
          "&.thumbnail-meta": {
            fontSize: "clamp(1.125rem, 1.5vw, 1.25rem)",
            fontWeight: 700,
            lineHeight: 1,
            color: "#fff9f2",
            textShadow: "0 2px 18px rgba(38, 31, 24, 0.32)",
          },
          "&.gallery-hint": {
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "#7a7065",
          },
          "&.big-buttons-title": {
            fontSize: "clamp(2rem, 3vw, 2.5rem)",
            fontWeight: 700,
            lineHeight: 1.05,
            textAlign: "center",
            color: "#fffdf8",
            textTransform: "uppercase",
          },
          "&.big-buttons-price": {
            fontSize: "clamp(1.5rem, 2vw, 1.875rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            textAlign: "center",
            color: "#fffdf8",
          },
          "&.big-buttons-button": {
            fontSize: "clamp(1.125rem, 1.6vw, 1.375rem)",
            fontWeight: 500,
            lineHeight: 1,
            textAlign: "center",
            color: "#2f2a24",
            textTransform: "uppercase",
          },
          "&.big-buttons-subtitle": {
            fontSize: "clamp(0.9375rem, 1.2vw, 1.0625rem)",
            fontWeight: 500,
            lineHeight: 1.5,
            textAlign: "center",
            color: "#fffdf8",
          },
          "&.orders-title": {
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(2.25rem, 3.8vw, 3.25rem)",
            lineHeight: 1.08,
            textAlign: "center",
            color: "#3e382f",
          },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

export { theme };
