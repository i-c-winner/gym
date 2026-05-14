"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { getMyAccesses } from "@/shared/api/accesses";
import { getResources, type Resource } from "@/shared/api/resources";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { ProgramCards, type ProgramCardItem } from "@/widgets/programCards/ui/ProgramCards";

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

function MyPrograms() {
  const router = useRouter();
  const { t } = useTranslation();
  const { status, logout } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay({
    fallbackName: t("accountMyPrograms.profile.fallbackName"),
    fallbackPlan: t("accountMyPrograms.profile.fallbackPlan"),
  });
  const navItems = useAccountNavItems("/account/programs");
  const [accessibleResources, setAccessibleResources] = useState<Resource[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAccesses(): Promise<void> {
      try {
        const [accesses, resources] = await Promise.all([getMyAccesses(), getResources()]);
        if (!isMounted) return;
        const accessibleIds = new Set(accesses.map((a) => a.resource_id));
        setAccessibleResources(resources.filter((r) => accessibleIds.has(r.id)));
      } catch {
        if (isMounted) setAccessibleResources([]);
      }
    }
    void loadAccesses();
    return () => { isMounted = false; };
  }, []);

  const cards: ProgramCardItem[] = (accessibleResources ?? []).map((resource) => ({
    id: resource.slug,
    title: resource.title,
    description: resource.description ?? undefined,
    image: programImages[resource.slug] ?? "/images/top.jpeg",
    progress: programProgress[resource.slug] ?? 0,
    accent: programAccents[resource.slug] ?? "#b98173",
    href: `/account/programs/${resource.slug}`,
  }));

  if (status === "loading" || accessibleResources === null) {
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
            {cards.length === 0 ? (
              <Typography sx={{ color: "text.secondary" }}>
                {t("accountMyPrograms.noPrograms")}
              </Typography>
            ) : (
              <ProgramCards
                items={cards}
                size="high"
                actionLabel={t("accountMyPrograms.actions.open")}
                durationLabel={t("accountMyPrograms.labels.duration")}
                lessonsLabel={t("accountMyPrograms.labels.lessons")}
                progressLabel={t("accountMyPrograms.labels.progress")}
              />
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export { MyPrograms };
