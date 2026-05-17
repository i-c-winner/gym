"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";
import {
  getEvents,
  getMyEnrollments,
  getMySubscriptions,
  getScheduleTrainers,
  type EnrollmentWithEvent,
  type SubscriptionInfo,
  type TrainerInfo,
  type TrainingEvent,
} from "@/shared/api/schedule";
import { getAllPlans, type Plan } from "@/shared/api/plans";
import { getResources, type Resource } from "@/shared/api/resources";

const WorkoutsCalendar = dynamic(() => import("./WorkoutsCalendar"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={32} />
    </Box>
  ),
});

const STATUS_COLOR: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  enrolled: "info",
  notified_absent: "warning",
  attended: "success",
  absent_extended: "warning",
  missed: "error",
  cancelled: "default",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function trainerLabel(t: TrainerInfo): string {
  const name = [t.first_name, t.last_name].filter(Boolean).join(" ");
  return name || t.telegram_id || t.user_id.slice(0, 8);
}

// ── Subscription card ────────────────────────────────────────────────────────

function SubscriptionCard({ sub }: { sub: SubscriptionInfo }) {
  const { t } = useTranslation();
  const pct = sub.classes_total > 0 ? Math.round((sub.classes_remaining / sub.classes_total) * 100) : 0;
  const color = sub.classes_remaining === 0 ? "error.main" : sub.classes_remaining <= 3 ? "warning.main" : "primary.main";

  return (
    <CardShell>
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t("workouts.subscription")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, mb: 1.5 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color, lineHeight: 1 }}>
            {sub.classes_remaining}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            / {sub.classes_total} {t("workouts.classesLeft")}
          </Typography>
        </Box>
        <Box sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(62,56,47,0.08)", overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: color, borderRadius: 3, transition: "width 0.3s" }} />
        </Box>
        {sub.expires_at && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {t("workouts.validUntil")}: {formatDate(sub.expires_at)}
          </Typography>
        )}
        {sub.max_extensions > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {t("workouts.extensions")}: {sub.extensions_used} / {sub.max_extensions}
          </Typography>
        )}
      </Box>
    </CardShell>
  );
}

// ── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, resourceSlug }: { plan: Plan; resourceSlug: string }) {
  const { t } = useTranslation();
  return (
    <CardShell>
      <Box sx={{ px: 2.5, py: 2, height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{plan.title}</Typography>
        {plan.class_count && (
          <Typography variant="body2" color="text.secondary">
            {plan.class_count} {t("workouts.classesCount")}
          </Typography>
        )}
        {plan.max_extensions != null && (
          <Typography variant="body2" color="text.secondary">
            {t("workouts.maxExtensions")}: {plan.max_extensions}
          </Typography>
        )}
        <Box sx={{ mt: "auto" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "secondary.main", mb: 1 }}>
            {plan.price_amount} {plan.currency}
          </Typography>
          <Button
            component={Link}
            href={`/account/programs/${resourceSlug}/buy`}
            variant="contained"
            size="small"
            fullWidth
          >
            {t("workouts.buy")}
          </Button>
        </Box>
      </Box>
    </CardShell>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

function Workouts() {
  const router = useRouter();
  const { t } = useTranslation();
  const { status, logout } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay({
    fallbackName: t("accountMyPrograms.profile.fallbackName"),
    fallbackPlan: t("accountMyPrograms.profile.fallbackPlan"),
  });
  const navItems = useAccountNavItems("/account/workouts");

  const [enrollments, setEnrollments] = useState<EnrollmentWithEvent[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
  const [trainers, setTrainers] = useState<TrainerInfo[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
  const [calendarEvents, setCalendarEvents] = useState<TrainingEvent[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    if (status === "anonymous") void router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void Promise.all([
      getMyEnrollments().catch(() => [] as EnrollmentWithEvent[]),
      getMySubscriptions().catch(() => [] as SubscriptionInfo[]),
      getScheduleTrainers().catch(() => [] as TrainerInfo[]),
      getAllPlans().catch(() => [] as Plan[]),
      getResources().catch(() => [] as Resource[]),
    ]).then(([enr, subs, trs, pls, res]) => {
      setEnrollments(enr);
      setSubscriptions(subs);
      setTrainers(trs);
      setPlans(pls.filter((p) => p.plan_type === "attendance"));
      setResources(res);
      setLoading(false);
    });
  }, [status]);

  const handleDatesSet = useCallback((start: string, end: string) => {
    setDateRange({ start, end });
  }, []);

  useEffect(() => {
    if (!dateRange || status !== "authenticated") return;
    let cancelled = false;
    void getEvents({
      trainer_id: selectedTrainerId || undefined,
      start: dateRange.start,
      end: dateRange.end,
    })
      .then((events) => { if (!cancelled) setCalendarEvents(events); })
      .catch(() => { if (!cancelled) setCalendarEvents([]); });
    return () => { cancelled = true; };
  }, [selectedTrainerId, dateRange, status]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.event_id)), [enrollments]);

  const mappedCalendarEvents = useMemo(
    () =>
      calendarEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start_at,
        end: e.end_at,
        backgroundColor: enrolledIds.has(e.id) ? "#6a7b6a" : "#b89f74",
        borderColor: "transparent",
      })),
    [calendarEvents, enrolledIds],
  );

  const activeSubscription = subscriptions.find((s) => s.status === "active");

  const resourceById = useMemo(
    () => Object.fromEntries(resources.map((r) => [r.id, r])),
    [resources],
  );

  const attendancePlans = useMemo(
    () =>
      plans.map((p) => ({
        plan: p,
        resource: resourceById[p.resource_id],
      })).filter((x) => x.resource),
    [plans, resourceById],
  );

  if (status === "loading" || loading) {
    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
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
              title={t("workouts.title")}
              subtitle={t("workouts.subtitle")}
              displayName={displayName}
              profileSubtitle={profileSubtitle}
            />

            {/* ── Subscription info ── */}
            {activeSubscription ? (
              <SubscriptionCard sub={activeSubscription} />
            ) : (
              <CardShell>
                <Box sx={{ px: 3, py: 2.5 }}>
                  <Typography color="text.secondary">{t("workouts.noSubscription")}</Typography>
                </Box>
              </CardShell>
            )}

            {/* ── Calendar ── */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("workouts.schedule")}
                </Typography>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>{t("workouts.filterByTrainer")}</InputLabel>
                  <Select
                    value={selectedTrainerId}
                    label={t("workouts.filterByTrainer")}
                    onChange={(e) => setSelectedTrainerId(e.target.value)}
                  >
                    <MenuItem value="">{t("workouts.allTrainers")}</MenuItem>
                    {trainers.map((tr) => (
                      <MenuItem key={tr.user_id} value={tr.user_id}>
                        <Box>
                          <Typography variant="body2" sx={{ lineHeight: 1.3 }}>
                            {trainerLabel(tr)}
                          </Typography>
                          {tr.telegram_id && (
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                              @{tr.telegram_id}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: 3,
                  p: { xs: 1.5, sm: 2 },
                  border: "1px solid rgba(62,56,47,0.08)",
                  boxShadow: "0 4px 20px rgba(62,56,47,0.06)",
                  "& .fc-button": {
                    bgcolor: "primary.main !important",
                    borderColor: "primary.main !important",
                    textTransform: "none",
                    fontFamily: "inherit",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  },
                  "& .fc-button-active, & .fc-button:focus": {
                    bgcolor: "primary.dark !important",
                    boxShadow: "none !important",
                  },
                  "& .fc-event": { borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 500 },
                }}
              >
                <WorkoutsCalendar
                  events={mappedCalendarEvents}
                  onDatesSet={(s, e) => void handleDatesSet(s, e)}
                  onEventClick={() => {}}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#6a7b6a" }} />
                  <Typography variant="caption" color="text.secondary">{t("workouts.legendEnrolled")}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#b89f74" }} />
                  <Typography variant="caption" color="text.secondary">{t("workouts.legendAvailable")}</Typography>
                </Box>
              </Box>
            </Box>

            {/* ── Plans ── */}
            {attendancePlans.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {t("workouts.plansTitle")}
                </Typography>
                <Grid container spacing={2}>
                  {attendancePlans.map(({ plan, resource }) => (
                    <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <PlanCard plan={plan} resourceSlug={resource.slug} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* ── Enrollments list ── */}
            <Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                {t("workouts.myClasses")}
              </Typography>

              {enrollments.length === 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 6, color: "text.secondary" }}>
                  <FitnessCenterOutlinedIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  <Typography>{t("workouts.empty")}</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {enrollments.map((enrollment) => (
                    <CardShell key={enrollment.id}>
                      <Box
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 2.5 },
                          display: "flex",
                          alignItems: { xs: "flex-start", sm: "center" },
                          justifyContent: "space-between",
                          gap: 2,
                          flexDirection: { xs: "column", sm: "row" },
                        }}
                      >
                        <Stack spacing={0.75}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {enrollment.event.title}
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <CalendarTodayOutlinedIcon sx={{ fontSize: "0.875rem", color: "text.secondary" }} />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(enrollment.event.start_at)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <AccessTimeOutlinedIcon sx={{ fontSize: "0.875rem", color: "text.secondary" }} />
                              <Typography variant="body2" color="text.secondary">
                                {formatTime(enrollment.event.start_at)}–{formatTime(enrollment.event.end_at)}
                              </Typography>
                            </Box>
                          </Box>
                          {enrollment.event.description && (
                            <Typography variant="body2" color="text.secondary">
                              {enrollment.event.description}
                            </Typography>
                          )}
                        </Stack>
                        <Chip
                          label={t(`calendar.enrollmentStatus.${enrollment.status}`, { defaultValue: enrollment.status })}
                          color={STATUS_COLOR[enrollment.status] ?? "default"}
                          size="small"
                          sx={{ flexShrink: 0, fontWeight: 600 }}
                        />
                      </Box>
                    </CardShell>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export { Workouts };
