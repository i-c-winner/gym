"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { getPlansByResourceSlug, type Plan } from "@/shared/api/plans";
import { createOrder } from "@/shared/api/orders";
import type { ApiError } from "@/shared/api/client";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";

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

function ProgramBuy({ slug }: { slug: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { logout, csrfToken } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay({
    fallbackName: t("accountMyPrograms.profile.fallbackName"),
    fallbackPlan: t("accountMyPrograms.profile.fallbackPlan"),
  });
  const navItems = useAccountNavItems("/account/programs");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);
  const [orderedPlanId, setOrderedPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const image = programImages[slug] ?? "/images/assets_page-editor_1.1720702264.png";
  const accent = programAccents[slug] ?? "#b98173";

  useEffect(() => {
    let isMounted = true;
    async function loadPlans(): Promise<void> {
      try {
        const data = await getPlansByResourceSlug(slug);
        if (isMounted) setPlans(data);
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    }
    void loadPlans();
    return () => { isMounted = false; };
  }, [slug]);

  async function handleBuy(plan: Plan): Promise<void> {
    if (!csrfToken) return;
    setBuyingPlanId(plan.id);
    setError(null);
    try {
      await createOrder(plan.resource_id, plan.id, csrfToken);
      setOrderedPlanId(plan.id);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? t("programBuy.error.generic"));
    } finally {
      setBuyingPlanId(null);
    }
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
              title={t(`accountMyPrograms.programs.${slug}.title`)}
              subtitle={t("programBuy.subtitle")}
              displayName={displayName}
              profileSubtitle={profileSubtitle}
              backHref="/programs/flexibility"
            />

            <Box
              sx={{
                minHeight: { xs: 180, sm: 240 },
                borderRadius: 3,
                backgroundImage: `linear-gradient(180deg, rgba(47,42,36,0.02) 0%, rgba(47,42,36,0.55) 100%), url('${image}')`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
              }}
            />

            {loadingPlans ? (
              <Typography sx={{ color: "text.secondary" }}>{t("programBuy.loading")}</Typography>
            ) : (
              <Grid container spacing={2}>
                {plans.map((plan) => {
                  const isOrdered = orderedPlanId === plan.id;
                  const isBuying = buyingPlanId === plan.id;

                  return (
                    <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <CardShell>
                        <Stack
                          sx={{ p: { xs: 2.5, md: 3 }, minHeight: 220, justifyContent: "space-between" }}
                          spacing={2}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "text.primary" }}>
                              {t(`programBuy.plans.${plan.duration_type}.title`)}
                            </Typography>
                            <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "0.9rem" }}>
                              {t(`programBuy.plans.${plan.duration_type}.description`)}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: "2rem", color: accent, lineHeight: 1 }}>
                              {plan.price_amount} {plan.currency}
                            </Typography>
                          </Box>

                          {isOrdered ? (
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "success.main" }}>
                              <CheckCircleOutlineRoundedIcon fontSize="small" />
                              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                                {t("programBuy.ordered")}
                              </Typography>
                            </Stack>
                          ) : (
                            <Button
                              variant="contained"
                              fullWidth
                              disabled={isBuying || !!orderedPlanId}
                              onClick={() => void handleBuy(plan)}
                              sx={{
                                borderRadius: 999,
                                bgcolor: accent,
                                "&:hover": { bgcolor: accent, filter: "brightness(0.92)" },
                                "&:disabled": { bgcolor: "rgba(184,159,116,0.3)" },
                              }}
                            >
                              {isBuying ? t("programBuy.buying") : t("programBuy.buy")}
                            </Button>
                          )}
                        </Stack>
                      </CardShell>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {error ? (
              <Typography sx={{ color: "error.main", fontSize: "0.9rem" }}>{error}</Typography>
            ) : null}

            {orderedPlanId ? (
              <CardShell>
                <Box sx={{ p: 3 }}>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{t("programBuy.successTitle")}</Typography>
                  <Typography sx={{ color: "text.secondary", mb: 2 }}>{t("programBuy.successDescription")}</Typography>
                  <Button variant="outlined" onClick={() => router.push("/account/programs")}>
                    {t("programBuy.backToPrograms")}
                  </Button>
                </Box>
              </CardShell>
            ) : null}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export { ProgramBuy };
