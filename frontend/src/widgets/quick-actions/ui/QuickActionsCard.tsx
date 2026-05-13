import { Box, Stack, Typography } from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { CardShell } from "@/shared/ui/CardShell";

type QuickActionItem = {
  title: string;
  subtitle: string;
};

type QuickActionsCardProps = {
  items: QuickActionItem[];
};

function QuickActionsCard({ items }: QuickActionsCardProps) {
  return (
    <CardShell>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography
          sx={{
            mb: 2,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: { xs: "1.75rem", md: "2rem" },
            color: "text.primary",
          }}
        >
          Быстрые действия
        </Typography>
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Stack
              key={item.title}
              direction="row"
              sx={{
                px: 1,
                py: 1.5,
                borderRadius: 2.5,
                bgcolor: "rgba(255, 253, 248, 0.76)",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, color: "text.primary" }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: "text.secondary" }}>{item.subtitle}</Typography>
              </Box>
              <ChevronRightRoundedIcon sx={{ color: "text.secondary" }} />
            </Stack>
          ))}
        </Stack>
      </Box>
    </CardShell>
  );
}

export { QuickActionsCard };
export type { QuickActionItem };