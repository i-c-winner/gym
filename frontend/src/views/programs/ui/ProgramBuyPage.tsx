"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { getResourceBySlug, getResourceContent, type Resource } from "@/shared/api/resources";
import { getPlansByResourceSlug, type Plan } from "@/shared/api/plans";
import { useCurrencyRate } from "@/shared/hooks/useCurrencyRate";
import { formatPrice } from "@/shared/lib/formatPrice";
import { createOrder } from "@/shared/api/orders";
import { simulatePayment, type Provider } from "@/shared/api/payments";
import type { ApiError } from "@/shared/api/client";
import { useAuth } from "@/features/auth/model/auth-context";
import { Header } from "@/entities/headers/ui/Header";
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

const COUNTDOWN_SECONDS = 5;

type PageState = "idle" | "creating" | "processing" | "success" | "error";

function ProgramBuyPage({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const { t } = useTranslation();
  const { csrfToken, status: authStatus } = useAuth();

  const { rate } = useCurrencyRate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [pageState, setPageState] = useState<PageState>("idle");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const accent = programAccents[slug] ?? "#b98173";
  const image = programImages[slug] ?? "/images/top.jpeg";

  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus === "anonymous") { router.replace("/"); return; }
    if (!planId) { router.replace(`/programs/${slug}`); return; }

    let isMounted = true;
    async function load(): Promise<void> {
      const [res, plans] = await Promise.all([
        getResourceBySlug(slug),
        getPlansByResourceSlug(slug),
      ]);
      if (!isMounted) return;
      setResource(res);
      setPlan(plans.find((p) => p.id === planId) ?? null);
    }
    void load();
    return () => { isMounted = false; };
  }, [slug, planId, authStatus, router]);

  useEffect(() => {
    if (pageState !== "processing") return;
    setCountdown(COUNTDOWN_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setPageState("success");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [pageState]);

  async function handleBuy(selectedProvider: Provider): Promise<void> {
    if (!plan || !csrfToken) return;
    setProvider(selectedProvider);
    setError(null);
    setPageState("creating");
    try {
      const order = await createOrder(plan.resource_id, plan.id, csrfToken);
      await simulatePayment(order.id, selectedProvider, csrfToken);
      setPageState("processing");
    } catch (err) {
      setError((err as ApiError).message ?? t("programBuyPage.error.generic"));
      setPageState("error");
    }
  }

  if (authStatus === "loading" || !plan || !resource) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.default" }}>
        <Header />
        <Box sx={{ display: "grid", placeItems: "center", flex: 1 }}>
          <CircularProgress sx={{ color: accent }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.default" }}>
      <Header />

      <Box
        sx={{
          width: "100%",
          maxWidth: 560,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 4, md: 7 },
        }}
      >
        {/* Resource preview */}
        <Box
          sx={{
            minHeight: 180,
            borderRadius: 3,
            mb: 3,
            backgroundImage: `linear-gradient(180deg, rgba(47,42,36,0.02) 0%, rgba(47,42,36,0.6) 100%), url('${image}')`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            display: "flex",
            alignItems: "flex-end",
            p: 2.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: { xs: "1.5rem", sm: "2rem" },
              color: "#fffdf8",
              textShadow: "0 2px 18px rgba(38,31,24,0.35)",
            }}
          >
            {resource.title}
          </Typography>
        </Box>

        <CardShell>
          <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>

            {/* Plan summary */}
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
              <Box>
                <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                  {t("programBuyPage.plan")}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
                  {t(`programBuy.plans.${plan.duration_type}.title`)}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                  {t(`programBuy.plans.${plan.duration_type}.description`)}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.75rem", color: accent }}>
                {formatPrice(plan.price_amount, rate.coefficient, rate.currency)}
              </Typography>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {/* States */}
            {pageState === "idle" || pageState === "error" ? (
              <Stack spacing={1.5}>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t("programBuyPage.chooseMethod")}
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => void handleBuy("click")}
                  sx={{
                    borderRadius: 999,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: "1rem",
                    bgcolor: "#00A859",
                    "&:hover": { bgcolor: "#009950" },
                  }}
                >
                  {t("programBuyPage.buyClick")}
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => void handleBuy("payme")}
                  sx={{
                    borderRadius: 999,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: "1rem",
                    bgcolor: "#2671E2",
                    "&:hover": { bgcolor: "#1f5fc7" },
                  }}
                >
                  {t("programBuyPage.buyPayme")}
                </Button>

                {pageState === "error" && error ? (
                  <Typography sx={{ color: "error.main", fontSize: "0.875rem", textAlign: "center" }}>
                    {error}
                  </Typography>
                ) : null}
              </Stack>
            ) : null}

            {pageState === "creating" ? (
              <Stack spacing={2} sx={{ alignItems: "center", py: 2 }}>
                <CircularProgress size={40} sx={{ color: accent }} />
                <Typography sx={{ color: "text.secondary" }}>
                  {t("programBuyPage.creating")}
                </Typography>
              </Stack>
            ) : null}

            {pageState === "processing" ? (
              <Stack spacing={2} sx={{ alignItems: "center", py: 2 }}>
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  <CircularProgress
                    variant="determinate"
                    value={((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100}
                    size={80}
                    thickness={3}
                    sx={{ color: accent }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: "1.5rem", color: accent }}>
                      {countdown}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>
                  {t("programBuyPage.processing", {
                    provider: provider === "click" ? "CLICK" : "PayMe",
                  })}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", textAlign: "center" }}>
                  {t("programBuyPage.processingHint")}
                </Typography>
              </Stack>
            ) : null}

            {pageState === "success" ? (
              <Stack spacing={2} sx={{ alignItems: "center", py: 2 }}>
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 56, color: "success.main" }} />
                <Typography sx={{ fontWeight: 700, fontSize: "1.25rem" }}>
                  {t("programBuyPage.successTitle")}
                </Typography>
                <Typography sx={{ color: "text.secondary", textAlign: "center" }}>
                  {t("programBuyPage.successDesc")}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={async () => {
                    try {
                      await getResourceContent(slug);
                      // access confirmed — navigate
                      router.push(`/account/programs/${slug}`);
                    } catch {
                      // access not yet granted — fallback: create new order + simulate
                      if (plan && csrfToken) {
                        try {
                          const order = await createOrder(plan.resource_id, plan.id, csrfToken);
                          await simulatePayment(order.id, provider ?? "click", csrfToken);
                          router.push(`/account/programs/${slug}`);
                        } catch (fallbackErr) {
                          setModalError((fallbackErr as ApiError).message ?? t("programBuyPage.error.generic"));
                        }
                      }
                    }
                  }}
                  sx={{
                    mt: 1,
                    borderRadius: 999,
                    py: 1.5,
                    fontWeight: 700,
                    bgcolor: accent,
                    "&:hover": { bgcolor: accent, filter: "brightness(0.92)" },
                  }}
                >
                  {t("programBuyPage.openProgram")}
                </Button>
              </Stack>
            ) : null}
          </Box>
        </CardShell>
      </Box>

      <Dialog open={!!modalError} onClose={() => setModalError(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("programBuyPage.errorModal.title")}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary" }}>{modalError}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="contained"
            onClick={() => setModalError(null)}
            sx={{ borderRadius: 999, bgcolor: accent, "&:hover": { bgcolor: accent, filter: "brightness(0.92)" } }}
          >
            {t("programBuyPage.errorModal.close")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export { ProgramBuyPage };
