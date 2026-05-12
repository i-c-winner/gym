"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { useAuth } from "@/shared/auth/auth-context";

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

const programImages: Record<string, string> = {
  flexibility: "/images/assets_page-editor_1.1720702264.png",
  strength: "/images/assets_page-editor_2.1720702297.png",
  split: "/images/assets_page-editor_3.1720616225.png",
  rhythmic: "/images/top.jpeg",
};

const programAccents: Record<string, string> = {
  flexibility: "#b98173",
  strength: "#6a7b6a",
  split: "#b89f74",
  rhythmic: "#8f6f5f",
};

const programProgress: Record<string, number> = {
  flexibility: 66,
  strength: 42,
  split: 28,
  rhythmic: 74,
};

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

type LessonItem = {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
};

function getLessons(slug: string): LessonItem[] {
  const counts: Record<string, number> = {
    flexibility: 12,
    strength: 10,
    split: 15,
    rhythmic: 11,
  };
  const count = counts[slug] ?? 8;
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Урок ${i + 1}`,
    duration: `${20 + (i % 4) * 5} мин`,
    completed: i < Math.floor(count * (programProgress[slug] ?? 0) / 100),
  }));
}

function Program({ slug }: { slug: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const image = programImages[slug] ?? "/images/assets_page-editor_1.1720702264.png";
  const accent = programAccents[slug] ?? "#b98173";
  const progress = programProgress[slug] ?? 0;
  const lessons = getLessons(slug);

  const title = t(`accountMyPrograms.programs.${slug}.title`);
  const description = t(`accountMyPrograms.programs.${slug}.description`);
  const lessonsLabel = t(`accountMyPrograms.programs.${slug}.lessons`);
  const duration = t(`accountMyPrograms.programs.${slug}.duration`);
  const status = t(`accountMyPrograms.programs.${slug}.status`);

  const displayName = useMemo(() => {
    const parts = [user?.first_name, user?.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    if (user?.telegram_id) return `Telegram ${user.telegram_id}`;
    if (user?.telephone) return user.telephone;
    return t("accountMyPrograms.profile.fallbackName");
  }, [t, user]);

  const profileSubtitle = useMemo(() => {
    if (user?.telephone) return user.telephone;
    if (user?.telegram_id) return `Telegram ID: ${user.telegram_id}`;
    return t("accountMyPrograms.profile.fallbackPlan");
  }, [t, user]);

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
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <IconButton
                    component={Link}
                    href="/account/programs"
                    sx={{ border: "1px solid rgba(62, 56, 47, 0.08)", bgcolor: "background.paper" }}
                  >
                    <ArrowBackRoundedIcon />
                  </IconButton>
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
                    <Typography sx={{ mt: 0.5, fontSize: "1.125rem", color: "text.secondary" }}>
                      {description}
                    </Typography>
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

            <CardShell>
              <Box sx={{ p: 1.5 }}>
                <Box
                  sx={{
                    minHeight: { xs: 220, sm: 320 },
                    borderRadius: 3,
                    overflow: "hidden",
                    position: "relative",
                    backgroundImage: `linear-gradient(180deg, rgba(47,42,36,0.02) 0%, rgba(47,42,36,0.55) 100%), url('${image}')`,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    display: "flex",
                    alignItems: "flex-end",
                  }}
                >
                  <Chip
                    label={status}
                    sx={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      bgcolor: "rgba(255, 253, 248, 0.92)",
                      color: "text.primary",
                      fontWeight: 600,
                    }}
                  />
                </Box>

                <Box sx={{ p: { xs: 1, md: 1.5 }, pt: 2 }}>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <PlayCircleOutlineRoundedIcon sx={{ color: "secondary.main" }} />
                        <Box>
                          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
                            {t("accountMyPrograms.labels.lessons")}
                          </Typography>
                          <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                            {lessonsLabel}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <AccessTimeRoundedIcon sx={{ color: "secondary.main" }} />
                        <Box>
                          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
                            {t("accountMyPrograms.labels.duration")}
                          </Typography>
                          <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                            {duration}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>

                  <Stack direction="row" sx={{ mb: 1, justifyContent: "space-between" }}>
                    <Typography sx={{ color: "text.secondary" }}>
                      {t("accountMyPrograms.labels.progress")}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                      {progress}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 7,
                      borderRadius: 999,
                      bgcolor: "rgba(184, 159, 116, 0.18)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        bgcolor: accent,
                      },
                    }}
                  />
                </Box>
              </Box>
            </CardShell>

            <CardShell>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Stack spacing={1}>
                  {lessons.map((lesson) => (
                    <Box
                      key={lesson.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: 3,
                        bgcolor: lesson.completed ? "rgba(184, 159, 116, 0.10)" : "rgba(62, 56, 47, 0.04)",
                        border: "1px solid",
                        borderColor: lesson.completed ? "rgba(184, 159, 116, 0.24)" : "rgba(62, 56, 47, 0.06)",
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <PlayCircleOutlineRoundedIcon
                          sx={{ color: lesson.completed ? accent : "text.disabled", fontSize: 28 }}
                        />
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
                            {lesson.title}
                          </Typography>
                          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                            {lesson.duration}
                          </Typography>
                        </Box>
                      </Stack>
                      {lesson.completed ? (
                        <Chip
                          label="Пройден"
                          size="small"
                          sx={{ bgcolor: "rgba(184, 159, 116, 0.18)", color: "text.primary", fontWeight: 600 }}
                        />
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </CardShell>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export { Program };