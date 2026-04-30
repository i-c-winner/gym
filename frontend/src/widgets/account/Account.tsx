"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
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
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { useAuth } from "@/shared/auth/auth-context";

const navigationItems = [
  { label: "Главная", icon: <HomeOutlinedIcon fontSize="small" />, href: "/main", active: true },
  { label: "Программы", icon: <AppsOutlinedIcon fontSize="small" />, href: "/main" },
  { label: "Уроки", icon: <OndemandVideoOutlinedIcon fontSize="small" />, href: "/main" },
  { label: "Тренировки", icon: <FitnessCenterOutlinedIcon fontSize="small" />, href: "/main" },
  { label: "Календарь", icon: <CalendarMonthOutlinedIcon fontSize="small" />, href: "/main" },
  { label: "Избранное", icon: <FavoriteBorderOutlinedIcon fontSize="small" />, href: "/main" },
];

const programItems = [
  { title: "Гибкость тела", lessons: "12 уроков", image: "/images/assets_page-editor_1.1720702264.png" },
  { title: "Сила и выносливость", lessons: "10 уроков", image: "/images/assets_page-editor_2.1720702297.png" },
  { title: "Шпагат за 30 дней", lessons: "15 уроков", image: "/images/assets_page-editor_3.1720616225.png" },
  { title: "Художественная гимнастика", lessons: "11 уроков", image: "/images/assets_page-editor_1.1720702264.png" },
];

const recentItems = [
  { title: "Растяжка на всё тело", subtitle: "Урок 7 из 12", duration: "24:15", progress: 66, image: "/images/assets_page-editor_1.1720702264.png" },
  { title: "Гибкость спины", subtitle: "Урок 5 из 10", duration: "18:30", progress: 52, image: "/images/assets_page-editor_2.1720702297.png" },
  { title: "Баланс и координация", subtitle: "Урок 3 из 8", duration: "16:45", progress: 38, image: "/images/assets_page-editor_3.1720616225.png" },
];

const actionItems = [
  { title: "Мой календарь", subtitle: "Запланированные тренировки" },
  { title: "Избранные уроки", subtitle: "Сохранённые уроки" },
  { title: "Мои достижения", subtitle: "Статистика и награды" },
];

const weekDays = [
  { label: "Пн", checked: true },
  { label: "Вт", checked: true },
  { label: "Ср", checked: true },
  { label: "Чт", checked: true },
  { label: "Пт", checked: true },
  { label: "Сб", checked: true },
  { label: "Вс", checked: false },
];

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

function Account() {
  const router = useRouter();
  const { user, status, logout } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/");
    }
  }, [router, status]);

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

    return "Пользователь";
  }, [user]);

  const profileSubtitle = useMemo(() => {
    if (user?.telephone) {
      return user.telephone;
    }

    if (user?.telegram_id) {
      return `Telegram ID: ${user.telegram_id}`;
    }

    return "Базовый план";
  }, [user]);

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
          Загружаем кабинет...
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
                    Настройки
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
                    Выйти
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
                    Доброе утро, {user?.first_name ?? "друг"} 👋
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: "1.125rem", color: "text.secondary" }}>
                    Продолжай движение к своей лучшей форме
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

            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid size={{ xs: 12, xl: 8 }}>
                <Stack spacing={{ xs: 2, md: 3 }}>
                  <CardShell>
                    <Box
                      sx={{
                        minHeight: { xs: 360, md: 420 },
                        borderRadius: 4,
                        overflow: "hidden",
                        display: "grid",
                        alignItems: "end",
                        backgroundImage:
                          "linear-gradient(90deg, rgba(244,240,232,0.96) 0%, rgba(244,240,232,0.72) 40%, rgba(244,240,232,0.12) 70%), url('/images/top.jpeg')",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                      }}
                    >
                      <Box sx={{ p: { xs: 2.5, md: 4 } }}>
                        <Typography
                          sx={{
                            maxWidth: 380,
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: { xs: "2.25rem", md: "4rem" },
                            lineHeight: 1.02,
                            color: "text.primary",
                          }}
                        >
                          Гибкость. Сила. Грация.
                        </Typography>
                        <Typography
                          sx={{
                            mt: 2,
                            maxWidth: 280,
                            fontSize: { xs: "1rem", md: "1.375rem" },
                            lineHeight: 1.5,
                            color: "text.secondary",
                          }}
                        >
                          Видеоуроки гимнастики для любого уровня подготовки
                        </Typography>
                        <Button
                          sx={{
                            mt: 3,
                            px: 3.5,
                            py: 1.6,
                            borderRadius: 999,
                            bgcolor: "secondary.main",
                            color: "#fffdf8",
                            fontSize: "1rem",
                          }}
                        >
                          Продолжить тренировку
                        </Button>
                      </Box>
                    </Box>
                  </CardShell>

                  <Box>
                    <Stack direction="row" sx={{ mb: 1.5, justifyContent: "space-between", alignItems: "center" }}>
                      <Typography
                        sx={{
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: { xs: "1.75rem", md: "2rem" },
                          color: "text.primary",
                        }}
                      >
                        Мои программы
                      </Typography>
                      <Button sx={{ color: "secondary.main" }}>Смотреть все</Button>
                    </Stack>
                    <Grid container spacing={2}>
                      {programItems.map((item) => (
                        <Grid key={item.title} size={{ xs: 12, sm: 6, xl: 3 }}>
                          <CardShell>
                            <Box>
                              <Box
                                sx={{
                                  height: 150,
                                  backgroundImage: `url('${item.image}')`,
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                  backgroundSize: "cover",
                                  borderTopLeftRadius: 16,
                                  borderTopRightRadius: 16,
                                }}
                              />
                              <Stack direction="row" spacing={1.5} sx={{ p: 2, justifyContent: "space-between", alignItems: "center" }}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, color: "text.primary" }}>
                                    {item.title}
                                  </Typography>
                                  <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
                                    {item.lessons}
                                  </Typography>
                                </Box>
                                <IconButton
                                  sx={{
                                    border: "1px solid rgba(184, 159, 116, 0.4)",
                                    color: "secondary.main",
                                    flexShrink: 0,
                                  }}
                                >
                                  <ChevronRightRoundedIcon />
                                </IconButton>
                              </Stack>
                            </Box>
                          </CardShell>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        mb: 1.5,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: { xs: "1.75rem", md: "2rem" },
                        color: "text.primary",
                      }}
                    >
                      Последние уроки
                    </Typography>
                    <Stack spacing={1.5}>
                      {recentItems.map((item) => (
                        <CardShell key={item.title}>
                          <Box
                            sx={{
                              p: 1.5,
                              display: "grid",
                              gridTemplateColumns: { xs: "88px 1fr", md: "112px 1fr auto" },
                              gap: 2,
                              alignItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                height: { xs: 72, md: 84 },
                                borderRadius: 2,
                                backgroundImage: `url('${item.image}')`,
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "cover",
                              }}
                            />

                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, color: "text.primary" }}>
                                {item.title}
                              </Typography>
                              <Typography sx={{ mt: 0.25, color: "text.secondary" }}>
                                {item.subtitle}
                              </Typography>
                            </Box>

                            <Box sx={{ minWidth: { xs: "100%", md: 180 }, gridColumn: { xs: "1 / -1", md: "auto" } }}>
                              <Typography sx={{ mb: 1, textAlign: "right", color: "text.secondary" }}>
                                {item.duration}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={item.progress}
                                sx={{
                                  height: 6,
                                  borderRadius: 999,
                                  bgcolor: "rgba(184, 159, 116, 0.18)",
                                  "& .MuiLinearProgress-bar": {
                                    borderRadius: 999,
                                    bgcolor: "secondary.main",
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        </CardShell>
                      ))}
                    </Stack>
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                      <Button sx={{ color: "secondary.main" }}>Смотреть все уроки</Button>
                    </Box>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, xl: 4 }}>
                <Stack spacing={{ xs: 2, md: 3 }}>
                  <CardShell>
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <Stack direction="row" sx={{ mb: 2, justifyContent: "space-between", alignItems: "center" }}>
                        <Typography
                          sx={{
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: { xs: "1.75rem", md: "2rem" },
                            color: "text.primary",
                          }}
                        >
                          Мой прогресс
                        </Typography>
                        <Button sx={{ color: "secondary.main" }}>Смотреть все</Button>
                      </Stack>

                      <Stack direction={{ xs: "column", sm: "row", xl: "row" }} spacing={3} sx={{ alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 134,
                            height: 134,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            background:
                              "conic-gradient(#b98173 0deg 245deg, rgba(185, 129, 115, 0.14) 245deg 360deg)",
                          }}
                        >
                          <Box
                            sx={{
                              width: 102,
                              height: 102,
                              borderRadius: "50%",
                              display: "grid",
                              placeItems: "center",
                              bgcolor: "background.paper",
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: "2rem",
                                color: "text.primary",
                              }}
                            >
                              68%
                            </Typography>
                          </Box>
                        </Box>

                        <Box>
                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, color: "text.primary" }}>
                            Тренировок в этом месяце
                          </Typography>
                          <Typography sx={{ mt: 1, color: "text.secondary" }}>17 из 25</Typography>
                          <Typography sx={{ mt: 0.5, color: "text.secondary" }}>5 ч 20 мин</Typography>
                        </Box>
                      </Stack>

                      <Grid container spacing={1} sx={{ mt: 3 }}>
                        {weekDays.map((day) => (
                          <Grid key={day.label} size={{ xs: 12 / 7 }}>
                            <Stack spacing={1} sx={{ alignItems: "center" }}>
                              <Typography sx={{ color: "text.secondary" }}>{day.label}</Typography>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  display: "grid",
                                  placeItems: "center",
                                  bgcolor: day.checked ? "secondary.main" : "transparent",
                                  border: day.checked
                                    ? "none"
                                    : "1px solid rgba(184, 159, 116, 0.38)",
                                  color: "#fffdf8",
                                }}
                              >
                                {day.checked ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : null}
                              </Box>
                            </Stack>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </CardShell>

                  <CardShell>
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <Typography
                        sx={{
                          mb: 2,
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: { xs: "1.75rem", md: "2rem" },
                          color: "text.primary",
                        }}
                      >
                        Продолжить урок
                      </Typography>

                      <Box
                        sx={{
                          position: "relative",
                          height: 180,
                          borderRadius: 3,
                          overflow: "hidden",
                          backgroundImage: "url('/images/assets_page-editor_2.1720702297.png')",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "cover",
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "rgba(47, 42, 36, 0.08)",
                          }}
                        >
                          <IconButton
                            sx={{
                              width: 72,
                              height: 72,
                              bgcolor: "rgba(255, 253, 248, 0.96)",
                              color: "text.primary",
                            }}
                          >
                            <PlayArrowRoundedIcon sx={{ fontSize: 40 }} />
                          </IconButton>
                        </Box>

                        <Typography
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            color: "#fffdf8",
                            fontWeight: 600,
                          }}
                        >
                          18:30
                        </Typography>
                      </Box>

                      <Stack direction="row" sx={{ mt: 2, gap: 2, justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography sx={{ fontSize: "1.375rem", fontWeight: 600, color: "text.primary" }}>
                            Гибкость спины
                          </Typography>
                          <Typography sx={{ color: "text.secondary" }}>Урок 5 из 10</Typography>
                        </Box>
                        <Button
                          sx={{
                            px: 2.5,
                            py: 1,
                            borderRadius: 999,
                            bgcolor: "rgba(184, 159, 116, 0.18)",
                            color: "text.primary",
                          }}
                        >
                          Продолжить
                        </Button>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={48}
                        sx={{
                          mt: 2,
                          height: 6,
                          borderRadius: 999,
                          bgcolor: "rgba(184, 159, 116, 0.18)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 999,
                            bgcolor: "secondary.main",
                          },
                        }}
                      />
                    </Box>
                  </CardShell>

                  <CardShell>
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <Typography
                        sx={{
                          mb: 2,
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: { xs: "1.75rem", md: "2rem" },
                          color: "text.primary",
                        }}
                      >
                        Быстрые действия
                      </Typography>

                      <Stack spacing={1.5}>
                        {actionItems.map((item) => (
                          <Stack
                            key={item.title}
                            direction="row"
                            sx={{
                              px: 1,
                              py: 1.5,
                              borderRadius: 2.5,
                              bgcolor: "rgba(255, 253, 248, 0.76)",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, color: "text.primary" }}>
                                {item.title}
                              </Typography>
                              <Typography sx={{ color: "text.secondary" }}>{item.subtitle}</Typography>
                            </Box>
                            <ChevronRightRoundedIcon sx={{ color: "text.secondary" }} />
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </CardShell>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export { Account };
