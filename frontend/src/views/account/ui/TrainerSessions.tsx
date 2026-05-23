"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";
import { SessionCard } from "@/widgets/trainer-sessions/ui/SessionCard";
import { AttendanceDialog } from "@/widgets/trainer-sessions/ui/AttendanceDialog";
import {
  getTrainerPastSessions,
  getTrainerUpcomingSessions,
  getTrainerAbsenceRequests,
  getUserClassTypes,
  type TrainerSession,
  type AbsenceRequest,
  type ClassType,
} from "@/shared/api/gym";

function TrainerSessions() {
  const router = useRouter();
  const { status, user, logout, csrfToken } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay();
  const navItems = useAccountNavItems("/account/trainer");

  const [tab, setTab] = useState(0);
  const [pastSessions, setPastSessions] = useState<TrainerSession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<TrainerSession[]>([]);
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<TrainerSession | null>(null);

  const isTrainer = user?.role === "trainer" || user?.role === "admin";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous" || !isTrainer) {
      router.replace("/account");
    }
  }, [status, isTrainer, router]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [past, upcoming, absReqs, cts] = await Promise.all([
        getTrainerPastSessions(),
        getTrainerUpcomingSessions(),
        getTrainerAbsenceRequests(),
        getUserClassTypes(),
      ]);
      setPastSessions(past);
      setUpcomingSessions(upcoming);
      setAbsenceRequests(absReqs);
      setClassTypes(cts);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && isTrainer) void loadAll();
  }, [status, isTrainer, loadAll]);

  const classTypeMap = new Map(classTypes.map((ct) => [ct.id, ct.title]));

  const warnCountBySession = new Map<string, number>();
  for (const r of absenceRequests) {
    if (r.status === "pending" && r.class_session_id) {
      warnCountBySession.set(r.class_session_id, (warnCountBySession.get(r.class_session_id) ?? 0) + 1);
    }
  }

  const warnedBookingIds = new Set(
    absenceRequests.filter((r) => r.status === "pending").map((r) => r.booking_id),
  );

  const sessions = tab === 0 ? [...pastSessions].reverse() : upcomingSessions;

  if (status === "loading" || (loading && sessions.length === 0)) {
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
            onLogout={() => void logout().then(() => router.replace("/"))}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 9.75 }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            <AccountPageHeader
              title="Занятия тренера"
              subtitle="Отметьте явку участников после занятия"
              displayName={displayName}
              profileSubtitle={profileSubtitle}
              backHref="/account"
            />

            <CardShell>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {/* Статистика */}
                <Stack direction="row" sx={{ mb: 3, gap: { xs: 1.5, sm: 3 }, flexWrap: "wrap" }}>
                  <Stack sx={{ alignItems: "center", minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: warnedBookingIds.size > 0 ? "#b89f74" : "text.disabled", lineHeight: 1 }}>
                      {warnedBookingIds.size}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <WarningAmberRoundedIcon sx={{ fontSize: 12, color: "text.secondary" }} />
                      <Typography sx={{ fontSize: { xs: "0.6875rem", sm: "0.75rem" }, color: "text.secondary", whiteSpace: "nowrap" }}>
                        предупреждений
                      </Typography>
                    </Stack>
                  </Stack>
                  <Divider orientation="vertical" flexItem />
                  <Stack sx={{ alignItems: "center", minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: "primary.main", lineHeight: 1 }}>
                      {upcomingSessions.length}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: "0.6875rem", sm: "0.75rem" }, color: "text.secondary", whiteSpace: "nowrap" }}>
                      предстоящих
                    </Typography>
                  </Stack>
                  <Divider orientation="vertical" flexItem />
                  <Stack sx={{ alignItems: "center", minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" }, color: "text.secondary", lineHeight: 1 }}>
                      {pastSessions.length}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: "0.6875rem", sm: "0.75rem" }, color: "text.secondary", whiteSpace: "nowrap" }}>
                      завершённых
                    </Typography>
                  </Stack>
                </Stack>

                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v as number)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    mb: 2.5,
                    "& .MuiTab-root": { fontFamily: "inherit", fontSize: { xs: "0.8125rem", sm: "0.9rem" }, textTransform: "none", minHeight: 44 },
                    "& .Mui-selected": { color: "primary.main", fontWeight: 700 },
                    "& .MuiTabs-indicator": { bgcolor: "primary.main" },
                  }}
                >
                  <Tab label={`Завершённые (${pastSessions.length})`} />
                  <Tab label={`Предстоящие (${upcomingSessions.length})`} />
                </Tabs>

                {loading ? (
                  <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : sessions.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Typography sx={{ color: "text.secondary" }}>
                      {tab === 0 ? "Нет завершённых занятий" : "Нет предстоящих занятий"}
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {sessions.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        classTypeTitle={classTypeMap.get(s.class_type_id) ?? "—"}
                        warnedCount={warnCountBySession.get(s.id) ?? 0}
                        isPast={tab === 0}
                        onClick={() => setActiveSession(s)}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </CardShell>
          </Stack>
        </Grid>
      </Grid>

      {activeSession && (
        <AttendanceDialog
          session={activeSession}
          classTypeTitle={classTypeMap.get(activeSession.class_type_id) ?? "—"}
          absenceRequests={absenceRequests}
          csrfToken={csrfToken}
          isPast={tab === 0}
          onClose={() => setActiveSession(null)}
          onSaved={() => void loadAll()}
        />
      )}
    </Box>
  );
}

export { TrainerSessions };
