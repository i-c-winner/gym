"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import { getResourceBySlug, type Resource } from "@/shared/api/resources";
import { getPlansByResourceSlug, type Plan } from "@/shared/api/plans";
import { getMyAccesses } from "@/shared/api/accesses";
import { useAuth } from "@/features/auth/model/auth-context";
import { Header } from "@/entities/headers/ui/Header";
import { CardShell } from "@/shared/ui/CardShell";
import { useCurrencyRate } from "@/shared/hooks/useCurrencyRate";
import { formatPrice } from "@/shared/lib/formatPrice";

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

function PlanCard({ plan, accent, onBuy }: { plan: Plan; accent: string; onBuy: () => void }) {
  const { t } = useTranslation();
  const { rate } = useCurrencyRate();

  return (
    <CardShell>
      <Stack sx={{ p: { xs: 3, md: 3.5 }, minHeight: 220, justifyContent: "space-between" }} spacing={2.5}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "text.primary" }}>
            {t(`programBuy.plans.${plan.duration_type}.title`)}
          </Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: "0.9rem" }}>
            {t(`programBuy.plans.${plan.duration_type}.description`)}
          </Typography>
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: "2.25rem", color: accent, lineHeight: 1 }}>
          {formatPrice(plan.price_amount, rate.coefficient, rate.currency)}
        </Typography>

        <Button
          variant="contained"
          fullWidth
          onClick={onBuy}
          sx={{
            borderRadius: 999,
            py: 1.25,
            fontWeight: 700,
            bgcolor: accent,
            "&:hover": { bgcolor: accent, filter: "brightness(0.92)" },
          }}
        >
          {t("programBuy.buy")}
        </Button>
      </Stack>
    </CardShell>
  );
}

function ProgramDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, status } = useAuth();

  const [resource, setResource] = useState<Resource | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const image = programImages[slug] ?? "/images/top.jpeg";
  const accent = programAccents[slug] ?? "#b98173";

  useEffect(() => {
    if (status === "loading") return;
    let isMounted = true;

    async function load(): Promise<void> {
      try {
        const [res, plansData, accesses] = await Promise.all([
          getResourceBySlug(slug),
          getPlansByResourceSlug(slug),
          isAuthenticated ? getMyAccesses().catch(() => []) : Promise.resolve([]),
        ]);
        if (!isMounted) return;

        if (res && accesses.some((a) => a.resource_id === res.id)) {
          router.replace(`/account/programs/${slug}`);
          return;
        }

        setResource(res);
        setPlans(plansData);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => { isMounted = false; };
  }, [slug, isAuthenticated, status, router]);

  function handleBuy(plan: Plan): void {
    if (status === "anonymous") { router.push("/"); return; }
    router.push(`/programs/${slug}/buy?plan=${plan.id}`);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.default" }}>
      <Header />

      {/* Hero */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "1280px",
          mx: "auto",
          mt: { xs: 2, sm: 2.5 },
          px: { xs: 2, sm: 3, md: 5 },
        }}
      >
        <Box
          sx={{
            minHeight: { xs: 320, sm: 420, md: 520 },
            borderRadius: { xs: 3, md: 4 },
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            backgroundImage: `linear-gradient(180deg, rgba(47,42,36,0.01) 0%, rgba(47,42,36,0.72) 100%), url('${image}')`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          {loading ? (
            <Box sx={{ p: { xs: 3, md: 5 }, width: "100%" }}>
              <Skeleton variant="text" width="40%" height={52} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
              <Skeleton variant="text" width="65%" height={28} sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.1)" }} />
            </Box>
          ) : resource ? (
            <Box sx={{ p: { xs: 3, md: 5 }, width: "100%" }}>
              <Chip
                label={t(`accountMyPrograms.programs.${slug}.status`, { defaultValue: "" })}
                sx={{
                  mb: 2,
                  bgcolor: "rgba(255, 253, 248, 0.92)",
                  color: "text.primary",
                  fontWeight: 600,
                  display: t(`accountMyPrograms.programs.${slug}.status`, { defaultValue: "" }) ? "inline-flex" : "none",
                }}
              />
              <Typography
                sx={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: { xs: "2.25rem", sm: "3rem", md: "3.75rem" },
                  lineHeight: 1.06,
                  color: "#fffdf8",
                  textShadow: "0 2px 24px rgba(38, 31, 24, 0.35)",
                  fontWeight: 400,
                }}
              >
                {resource.title}
              </Typography>
              {resource.description ? (
                <Typography
                  sx={{
                    mt: 1.5,
                    maxWidth: 560,
                    color: "rgba(255,253,248,0.82)",
                    fontSize: { xs: "1rem", md: "1.125rem" },
                    lineHeight: 1.6,
                    textShadow: "0 2px 12px rgba(38, 31, 24, 0.28)",
                  }}
                >
                  {resource.description}
                </Typography>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "1280px",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 4, sm: 5, md: 7 },
        }}
      >
        {/* Stats row */}
        {!loading && resource ? (
          <Stack
            direction="row"
            spacing={{ xs: 3, sm: 5 }}
            sx={{ mb: { xs: 5, md: 7 }, flexWrap: "wrap", gap: 2 }}
          >
            {t(`accountMyPrograms.programs.${slug}.lessons`, { defaultValue: "" }) ? (
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <PlayCircleOutlineRoundedIcon sx={{ color: accent, fontSize: "1.5rem" }} />
                <Box>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                    {t("accountMyPrograms.labels.lessons")}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                    {t(`accountMyPrograms.programs.${slug}.lessons`)}
                  </Typography>
                </Box>
              </Stack>
            ) : null}
            {t(`accountMyPrograms.programs.${slug}.duration`, { defaultValue: "" }) ? (
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <AccessTimeRoundedIcon sx={{ color: accent, fontSize: "1.5rem" }} />
                <Box>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                    {t("accountMyPrograms.labels.duration")}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                    {t(`accountMyPrograms.programs.${slug}.duration`)}
                  </Typography>
                </Box>
              </Stack>
            ) : null}
          </Stack>
        ) : null}

        {/* Plans */}
        <Typography
          sx={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: { xs: "1.75rem", md: "2.25rem" },
            fontWeight: 400,
            color: "text.primary",
            mb: { xs: 3, md: 4 },
          }}
        >
          {t("programDetail.plansTitle")}
        </Typography>

        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 3 }, (_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {plans.map((plan) => (
              <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <PlanCard plan={plan} accent={accent} onBuy={() => handleBuy(plan)} />
              </Grid>
            ))}
          </Grid>
        )}

      </Box>
    </Box>
  );
}

export { ProgramDetail };
