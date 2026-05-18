"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
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

// ── Shared nav content ────────────────────────────────────────────────────────

function SidebarContent({
  navItems,
  settingsLabel,
  logoutLabel,
  onLogout,
  onNavigate,
}: AccountSidebarProps & { onNavigate?: () => void }) {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography
          sx={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "2rem",
            color: "text.primary",
          }}
        >
          Balance
        </Typography>
        <Typography sx={{ fontSize: "1rem", color: "text.secondary" }}>
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
            onClick={onNavigate}
            sx={{
              justifyContent: "flex-start",
              minHeight: 52,
              px: 2,
              borderRadius: 3,
              bgcolor: item.active ? "rgba(184,159,116,0.16)" : "transparent",
              color: item.active ? "secondary.main" : "text.primary",
              fontWeight: item.active ? 700 : 500,
              fontSize: "1rem",
            }}
          >
            {item.label}
          </Button>
        ))}
      </Stack>

      <Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />

      <Stack spacing={1}>
        <Button
          component={Link}
          href="/main"
          startIcon={<SettingsOutlinedIcon fontSize="small" />}
          onClick={onNavigate}
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
          onClick={() => { onNavigate?.(); onLogout(); }}
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
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function AccountSidebar({
  navItems,
  settingsLabel = "Настройки",
  logoutLabel = "Выйти",
  onLogout,
}: AccountSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeItem = navItems.find((i) => i.active);

  // ── Mobile: compact trigger bar + Drawer ──────────────────────────────────
  if (isMobile) {
    return (
      <>
        <CardShell>
          <Box
            sx={{
              px: 2,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography
                sx={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "text.primary",
                  lineHeight: 1,
                }}
              >
                Balance
              </Typography>
              {activeItem && (
                <>
                  <Box sx={{ width: "1px", height: 16, bgcolor: "divider" }} />
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <Box sx={{ color: "secondary.main", display: "flex", fontSize: "1rem" }}>
                      {activeItem.icon}
                    </Box>
                    <Typography
                      sx={{ fontSize: "0.9rem", fontWeight: 600, color: "text.primary" }}
                    >
                      {activeItem.label}
                    </Typography>
                  </Stack>
                </>
              )}
            </Stack>
            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Открыть меню"
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1.5px solid",
                borderColor: "divider",
                color: "text.primary",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: "1.2rem" }} />
            </IconButton>
          </Box>
        </CardShell>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          slotProps={{
            paper: {
              sx: {
                width: 280,
                borderRadius: "0 20px 20px 0",
                bgcolor: "background.paper",
                p: 2.5,
                pt: 3,
              },
            },
          }}
        >
          {/* Drawer header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Typography
              sx={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "1.5rem",
                color: "text.primary",
                fontWeight: 700,
              }}
            >
              Меню
            </Typography>
            <IconButton
              onClick={() => setDrawerOpen(false)}
              sx={{
                width: 36,
                height: 36,
                border: "1.5px solid",
                borderColor: "divider",
                color: "text.secondary",
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: "1rem" }} />
            </IconButton>
          </Box>

          <SidebarContent
            navItems={navItems}
            settingsLabel={settingsLabel}
            logoutLabel={logoutLabel}
            onLogout={onLogout}
            onNavigate={() => setDrawerOpen(false)}
          />
        </Drawer>
      </>
    );
  }

  // ── Desktop: full sidebar ─────────────────────────────────────────────────
  return (
    <CardShell>
      <Box sx={{ p: 3, height: "100%" }}>
        <SidebarContent
          navItems={navItems}
          settingsLabel={settingsLabel}
          logoutLabel={logoutLabel}
          onLogout={onLogout}
        />
      </Box>
    </CardShell>
  );
}

export { AccountSidebar };
export type { NavItem };
