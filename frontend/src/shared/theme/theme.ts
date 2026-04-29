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
