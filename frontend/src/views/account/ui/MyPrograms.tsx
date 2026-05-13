"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { getAccountProgramAccessesStub } from "@/shared/api/programs.stub";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { ProgramCards, type ProgramCardItem } from "@/widgets/programCards/ui/ProgramCards";

const connectedPrograms = [
  { key: "flexibility", image: "/images/assets_page-editor_1.1720702264.png", progress: 66, accent: "#b98173" },
  { key: "strength", image: "/images/assets_page-editor_2.1720702297.png", progress: 42, accent: "#6a7b6a" },
  { key: "split", image: "/images/assets_page-editor_3.1720616225.png", progress: 28, accent: "#b89f74" },
  { key: "rhythmic", image: "/images/top.jpeg", progress: 74, accent: "#8f6f5f" },
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
    href: hasAccess ? `/account/programs/${program.key}` : undefined,
  };
}

function MyPrograms() {
  const router = useRouter();
  const { t } = useTranslation();
  const { status, logout } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay({
    fallbackName: t("accountMyPrograms.profile.fallbackName"),
    fallbackPlan: t("accountMyPrograms.profile.fallbackPlan"),
  });
  const navItems = useAccountNavItems("/account/programs");
  const [accessByProgramSlug, setAccessByProgramSlug] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadProgramAccesses(): Promise<void> {
      const accesses = await getAccountProgramAccessesStub();
      if (!isMounted) return;
      setAccessByProgramSlug(
        Object.fromEntries(accesses.map((access) => [access.programSlug, access.hasAccess]))
      );
    }
    void loadProgramAccesses();
    return () => { isMounted = false; };
  }, []);

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", px: 2 }}>
        <Typography sx={{ fontSize: "1.125rem", color: "text.secondary" }}>
          {t("accountMyPrograms.loading")}
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
            settingsLabel={t("accountMyPrograms.navigation.settings")}
            logoutLabel={t("accountMyPrograms.navigation.logout")}
            onLogout={() => void logout().then(() => router.replace("/"))}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 9.75 }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            <AccountPageHeader
              title={t("accountMyPrograms.title")}
              subtitle={t("accountMyPrograms.subtitle")}
              displayName={displayName}
              profileSubtitle={profileSubtitle}
            />
            <ProgramCards
              items={connectedPrograms.map((program) =>
                buildProgramCard(program, accessByProgramSlug[program.key] ?? false, t)
              )}
              size="high"
              actionLabel={t("accountMyPrograms.actions.open")}
              durationLabel={t("accountMyPrograms.labels.duration")}
              lessonsLabel={t("accountMyPrograms.labels.lessons")}
              progressLabel={t("accountMyPrograms.labels.progress")}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export { MyPrograms };