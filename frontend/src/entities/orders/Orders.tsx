import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { BigButtons } from "@/widgets/bigButtons/BigButtons";

function Orders() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1240px",
        mx: "auto",
        px: { xs: 2, sm: 3, md: 0 },
        py: { xs: 5, md: 7 },
      }}
    >
      <Typography className="orders-title">
        Присоедениться к занятиям
      </Typography>

      <Box
        sx={{
          mt: { xs: 3, md: 4 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: { xs: 2.5, md: 2 },
        }}
      >
        <BigButtons
          title="Месяц"
          price="€29,99/month"
          textButton="FREE 7-DAY TRIAL"
          subtitle="Billed monthly. The renewal is automatic and you can cancel at any time."
        />

        <BigButtons
          title="6 Месяцев"
          price="€29,99/month"
          textButton="FREE 7-DAY TRIAL"
          subtitle="Billed monthly. The renewal is automatic and you can cancel at any time."
        />

        <BigButtons
          title="Год"
          price="Save 50% - €14,99/month"
          textButton="FREE 7-DAY TRIAL"
          subtitle="One-time payment of €179,99. The renewal is automatic and you can cancel at any time."
        />
      </Box>
    </Box>
  );
}

export { Orders };
