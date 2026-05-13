"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { HeroBanner } from "@/widgets/hero-banner/ui/HeroBanner";
import { RecentLessonsList, type RecentLessonItem } from "@/widgets/recent-lessons/ui/RecentLessonsList";
import { ProgressCard, type WeekDay } from "@/widgets/account-progress/ui/ProgressCard";
import { ContinueLessonCard } from "@/widgets/account-progress/ui/ContinueLessonCard";
import { QuickActionsCard, type QuickActionItem } from "@/widgets/quick-actions/ui/QuickActionsCard";
import { ProgramCards, type ProgramCardItem } from "@/widgets/programCards/ui/ProgramCards";

const programItems: ProgramCardItem[] = [
  { id: "flexibility", title: "Гибкость тела", lessons: "12 уроков", image: "/images/assets_page-editor_1.1720702264.png", href: "/account/programs/flexibility" },
  { id: "strength", title: "Сила и выносливость", lessons: "10 уроков", image: "/images/assets_page-editor_2.1720702297.png", href: "/account/programs/strength" },
  { id: "split", title: "Шпагат за 30 дней", lessons: "15 уроков", image: "/images/assets_page-editor_3.1720616225.png", href: "/account/programs/split" },
  { id: "rhythmic", title: "Художественная гимнастика", lessons: "11 уроков", image: "/images/assets_page-editor_1.1720702264.png", href: "/account/programs/rhythmic" },
];

const recentItems: RecentLessonItem[] = [
  { title: "Растяжка на всё тело", subtitle: "Урок 7 из 12", duration: "24:15", progress: 66, image: "/images/assets_page-editor_1.1720702264.png" },
  { title: "Гибкость спины", subtitle: "Урок 5 из 10", duration: "18:30", progress: 52, image: "/images/assets_page-editor_2.1720702297.png" },
  { title: "Баланс и координация", subtitle: "Урок 3 из 8", duration: "16:45", progress: 38, image: "/images/assets_page-editor_3.1720616225.png" },
];

const actionItems: QuickActionItem[] = [
  { title: "Мой календарь", subtitle: "Запланированные тренировки" },
  { title: "Избранные уроки", subtitle: "Сохранённые уроки" },
  { title: "Мои достижения", subtitle: "Статистика и награды" },
];

const weekDays: WeekDay[] = [
  { label: "Пн", checked: true },
  { label: "Вт", checked: true },
  { label: "Ср", checked: true },
  { label: "Чт", checked: true },
  { label: "Пт", checked: true },
  { label: "Сб", checked: true },
  { label: "Вс", checked: false },
];

function Account() {
  const router = useRouter();
  const { user, status, logout } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay();
  const navItems = useAccountNavItems("/main");

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", px: 2 }}>
        <Typography sx={{ fontSize: "1.125rem", color: "text.secondary" }}>
          Загружаем кабинет...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh", px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, lg: 2.25 }}>
          <AccountSidebar
            navItems={navItems}
            onLogout={() => void logout().then(() => router.replace("/"))}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 9.75 }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            <AccountPageHeader
              title={`Доброе утро, ${user?.first_name ?? "друг"} 👋`}
              subtitle="Продолжай движение к своей лучшей форме"
              displayName={displayName}
              profileSubtitle={profileSubtitle}
            />

            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid size={{ xs: 12, xl: 8 }}>
                <Stack spacing={{ xs: 2, md: 3 }}>
                  <HeroBanner />

                  <Box>
                    <Stack
                      direction="row"
                      sx={{ mb: 1.5, justifyContent: "space-between", alignItems: "center" }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: { xs: "1.75rem", md: "2rem" },
                          color: "text.primary",
                        }}
                      >
                        Мои программы
                      </Typography>
                      <Button component={Link} href="/account/programs" sx={{ color: "secondary.main" }}>
                        Смотреть все
                      </Button>
                    </Stack>
                    <ProgramCards items={programItems} size="small" />
                  </Box>

                  <RecentLessonsList items={recentItems} />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, xl: 4 }}>
                <Stack spacing={{ xs: 2, md: 3 }}>
                  <ProgressCard
                    percentage={68}
                    completedCount={17}
                    totalCount={25}
                    totalTime="5 ч 20 мин"
                    weekDays={weekDays}
                  />
                  <ContinueLessonCard
                    title="Гибкость спины"
                    subtitle="Урок 5 из 10"
                    duration="18:30"
                    progress={48}
                    image="/images/assets_page-editor_2.1720702297.png"
                  />
                  <QuickActionsCard items={actionItems} />
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
