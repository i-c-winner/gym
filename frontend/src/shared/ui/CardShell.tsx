import { Box } from "@mui/material";

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        bgcolor: "rgba(255, 253, 248, 0.88)",
        border: "1px solid rgba(62, 56, 47, 0.08)",
        boxShadow: "0 16px 40px rgba(62, 56, 47, 0.08)",
      }}
    >
      {children}
    </Box>
  );
}

export { CardShell };
