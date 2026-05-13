"use client";

import Link from "next/link";
import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { CardShell } from "@/shared/ui/CardShell";

type AccountPageHeaderProps = {
  title: React.ReactNode;
  subtitle?: string;
  displayName: string;
  profileSubtitle: string;
  backHref?: string;
};

function AccountPageHeader({
  title,
  subtitle,
  displayName,
  profileSubtitle,
  backHref,
}: AccountPageHeaderProps) {
  return (
    <CardShell>
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {backHref ? (
            <IconButton
              component={Link}
              href={backHref}
              sx={{ border: "1px solid rgba(62, 56, 47, 0.08)", bgcolor: "background.paper" }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
          ) : null}
          <Box>
            <Typography
              sx={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: { xs: "2rem", md: "3rem" },
                color: "text.primary",
                lineHeight: 1.05,
              }}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography sx={{ mt: 1, fontSize: "1.125rem", color: "text.secondary" }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          sx={{ width: { xs: "100%", md: "auto" }, justifyContent: "flex-end", alignItems: "center" }}
        >
          <IconButton sx={{ border: "1px solid rgba(62, 56, 47, 0.08)", bgcolor: "background.paper" }}>
            <NotificationsNoneOutlinedIcon />
          </IconButton>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar src="/images/assets_page-editor_2.1720702297.png" sx={{ width: 56, height: 56 }} />
            <Box>
              <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, color: "text.primary" }}>
                {displayName}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>{profileSubtitle}</Typography>
            </Box>
            <KeyboardArrowDownRoundedIcon sx={{ color: "text.secondary" }} />
          </Stack>
        </Stack>
      </Box>
    </CardShell>
  );
}

export { AccountPageHeader };