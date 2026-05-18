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
              sx={{ border: "1px solid rgba(62, 56, 47, 0.08)", bgcolor: "background.paper", width: 44, height: 44 }}
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
              <Typography sx={{ mt: 1, fontSize: { xs: "0.9375rem", md: "1.125rem" }, color: "text.secondary" }}>
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
          <IconButton sx={{ border: "1px solid rgba(62, 56, 47, 0.08)", bgcolor: "background.paper", width: 44, height: 44 }}>
            <NotificationsNoneOutlinedIcon />
          </IconButton>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
            <Avatar src="/images/assets_page-editor_2.1720702297.png" sx={{ width: { xs: 40, md: 56 }, height: { xs: 40, md: 56 }, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: "0.9375rem", md: "1.125rem" }, fontWeight: 600, color: "text.primary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: { xs: "0.8125rem", md: "1rem" }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profileSubtitle}</Typography>
            </Box>
            <KeyboardArrowDownRoundedIcon sx={{ color: "text.secondary", flexShrink: 0 }} />
          </Stack>
        </Stack>
      </Box>
    </CardShell>
  );
}

export { AccountPageHeader };