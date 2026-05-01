"use client";

import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

function Header() {
  const items = [
    { label: "Регистрация", href: "/" },
    { label: "Главная", href: "/main" },
    { label: "Кабинет", href: "/account" },
  ];

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
        </Box>
      </Box>
    </Box>
  );
}

export { Header };
