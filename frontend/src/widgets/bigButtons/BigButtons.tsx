import { Typography } from "@mui/material";
import { Box } from "@mui/system";

type BigButtonsProps = {
  title: string;
  price: string;
  textButton: string;
  subtitle: string;
};

function BigButtons({
  title,
  price,
  textButton,
  subtitle,
}: BigButtonsProps) {
  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: { xs: "18px", md: "20px" },
        bgcolor: "secondary.main",
        px: { xs: 2.5, sm: 4, md: 6 },
        py: { xs: 4, sm: 5, md: 6 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: { xs: 2, md: 2.5 },
      }}
    >
      <Typography className="big-buttons-title">
        {title}
      </Typography>

      <Typography className="big-buttons-price">
        {price}
      </Typography>

      <Box
        sx={{
          minWidth: { xs: "100%", sm: "auto" },
          px: { xs: 3, md: 4 },
          py: { xs: 1.75, md: 2 },
          borderRadius: "14px",
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 30px rgba(67, 57, 45, 0.08)",
        }}
      >
        <Typography className="big-buttons-button">
          {textButton}
        </Typography>
      </Box>

      <Typography className="big-buttons-subtitle">
        {subtitle}
      </Typography>
    </Box>
  );
}

export { BigButtons };
export type { BigButtonsProps };
