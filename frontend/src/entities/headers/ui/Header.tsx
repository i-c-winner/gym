"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

import { useTranslation } from "react-i18next";
import { languageStorageKey } from "@/shared/i18n/config";
import { useThemeMode } from "@/shared/theme/ThemeModeContext";


const languages = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
] as const;

function Header() {
  const { i18n, t } = useTranslation();
  const { mode, toggle } = useThemeMode();
  const [languageAnchor, setLanguageAnchor] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLanguage =
    languages.find((l) => l.code === i18n.language) ?? languages[0];
  const isDark = mode === "dark";
  const navItems = [
    { label: t("header.programs"), href: "/programs", icon: <AppsRoundedIcon /> },
    { label: t("header.account"), href: "/account", icon: <AccountCircleOutlinedIcon /> },
  ];

  const handleLanguageChange = (code: (typeof languages)[number]["code"]) => {
    void i18n.changeLanguage(code);
    window.localStorage.setItem(languageStorageKey, code);
    setLanguageAnchor(null);
  };

  const borderColor = isDark ? "rgba(143,163,143,0.14)" : "rgba(62,56,47,0.08)";
  const bgColor = isDark ? "rgba(31,39,31,0.90)" : "rgba(255,253,248,0.82)";

  return (
    <>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          width: "100%",
          px: { xs: 1.5, sm: 3, md: 5 },
          pt: { xs: 1.5, sm: 2.5 },
        }}
      >
        <Box
          sx={{
            maxWidth: "1280px",
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: { xs: 1.5, sm: 2.5, md: 3 },
            py: { xs: 1, sm: 1.5 },
            border: `1px solid ${borderColor}`,
            borderRadius: "999px",
            bgcolor: bgColor,
            backdropFilter: "blur(14px)",
            boxShadow: isDark ? "0 10px 24px rgba(0,0,0,0.30)" : "0 10px 24px rgba(62,56,47,0.08)",
            transition: "background-color 0.25s, border-color 0.25s",
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
            <Typography
              sx={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: { xs: "1.2rem", md: "1.5rem" },
                fontWeight: 700,
                color: "text.primary",
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              Gym
            </Typography>
            <Box sx={{ width: "1px", height: 20, bgcolor: borderColor, mx: { xs: 0.25, sm: 0.5 } }} />
            <IconButton
              component={Link}
              href="/main"
              aria-label={t("header.main")}
              sx={{
                color: "secondary.main",
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                "&:hover": { bgcolor: "rgba(184,159,116,0.12)" },
              }}
            >
              <HomeRoundedIcon sx={{ fontSize: { xs: "1.3rem", sm: "1.62rem" } }} />
            </IconButton>
          </Box>

          {/* Desktop nav */}
          <Box
            component="nav"
            sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 0.5 }}
          >
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={Link}
                href={item.href}
                sx={{
                  px: 1.75,
                  py: 0.75,
                  borderRadius: "999px",
                  color: "text.primary",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  lineHeight: 1,
                  border: "1px solid transparent",
                  "&:hover": {
                    bgcolor: "background.paper",
                    borderColor,
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Controls (right side) */}
          <Stack direction="row" spacing={{ xs: 0.5, sm: 0.75 }} sx={{ alignItems: "center" }}>
            {/* Theme toggle */}
            <IconButton
              onClick={toggle}
              aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                borderRadius: "50%",
                border: `2px solid ${isDark ? "rgba(143,163,143,0.30)" : "rgba(62,56,47,0.12)"}`,
                bgcolor: isDark ? "rgba(143,163,143,0.10)" : "rgba(255,253,248,0.34)",
                color: isDark ? "#8fa38f" : "#6a7b6a",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: isDark ? "rgba(143,163,143,0.18)" : "rgba(106,123,106,0.10)",
                },
              }}
            >
              {isDark
                ? <LightModeOutlinedIcon sx={{ fontSize: "1.1rem" }} />
                : <DarkModeOutlinedIcon sx={{ fontSize: "1.1rem" }} />}
            </IconButton>

            {/* Language toggle */}
            <Button
              aria-label={t("header.language")}
              aria-controls={languageAnchor ? "language-menu" : undefined}
              aria-haspopup="menu"
              aria-expanded={languageAnchor ? "true" : undefined}
              onClick={(e) => setLanguageAnchor(e.currentTarget)}
              sx={{
                minWidth: { xs: 36, sm: 40 },
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                p: 0,
                borderRadius: "50%",
                border: `2px solid ${isDark ? "rgba(237,233,227,0.20)" : "#fff"}`,
                bgcolor: isDark ? "rgba(237,233,227,0.08)" : "rgba(255,253,248,0.34)",
                boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.25)" : "0 4px 12px rgba(62,56,47,0.14)",
                fontSize: { xs: "1rem", sm: "1.125rem" },
                lineHeight: 1,
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              {currentLanguage.flag}
            </Button>

            {/* Hamburger — mobile only */}
            <IconButton
              onClick={() => setMobileOpen(true)}
              aria-label="Меню"
              sx={{
                display: { xs: "inline-flex", sm: "none" },
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `2px solid ${borderColor}`,
                bgcolor: isDark ? "rgba(143,163,143,0.08)" : "rgba(255,253,248,0.34)",
                color: "text.primary",
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: "1.2rem" }} />
            </IconButton>
          </Stack>
        </Box>
      </Box>

      {/* Language menu */}
      <Menu
        id="language-menu"
        anchorEl={languageAnchor}
        open={Boolean(languageAnchor)}
        onClose={() => setLanguageAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 2,
              border: `1px solid ${borderColor}`,
              boxShadow: isDark ? "0 14px 34px rgba(0,0,0,0.40)" : "0 14px 34px rgba(62,56,47,0.14)",
            },
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === currentLanguage.code}
            onClick={() => handleLanguageChange(lang.code)}
            sx={{ gap: 1.25, minWidth: 150, fontSize: "0.9375rem" }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: `2px solid ${isDark ? "rgba(237,233,227,0.20)" : "#fff"}`,
                bgcolor: isDark ? "rgba(237,233,227,0.08)" : "rgba(255,253,248,0.7)",
                boxShadow: "0 3px 10px rgba(62,56,47,0.12)",
                fontSize: "1rem",
              }}
            >
              {lang.flag}
            </Box>
            {lang.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Mobile bottom drawer */}
      <Drawer
        anchor="bottom"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", sm: "none" } }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px 20px 0 0",
              bgcolor: isDark ? "#1e2b1e" : "#fffdf8",
              px: 2,
              pb: 4,
              pt: 1.5,
            },
          },
        }}
      >
        {/* Handle */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: isDark ? "rgba(143,163,143,0.30)" : "rgba(62,56,47,0.15)" }} />
        </Box>

        {/* Drawer header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "1.375rem",
              fontWeight: 700,
              color: "text.primary",
            }}
          >
            Gym
          </Typography>
          <IconButton
            onClick={() => setMobileOpen(false)}
            sx={{
              width: 36,
              height: 36,
              border: `1px solid ${borderColor}`,
              color: "text.secondary",
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />
          </IconButton>
        </Box>

        {/* Nav items */}
        <Stack spacing={1}>
          {[
            { label: t("header.main"), href: "/main", icon: <HomeRoundedIcon /> },
            ...navItems,
          ].map((item) => (
            <Button
              key={item.href}
              component={Link}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              startIcon={item.icon}
              fullWidth
              sx={{
                justifyContent: "flex-start",
                px: 2.5,
                py: 1.5,
                borderRadius: 3,
                fontSize: "1rem",
                fontWeight: 600,
                color: "text.primary",
                border: `1px solid ${borderColor}`,
                bgcolor: isDark ? "rgba(143,163,143,0.06)" : "rgba(106,123,106,0.04)",
                "&:hover": {
                  bgcolor: isDark ? "rgba(143,163,143,0.14)" : "rgba(106,123,106,0.09)",
                  borderColor: "primary.main",
                },
                "& .MuiButton-startIcon": { mr: 1.5, color: "primary.main" },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Drawer>
    </>
  );
}

export { Header };
