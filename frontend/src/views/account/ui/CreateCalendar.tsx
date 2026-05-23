"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CalendarViewMonthOutlinedIcon from "@mui/icons-material/CalendarViewMonthOutlined";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import { useAuth } from "@/features/auth/model/auth-context";
import { useUserDisplay } from "@/shared/hooks/useUserDisplay";
import { useAccountNavItems } from "@/widgets/account-layout/ui/useAccountNavItems";
import { AccountSidebar } from "@/widgets/account-layout/ui/AccountSidebar";
import { AccountPageHeader } from "@/widgets/account-layout/ui/AccountPageHeader";
import { CardShell } from "@/shared/ui/CardShell";
import { ClassTypeCard } from "@/widgets/create-calendar/ui/ClassTypeCard";
import { ScheduleEditor } from "@/widgets/create-calendar/ui/ScheduleEditor";
import {
  EMPTY_FORM,
  DEFAULT_SCHEDULE,
  classTypeToForm,
  trainerLabel,
  type FormState,
} from "@/widgets/create-calendar/model/types";
import {
  getAdminClassTypes,
  getAdminUsers,
  createClassType,
  updateClassType,
  setClassTypeSchedules,
  deactivateClassType,
  materializeSessions,
  type ClassType,
  type TrainerUser,
} from "@/shared/api/gym";

function CreateCalendar() {
  const router = useRouter();
  const { user, status, csrfToken, logout } = useAuth();
  const { displayName, profileSubtitle } = useUserDisplay();
  const navItems = useAccountNavItems("/account/create_calendar");

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [trainers, setTrainers] = useState<TrainerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [materializing, setMaterializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "anonymous" || user?.role !== "admin") {
      router.replace("/account");
    }
  }, [status, user, router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cts, users] = await Promise.all([getAdminClassTypes(true), getAdminUsers()]);
      setClassTypes(cts);
      setTrainers(users.filter((u) => u.role === "trainer" || u.role === "admin"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Не удалось загрузить данные: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && user?.role === "admin") {
      void loadData();
    }
  }, [status, user, loadData]);

  const startEditing = (ct: ClassType) => {
    setEditingId(ct.id);
    setForm(classTypeToForm(ct));
    setError(null);
    setSuccess(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const startCreating = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, schedule: DEFAULT_SCHEDULE.map((s) => ({ ...s })) });
    setError(null);
    setSuccess(null);
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!csrfToken) { setError("Сессия истекла, обновите страницу"); return; }
    if (!form.title.trim()) { setError("Введите название занятия"); return; }
    if (!form.trainer_id) { setError("Выберите тренера"); return; }
    const activeSlots = form.schedule
      .map((s, i) => ({ day_of_week: i, start_time: s.time + ":00", enabled: s.enabled }))
      .filter((s) => s.enabled);
    if (!activeSlots.length) { setError("Добавьте хотя бы один день расписания"); return; }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        trainer_id: form.trainer_id,
        duration_minutes: Number(form.duration_minutes),
        max_participants: Number(form.max_participants),
        base_rate_per_day: Number(form.base_rate_per_day),
      };
      const slots = activeSlots.map(({ day_of_week, start_time }) => ({ day_of_week, start_time }));

      if (editingId) {
        await updateClassType(editingId, payload, csrfToken);
        await setClassTypeSchedules(editingId, slots, csrfToken);
        setSuccess("Занятие обновлено");
      } else {
        await createClassType({ ...payload, schedules: slots }, csrfToken);
        setSuccess("Занятие создано");
        startCreating();
      }
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка сохранения";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (ct: ClassType) => {
    if (!csrfToken) return;
    try {
      if (ct.is_active) {
        await deactivateClassType(ct.id, csrfToken);
      } else {
        await updateClassType(ct.id, { is_active: true }, csrfToken);
      }
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  if (status === "loading" || (status === "authenticated" && user?.role !== "admin")) {
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
              title="Управление занятиями"
              subtitle="Создавайте и редактируйте типы занятий с расписанием"
              displayName={displayName}
              profileSubtitle={profileSubtitle}
              backHref="/account"
            />

            {/* Кнопки действий */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap" }}>
              <Button
                component={Link}
                href="/account/all-sessions"
                startIcon={<CalendarViewMonthOutlinedIcon />}
                sx={{
                  borderRadius: 3,
                  border: "1.5px solid rgba(106,123,106,0.35)",
                  color: "primary.main",
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(106,123,106,0.07)", borderColor: "primary.main" },
                }}
              >
                Расписание всех занятий
              </Button>

              <Button
                onClick={() => {
                  if (!csrfToken) { setError("Нет CSRF-токена, обновите страницу"); return; }
                  setMaterializing(true);
                  materializeSessions(csrfToken)
                    .then(({ created }) => {
                      setSuccess(
                        created > 0
                          ? `Сгенерировано ${created} новых занятий`
                          : "Новых занятий не добавлено — все уже созданы",
                      );
                    })
                    .catch((e: unknown) => setError(e instanceof Error ? e.message : "Ошибка"))
                    .finally(() => setMaterializing(false));
                }}
                disabled={materializing}
                startIcon={
                  materializing
                    ? <CircularProgress size={16} sx={{ color: "inherit" }} />
                    : <AutorenewRoundedIcon />
                }
                sx={{
                  borderRadius: 3,
                  border: "1.5px solid rgba(184,159,116,0.45)",
                  color: "secondary.main",
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(184,159,116,0.07)", borderColor: "secondary.main" },
                  "&:disabled": { opacity: 0.6 },
                }}
              >
                {materializing ? "Генерация..." : "Сгенерировать занятия"}
              </Button>
            </Stack>

            <Grid container spacing={{ xs: 2, md: 3 }}>
              {/* Список типов занятий */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: { xs: "1.5rem", md: "1.75rem" }, color: "text.primary" }}>
                      Типы занятий
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddRoundedIcon />}
                      onClick={startCreating}
                      sx={{ bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 3, px: 2, "&:hover": { bgcolor: "primary.dark" } }}
                    >
                      Новое
                    </Button>
                  </Stack>

                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: 3 }} />
                    ))
                  ) : classTypes.length === 0 ? (
                    <CardShell>
                      <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography sx={{ color: "text.secondary" }}>Нет созданных занятий</Typography>
                      </Box>
                    </CardShell>
                  ) : (
                    classTypes.map((ct) => (
                      <ClassTypeCard
                        key={ct.id}
                        ct={ct}
                        trainers={trainers}
                        onEdit={() => startEditing(ct)}
                        onToggle={() => void handleToggle(ct)}
                      />
                    ))
                  )}
                </Stack>
              </Grid>

              {/* Форма */}
              <Grid size={{ xs: 12, md: 7 }}>
                <div ref={formRef}>
                  <CardShell>
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <Typography sx={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: { xs: "1.5rem", md: "1.75rem" }, color: "text.primary", mb: 3 }}>
                        {editingId ? "Редактирование" : "Новое занятие"}
                      </Typography>

                      {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }} onClose={() => setError(null)}>
                          {error}
                        </Alert>
                      )}
                      {success && (
                        <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }} onClose={() => setSuccess(null)}>
                          {success}
                        </Alert>
                      )}

                      <Stack spacing={2.5}>
                        <TextField
                          label="Название"
                          fullWidth
                          value={form.title}
                          onChange={(e) => updateField("title", e.target.value)}
                          placeholder="Например, Хатха-йога"
                        />
                        <TextField
                          label="Описание"
                          fullWidth
                          multiline
                          rows={2}
                          value={form.description}
                          onChange={(e) => updateField("description", e.target.value)}
                          placeholder="Краткое описание занятия"
                        />

                        <Box>
                          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 0.75 }}>
                            Тренер
                          </Typography>
                          <Select
                            fullWidth
                            value={form.trainer_id}
                            onChange={(e) => updateField("trainer_id", e.target.value)}
                            displayEmpty
                            size="small"
                          >
                            <MenuItem value="" disabled>Выберите тренера</MenuItem>
                            {trainers.map((t) => (
                              <MenuItem key={t.id} value={t.id}>{trainerLabel(t)}</MenuItem>
                            ))}
                          </Select>
                        </Box>

                        <Divider />

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Длительность"
                              type="number"
                              fullWidth
                              value={form.duration_minutes}
                              onChange={(e) => updateField("duration_minutes", e.target.value)}
                              slotProps={{ input: { endAdornment: <InputAdornment position="end">мин</InputAdornment>, inputProps: { min: 1, max: 480 } } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Мест"
                              type="number"
                              fullWidth
                              value={form.max_participants}
                              onChange={(e) => updateField("max_participants", e.target.value)}
                              slotProps={{ input: { inputProps: { min: 1, max: 200 } } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                              label="Ставка за день"
                              type="number"
                              fullWidth
                              value={form.base_rate_per_day}
                              onChange={(e) => updateField("base_rate_per_day", e.target.value)}
                              slotProps={{ input: { endAdornment: <InputAdornment position="end">₽</InputAdornment>, inputProps: { min: 0 } } }}
                            />
                          </Grid>
                        </Grid>

                        <Divider />

                        <ScheduleEditor
                          schedule={form.schedule}
                          onChange={(s) => updateField("schedule", s)}
                        />

                        <Divider />

                        <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} sx={{ justifyContent: "flex-end" }}>
                          {editingId && (
                            <Button onClick={startCreating} sx={{ borderRadius: 3, color: "text.secondary", minHeight: 44 }}>
                              Отмена
                            </Button>
                          )}
                          <Button
                            onClick={() => void handleSave()}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={16} /> : <CheckRoundedIcon />}
                            sx={{
                              px: 3,
                              minHeight: 44,
                              borderRadius: 3,
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                              "&:hover": { bgcolor: "primary.dark" },
                              "&:disabled": { opacity: 0.6 },
                            }}
                          >
                            {saving ? "Сохранение..." : editingId ? "Сохранить" : "Создать"}
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  </CardShell>
                </div>
              </Grid>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export { CreateCalendar };
