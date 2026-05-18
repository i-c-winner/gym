import { Box } from "@mui/material";

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(143, 163, 143, 0.18)"
            : "rgba(62, 56, 47, 0.08)",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 4px 24px rgba(0, 0, 0, 0.45)"
            : "0 16px 40px rgba(62, 56, 47, 0.08)",
      }}
    >
      {children}
    </Box>
  );
}

export { CardShell };
