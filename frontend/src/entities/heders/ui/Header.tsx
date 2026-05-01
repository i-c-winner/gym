"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, Button, Menu, MenuItem, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { languageStorageKey } from "@/shared/i18n/config";

const languages = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
] as const;

function Header() {
  const { i18n } = useTranslation();
  const [languageAnchor, setLanguageAnchor] = useState<null | HTMLElement>(
    null,
  );
  const currentLanguage =
    languages.find((language) => language.code === i18n.language) ??
    languages[0];

  const items = [
    { label: "Регистрация", href: "/" },
    { label: "Главная", href: "/main" },
    { label: "Кабинет", href: "/account" },
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
          backdropFilter: "blur(14px)",
          boxShadow: "0 10px 24px rgba(62, 56, 47, 0.08)",
        }}
      >
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
          {items.map((item) => (
            <Button
              key={item.label}
              component={Link}
              href={item.href}
              sx={{
                minWidth: "unset",
                px: { xs: 1.25, sm: 1.75 },
                py: 0.75,
                borderRadius: "999px",
                color: "text.primary",
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                fontWeight: 500,
                lineHeight: 1,
                bgcolor: "transparent",
                border: "1px solid transparent",
                "&:hover": {
                  bgcolor: "background.paper",
                  borderColor: "rgba(62, 56, 47, 0.08)",
                },
              }}
            >
              {item.label}
            </Button>
          ))}
          <Button
            type="button"
            aria-label="Выбрать язык"
            aria-controls={languageAnchor ? "language-menu" : undefined}
            aria-haspopup="menu"
            aria-expanded={languageAnchor ? "true" : undefined}
            onClick={(event) => setLanguageAnchor(event.currentTarget)}
            sx={{
              minWidth: 38,
              width: 38,
              height: 38,
              p: 0,
              ml: { xs: 0.25, sm: 0.5 },
              borderRadius: "50%",
              border: "2px solid #ffffff",
              bgcolor: "rgba(255, 253, 248, 0.34)",
              boxShadow: "0 6px 14px rgba(62, 56, 47, 0.14)",
              fontSize: "1.125rem",
              lineHeight: 1,
              "&:hover": {
                bgcolor: "background.paper",
                borderColor: "#ffffff",
              },
            }}
          >
            {currentLanguage.flag}
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
                },
              },
            }}
          >
            {languages.map((language) => (
              <MenuItem
                key={language.code}
                selected={language.code === currentLanguage.code}
                onClick={() => handleLanguageChange(language.code)}
                sx={{
                  gap: 1.25,
                  minWidth: 150,
                  fontSize: "0.9375rem",
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
                    border: "2px solid #ffffff",
                    bgcolor: "rgba(255, 253, 248, 0.7)",
                    boxShadow: "0 3px 10px rgba(62, 56, 47, 0.12)",
                    fontSize: "1rem",
                  }}
                >
                  {language.flag}
                </Box>
                {language.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>
    </Box>
  );
}

export { Header };
