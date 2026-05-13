"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { getResourceContent } from "@/shared/api/resources";
import type { ApiError } from "@/shared/api/client";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { ProgramHero } from "@/widgets/program-detail/ui/ProgramHero";
import { LessonsList, type LessonItem } from "@/widgets/program-detail/ui/LessonsList";

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

function getLessons(slug: string): LessonItem[] {
  const counts: Record<string, number> = { flexibility: 12, strength: 10, split: 15, rhythmic: 11 };
  const count = counts[slug] ?? 8;
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Урок ${i + 1}`,
    duration: `${20 + (i % 4) * 5} мин`,
    completed: i < Math.floor((count * (programProgress[slug] ?? 0)) / 100),
  }));
}

type AccessState = "loading" | "granted" | "not_found";

function Program({ slug }: { slug: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay({
    fallbackName: t("accountMyPrograms.profile.fallbackName"),
    fallbackPlan: t("accountMyPrograms.profile.fallbackPlan"),
  });
  const navItems = useAccountNavItems("/account/programs");
  const [accessState, setAccessState] = useState<AccessState>("loading");

  useEffect(() => {
    let isMounted = true;

    async function checkAccess(): Promise<void> {
      try {
        await getResourceContent(slug);
        if (isMounted) setAccessState("granted");
      } catch (error) {
        if (!isMounted) return;
        const apiError = error as ApiError;
        if (apiError.status === 401) {
          router.replace("/");
          return;
        }
        if (apiError.status === 403) {
          router.replace(`/account/programs/${slug}/buy`);
          return;
        }
        setAccessState("not_found");
      }
    }

    void checkAccess();
    return () => {
      isMounted = false;
    };
  }, [slug, router]);

  const image = programImages[slug] ?? "/images/assets_page-editor_1.1720702264.png";
  const accent = programAccents[slug] ?? "#b98173";
  const progress = programProgress[slug] ?? 0;
  const lessons = getLessons(slug);

  const renderContent = () => {
    if (accessState === "loading") {
      return (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <Typography sx={{ fontSize: "1.125rem", color: "text.secondary" }}>
            {t("accountMyPrograms.program.loading")}
          </Typography>
        </Box>
      );
    }

    if (accessState === "not_found") {
      return (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 320, textAlign: "center", px: 2 }}>
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("accountMyPrograms.program.notFound.title")}
            </Typography>
            <Typography sx={{ color: "text.secondary", maxWidth: 360 }}>
              {t("accountMyPrograms.program.notFound.description")}
            </Typography>
            <Button variant="outlined" onClick={() => router.push("/account/programs")} sx={{ mt: 1 }}>
              {t("accountMyPrograms.program.accessDenied.back")}
            </Button>
          </Stack>
        </Box>
      );
    }

    return (
      <Stack spacing={{ xs: 2, md: 3 }}>
        <AccountPageHeader
          title={t(`accountMyPrograms.programs.${slug}.title`)}
          subtitle={t(`accountMyPrograms.programs.${slug}.description`)}
          displayName={displayName}
          profileSubtitle={profileSubtitle}
          backHref="/account/programs"
        />
        <ProgramHero
          image={image}
          accent={accent}
          progress={progress}
          status={t(`accountMyPrograms.programs.${slug}.status`)}
          lessonsLabel={t("accountMyPrograms.labels.lessons")}
          durationLabel={t("accountMyPrograms.labels.duration")}
          progressLabel={t("accountMyPrograms.labels.progress")}
          lessonsValue={t(`accountMyPrograms.programs.${slug}.lessons`)}
          durationValue={t(`accountMyPrograms.programs.${slug}.duration`)}
        />
        <LessonsList lessons={lessons} accent={accent} />
      </Stack>
    );
  };

  return (
    <Box sx={{ minHeight: "100dvh", px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, lg: 2.25 }}>
          <AccountSidebar
            navItems={navItems}
            settingsLabel={t("accountMyPrograms.navigation.settings")}
            logoutLabel={t("accountMyPrograms.navigation.logout")}
            onLogout={() => void logout().then(() => router.replace("/"))}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 9.75 }}>
          {renderContent()}
        </Grid>
      </Grid>
    </Box>
  );
}

export { Program };