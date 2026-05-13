"use client";

import Link from "next/link";
import { Box, Button, Stack, Typography } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { CardShell } from "@/shared/ui/CardShell";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
};

type AccountSidebarProps = {
  navItems: NavItem[];
  settingsLabel?: string;
  logoutLabel?: string;
  onLogout: () => void;
};

function AccountSidebar({
  navItems,
  settingsLabel = "Настройки",
  logoutLabel = "Выйти",
  onLogout,
}: AccountSidebarProps) {
  return (
    <CardShell>
      <Box sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography
              sx={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: { xs: "2rem", md: "2.25rem" },
                color: "text.primary",
              }}
            >
              Balance
            </Typography>
            <Typography sx={{ fontSize: "1.125rem", color: "text.secondary" }}>
              online
            </Typography>
          </Stack>

          <Stack spacing={1}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={Link}
                href={item.href}
                startIcon={item.icon}
                sx={{
                  justifyContent: "flex-start",
                  minHeight: 52,
                  px: 2,
                  borderRadius: 3,
                  bgcolor: item.active ? "rgba(184, 159, 116, 0.16)" : "transparent",
                  color: "text.primary",
                  fontSize: "1rem",
                  fontWeight: 500,
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          <Box sx={{ borderTop: "1px solid rgba(62, 56, 47, 0.08)" }} />

          <Stack spacing={1}>
            <Button
              component={Link}
              href="/main"
              startIcon={<SettingsOutlinedIcon fontSize="small" />}
              sx={{
                justifyContent: "flex-start",
                minHeight: 52,
                px: 2,
                borderRadius: 3,
                color: "text.primary",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            >
              {settingsLabel}
            </Button>
            <Button
              onClick={onLogout}
              startIcon={<LogoutOutlinedIcon fontSize="small" />}
              sx={{
                justifyContent: "flex-start",
                minHeight: 52,
                px: 2,
                borderRadius: 3,
                color: "text.primary",
                fontSize: "1rem",
                fontWeight: 500,
              }}
            >
              {logoutLabel}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </CardShell>
  );
}

export { AccountSidebar };
export type { NavItem };