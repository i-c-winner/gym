"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Button, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { useTranslation } from "react-i18next";
import { languageStorageKey } from "@/shared/i18n/config";

const languages = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
] as const;

function Header() {
  const { i18n, t } = useTranslation();
  const pathname = usePathname();
  const [languageAnchor, setLanguageAnchor] = useState<null | HTMLElement>(null);
  const currentLanguage =
    languages.find((language) => language.code === i18n.language) ?? languages[0];

  const items = [
    { label: t("header.programs"), href: "/programs" },
    { label: t("header.account"), href: "/account" },
  ];

  const handleLanguageChange = (languageCode: (typeof languages)[number]["code"]) => {
    void i18n.changeLanguage(languageCode);
    window.localStorage.setItem(languageStorageKey, languageCode);
    setLanguageAnchor(null);
  };

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        width: "100%",
        px: { xs: 2, sm: 3, md: 5 },
        pt: { xs: 2, sm: 2.5 },
      }}
    >
      <Box
        sx={{
          maxWidth: "1280px",
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: { xs: 2, sm: 2.5, md: 3 },
          py: { xs: 1.25, sm: 1.5 },
          border: "1px solid rgba(62, 56, 47, 0.08)",
          borderRadius: "999px",
          bgcolor: "rgba(255, 253, 248, 0.82)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 10px 24px rgba(62, 56, 47, 0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: { xs: "1.25rem", md: "1.5rem" },
              fontWeight: 700,
              color: "text.primary",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            Gym
          </Typography>
          <Box sx={{ width: "1px", height: 20, bgcolor: "rgba(62, 56, 47, 0.15)", mx: 0.5 }} />
          <IconButton
            component={Link}
            href="/main"
            aria-label={t("header.main")}
            sx={{
              color: pathname === "/main" ? "secondary.main" : "text.secondary",
              bgcolor: pathname === "/main" ? "rgba(184, 159, 116, 0.12)" : "transparent",
              border: "1px solid",
              borderColor: pathname === "/main" ? "rgba(184, 159, 116, 0.3)" : "transparent",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(184, 159, 116, 0.12)",
                borderColor: "rgba(184, 159, 116, 0.3)",
                color: "secondary.main",
              },
            }}
          >
            <HomeRoundedIcon sx={{ fontSize: "1.62rem" }} />
          </IconButton>
        </Box>

        <Box
          component="nav"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: { xs: 0.5, sm: 1 },
            flexWrap: "wrap",
          }}
        >
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Button
                key={item.label}
                component={Link}
                href={item.href}
                sx={{
                  minWidth: "unset",
                  px: { xs: 1.25, sm: 1.75 },
                  py: 0.75,
                  borderRadius: "999px",
                  color: isActive ? "secondary.main" : "text.primary",
                  fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                  fontWeight: isActive ? 600 : 500,
                  lineHeight: 1,
                  bgcolor: isActive ? "rgba(184, 159, 116, 0.1)" : "transparent",
                  border: "1px solid",
                  borderColor: isActive ? "rgba(184, 159, 116, 0.25)" : "transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: isActive ? "rgba(184, 159, 116, 0.14)" : "background.paper",
                    borderColor: isActive ? "rgba(184, 159, 116, 0.3)" : "rgba(62, 56, 47, 0.08)",
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
          <Button
            type="button"
            aria-label={t("header.language")}
            aria-controls={languageAnchor ? "language-menu" : undefined}
            aria-haspopup="menu"
            aria-expanded={languageAnchor ? "true" : undefined}
            onClick={(event) => setLanguageAnchor(event.currentTarget)}
            sx={{
              minWidth: "unset",
              px: 1.25,
              py: 0.75,
              ml: { xs: 0.25, sm: 0.5 },
              borderRadius: "999px",
              border: "1px solid rgba(62, 56, 47, 0.12)",
              bgcolor: "rgba(255, 253, 248, 0.6)",
              boxShadow: "0 2px 8px rgba(62, 56, 47, 0.08)",
              color: "text.primary",
              gap: 0.5,
              lineHeight: 1,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "background.paper",
                borderColor: "rgba(62, 56, 47, 0.16)",
                boxShadow: "0 4px 12px rgba(62, 56, 47, 0.1)",
              },
            }}
          >
            <Box component="span" sx={{ fontSize: "1rem", lineHeight: 1 }}>
              {currentLanguage.flag}
            </Box>
            <Box
              component="span"
              sx={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em", opacity: 0.6 }}
            >
              {currentLanguage.code.toUpperCase()}
            </Box>
          </Button>
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
                  border: "1px solid rgba(62, 56, 47, 0.08)",
                  boxShadow: "0 14px 34px rgba(62, 56, 47, 0.14)",
                  overflow: "hidden",
                },
              },
            }}
          >
            {languages.map((language) => {
              const isSelected = language.code === currentLanguage.code;
              return (
                <MenuItem
                  key={language.code}
                  selected={isSelected}
                  onClick={() => handleLanguageChange(language.code)}
                  sx={{
                    gap: 1.25,
                    minWidth: 150,
                    fontSize: "0.9375rem",
                    fontWeight: isSelected ? 600 : 400,
                    transition: "background-color 0.15s ease",
                    "&.Mui-selected": {
                      bgcolor: "rgba(184, 159, 116, 0.08)",
                      "&:hover": { bgcolor: "rgba(184, 159, 116, 0.14)" },
                    },
                  }}
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
                      border: isSelected ? "2px solid rgba(184, 159, 116, 0.4)" : "2px solid #ffffff",
                      bgcolor: "rgba(255, 253, 248, 0.7)",
                      boxShadow: "0 3px 10px rgba(62, 56, 47, 0.12)",
                      fontSize: "1rem",
                    }}
                  >
                    {language.flag}
                  </Box>
                  {language.label}
                </MenuItem>
              );
            })}
          </Menu>
        </Box>
      </Box>
    </Box>
  );
}

export { Header };
