"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import OndemandVideoOutlinedIcon from "@mui/icons-material/OndemandVideoOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { getAccountProgramAccessesStub } from "@/shared/api/programs";
import { useAuth } from "@/shared/auth/auth-context";
import { ProgramCards, type ProgramCardItem } from "@/widgets/programCards/ui/ProgramCards";

const navigationItems = [
  { labelKey: "accountMyPrograms.navigation.home", icon: <HomeOutlinedIcon fontSize="small" />, href: "/main" },
  {
    labelKey: "accountMyPrograms.navigation.programs",
    icon: <AppsOutlinedIcon fontSize="small" />,
    href: "/account/programs",
    active: true,
  },
  { labelKey: "accountMyPrograms.navigation.lessons", icon: <OndemandVideoOutlinedIcon fontSize="small" />, href: "/main" },
  { labelKey: "accountMyPrograms.navigation.workouts", icon: <FitnessCenterOutlinedIcon fontSize="small" />, href: "/main" },
  { labelKey: "accountMyPrograms.navigation.calendar", icon: <CalendarMonthOutlinedIcon fontSize="small" />, href: "/main" },
  { labelKey: "accountMyPrograms.navigation.favorites", icon: <FavoriteBorderOutlinedIcon fontSize="small" />, href: "/main" },
];

const connectedPrograms = [
  {
    key: "flexibility",
    image: "/images/assets_page-editor_1.1720702264.png",
    progress: 66,
    accent: "#b98173",
  },
  {
    key: "strength",
    image: "/images/assets_page-editor_2.1720702297.png",
    progress: 42,
    accent: "#6a7b6a",
  },
  {
    key: "split",
    image: "/images/assets_page-editor_3.1720616225.png",
    progress: 28,
    accent: "#b89f74",
  },
  {
    key: "rhythmic",
    image: "/images/top.jpeg",
    progress: 74,
    accent: "#8f6f5f",
  },
];

type ConnectedProgram = (typeof connectedPrograms)[number];

function buildProgramCard(
  program: ConnectedProgram,
  hasAccess: boolean,
  t: (key: string) => string
): ProgramCardItem {
  return {
    id: program.key,
    title: t(`accountMyPrograms.programs.${program.key}.title`),
    description: t(`accountMyPrograms.programs.${program.key}.description`),
    lessons: t(`accountMyPrograms.programs.${program.key}.lessons`),
    duration: t(`accountMyPrograms.programs.${program.key}.duration`),
    status: t(`accountMyPrograms.programs.${program.key}.status`),
    image: program.image,
    progress: program.progress,
    accent: program.accent,
    hasAccess,
    href: hasAccess ? "/account/myPrograms" : undefined,
  };
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        bgcolor: "rgba(255, 253, 248, 0.88)",
        border: "1px solid rgba(62, 56, 47, 0.08)",
        boxShadow: "0 16px 40px rgba(62, 56, 47, 0.08)",
      }}
    >
      {children}
    </Box>
  );
}

function MyPrograms() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, status, logout } = useAuth();
  const [accessByProgramSlug, setAccessByProgramSlug] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadProgramAccesses(): Promise<void> {
      const accesses = await getAccountProgramAccessesStub();
      if (!isMounted) {
        return;
      }

      setAccessByProgramSlug(
        Object.fromEntries(accesses.map((access) => [access.programSlug, access.hasAccess]))
      );
    }

    void loadProgramAccesses();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    const parts = [user?.first_name, user?.last_name].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ");
    }

    if (user?.telegram_id) {
      return `Telegram ${user.telegram_id}`;
    }

    if (user?.telephone) {
      return user.telephone;
    }

    return t("accountMyPrograms.profile.fallbackName");
  }, [t, user]);

  const profileSubtitle = useMemo(() => {
    if (user?.telephone) {
      return user.telephone;
    }

    if (user?.telegram_id) {
      return `Telegram ID: ${user.telegram_id}`;
    }

    return t("accountMyPrograms.profile.fallbackPlan");
  }, [t, user]);

  if (status === "loading") {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
          px: 2,
        }}
      >
        <Typography sx={{ fontSize: "1.125rem", color: "text.secondary" }}>
          {t("accountMyPrograms.loading")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, lg: 2.25 }}>
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
                  {navigationItems.map((item) => (
                    <Button
                      key={item.labelKey}
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
                      {t(item.labelKey)}
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
                    {t("accountMyPrograms.navigation.settings")}
                  </Button>
                  <Button
                    onClick={() => {
                      void logout().then(() => {
                        router.replace("/");
                      });
                    }}
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
                    {t("accountMyPrograms.navigation.logout")}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardShell>
        </Grid>

        <Grid size={{ xs: 12, lg: 9.75 }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
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
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: { xs: "2rem", md: "3rem" },
                      color: "text.primary",
                      lineHeight: 1.05,
                    }}
                  >
                    {t("accountMyPrograms.title")}
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: "1.125rem", color: "text.secondary" }}>
                    {t("accountMyPrograms.subtitle")}
                  </Typography>
                </Box>

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

            <ProgramCards
              items={connectedPrograms.map((program) =>
                buildProgramCard(program, accessByProgramSlug[program.key] ?? false, t)
              )}
              size="high"
              actionLabel={t("accountMyPrograms.actions.open")}
              disabledActionLabel={t("accountMyPrograms.actions.noAccess")}
              durationLabel={t("accountMyPrograms.labels.duration")}
              lessonsLabel={t("accountMyPrograms.labels.lessons")}
              lockedLabel={t("accountMyPrograms.access.locked")}
              progressLabel={t("accountMyPrograms.labels.progress")}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export { MyPrograms };
