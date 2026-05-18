"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useAuth } from "@/features/auth/model/auth-context";
import { getMyAccesses } from "@/shared/api/accesses";
import { getResources, type Resource } from "@/shared/api/resources";
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

const programImages: Record<string, string> = {
  flexibility: "/images/assets_page-editor_1.1720702264.png",
  strength: "/images/assets_page-editor_2.1720702297.png",
  split: "/images/assets_page-editor_3.1720616225.png",
  rhythmic: "/images/top.jpeg",
};

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
  const [accessibleResources, setAccessibleResources] = useState<Resource[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let isMounted = true;
    async function loadAccesses(): Promise<void> {
      try {
        const [accesses, resources] = await Promise.all([getMyAccesses(), getResources()]);
        if (!isMounted) return;
        const accessibleIds = new Set(accesses.map((a) => a.resource_id));
        setAccessibleResources(resources.filter((r) => accessibleIds.has(r.id)));
      } catch {
        // silently ignore
      }
    }
    void loadAccesses();
    return () => { isMounted = false; };
  }, [status]);

  const programItems: ProgramCardItem[] = accessibleResources.map((r) => ({
    id: r.slug,
    title: r.title,
    image: programImages[r.slug] ?? "/images/top.jpeg",
    href: `/account/programs/${r.slug}`,
  }));

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
                      sx={{ mb: 1.5, justifyContent: "space-between", alignItems: "center", gap: 1 }}
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
                      <Button component={Link} href="/account/programs" sx={{ color: "secondary.main", minHeight: 44, flexShrink: 0 }}>
                        Смотреть все
                      </Button>
                    </Stack>
                    <ProgramCards items={programItems} size="small" />
                  </Box>

                  <Box sx={{ opacity: 0.45, filter: "grayscale(0.6)", cursor: "pointer" }}>
                    <RecentLessonsList items={recentItems} />
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, xl: 4 }}>
                <Stack spacing={{ xs: 2, md: 3 }}>
                  <Box sx={{ opacity: 0.45, filter: "grayscale(0.6)", cursor: "pointer" }}>
                    <ProgressCard
                      percentage={68}
                      completedCount={17}
                      totalCount={25}
                      totalTime="5 ч 20 мин"
                      weekDays={weekDays}
                    />
                  </Box>
                  <Box sx={{ opacity: 0.45, filter: "grayscale(0.6)", cursor: "pointer" }}>
                    <ContinueLessonCard
                      title="Гибкость спины"
                      subtitle="Урок 5 из 10"
                      duration="18:30"
                      progress={48}
                      image="/images/assets_page-editor_2.1720702297.png"
                    />
                  </Box>
                  <Box sx={{ opacity: 0.45, filter: "grayscale(0.6)", cursor: "pointer" }}>
                    <QuickActionsCard items={actionItems} />
                  </Box>
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
