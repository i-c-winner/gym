import { Box, Stack, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

type ProgramCardStatProps = {
  icon: SvgIconComponent;
  label?: string;
  value: string;
};

function ProgramCardStat({ icon: Icon, label, value }: ProgramCardStatProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Icon sx={{ color: "secondary.main" }} />
      <Box>
        {label ? (
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            {label}
          </Typography>
        ) : null}
        <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

export { ProgramCardStat };