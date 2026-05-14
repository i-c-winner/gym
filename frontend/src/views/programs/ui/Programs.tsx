"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { getResources, type Resource } from "@/shared/api/resources";
import { getMyAccesses } from "@/shared/api/accesses";
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

function ResourceCard({ resource, href }: { resource: Resource; href: string }) {
  const { t } = useTranslation();
  const image = programImages[resource.slug] ?? "/images/top.jpeg";
  const accent = programAccents[resource.slug] ?? "#b98173";

  return (
    <CardShell>
      <Box sx={{ p: 1.5 }}>
        <Box
          sx={{
            minHeight: { xs: 220, sm: 260 },
            borderRadius: "12px",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            backgroundImage: `linear-gradient(180deg, rgba(47,42,36,0.02) 0%, rgba(47,42,36,0.66) 100%), url('${image}')`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          <Chip
            label={t(`accountMyPrograms.programs.${resource.slug}.status`, { defaultValue: "" })}
            sx={{
              position: "absolute",
              top: 14,
              left: 14,
              bgcolor: "rgba(255, 253, 248, 0.92)",
              color: "text.primary",
              fontWeight: 600,
              display: t(`accountMyPrograms.programs.${resource.slug}.status`, { defaultValue: "" }) ? "flex" : "none",
            }}
          />
          <Box sx={{ p: { xs: 2, md: 2.5 }, width: "100%" }}>
            <Typography
              sx={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: { xs: "1.875rem", md: "2.25rem" },
                lineHeight: 1.08,
                color: "#fffdf8",
                textShadow: "0 2px 18px rgba(38, 31, 24, 0.32)",
              }}
            >
              {resource.title}
            </Typography>
            {resource.description ? (
              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 480,
                  color: "#fffdf8",
                  fontSize: "1rem",
                  lineHeight: 1.55,
                  textShadow: "0 2px 18px rgba(38, 31, 24, 0.28)",
                }}
              >
                {resource.description}
              </Typography>
            ) : null}
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Stack direction="row" spacing={1.5}>
              <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
                {t(`accountMyPrograms.programs.${resource.slug}.lessons`, { defaultValue: "" })}
              </Typography>
              {t(`accountMyPrograms.programs.${resource.slug}.duration`, { defaultValue: "" }) ? (
                <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
                  · {t(`accountMyPrograms.programs.${resource.slug}.duration`, { defaultValue: "" })}
                </Typography>
              ) : null}
            </Stack>
            <Button
              component={Link}
              href={href}
              endIcon={<ChevronRightRoundedIcon />}
              sx={{
                px: 2.5,
                py: 0.75,
                borderRadius: 999,
                bgcolor: accent,
                color: "#fffdf8",
                fontWeight: 600,
                "&:hover": { bgcolor: accent, filter: "brightness(0.92)" },
              }}
            >
              {t("programs.open")}
            </Button>
          </Stack>
        </Box>
      </Box>
    </CardShell>
  );
}

function ResourceCardSkeleton() {
  return (
    <CardShell>
      <Box sx={{ p: 1.5 }}>
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: "12px" }} />
        <Box sx={{ p: 2 }}>
          <Skeleton width="60%" height={28} />
          <Skeleton width="40%" height={20} sx={{ mt: 1 }} />
        </Box>
      </Box>
    </CardShell>
  );
}

function Programs() {
  const { t } = useTranslation();
  const { isAuthenticated, status } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [accessibleIds, setAccessibleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    let isMounted = true;

    async function load(): Promise<void> {
      try {
        const [resourcesData, accessesData] = await Promise.all([
          getResources(),
          isAuthenticated ? getMyAccesses().catch(() => []) : Promise.resolve([]),
        ]);
        if (!isMounted) return;
        setResources(resourcesData);
        setAccessibleIds(new Set(accessesData.map((a) => a.resource_id)));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => { isMounted = false; };
  }, [isAuthenticated, status]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh", bgcolor: "background.default" }}>
      <Header />

      <Box
        sx={{
          width: "100%",
          maxWidth: "1280px",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 4, sm: 6, md: 8 },
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, mb: 1, color: "text.primary" }}
        >
          {t("programs.title")}
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: { xs: 4, md: 6 } }}>
          {t("programs.subtitle")}
        </Typography>

        <Grid container spacing={{ xs: 2, md: 3 }}>
          {loading || status === "loading"
            ? Array.from({ length: 4 }, (_, i) => (
                <Grid key={i} size={{ xs: 12, md: 6 }}>
                  <ResourceCardSkeleton />
                </Grid>
              ))
            : resources.map((resource) => (
                <Grid key={resource.id} size={{ xs: 12, md: 6 }}>
                  <ResourceCard
                    resource={resource}
                    href={
                      accessibleIds.has(resource.id)
                        ? `/account/programs/${resource.slug}`
                        : `/programs/${resource.slug}`
                    }
                  />
                </Grid>
              ))}
        </Grid>

        {!loading && resources.length === 0 ? (
          <Typography sx={{ color: "text.secondary", textAlign: "center", py: 8 }}>
            {t("programs.empty")}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export { Programs };
