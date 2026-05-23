// ── Типы и вспомогательные функции для управления занятиями ─────────────────

import type { ClassType, TrainerUser } from "@/shared/api/gym";

export const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export type ScheduleDraft = {
  enabled: boolean;
  time: string; // "HH:MM"
};

export type FormState = {
  title: string;
  description: string;
  trainer_id: string;
  duration_minutes: string;
  max_participants: string;
  base_rate_per_day: string;
  schedule: ScheduleDraft[];
};

export const DEFAULT_SCHEDULE: ScheduleDraft[] = DAY_LABELS.map(() => ({
  enabled: false,
  time: "09:00",
}));

export const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  trainer_id: "",
  duration_minutes: "60",
  max_participants: "10",
  base_rate_per_day: "300",
  schedule: DEFAULT_SCHEDULE.map((s) => ({ ...s })),
};

export function classTypeToForm(ct: ClassType): FormState {
  const schedule = DEFAULT_SCHEDULE.map((d) => ({ ...d }));
  for (const slot of ct.schedules) {
    const dow = slot.day_of_week;
    if (dow >= 0 && dow < 7) {
      schedule[dow] = {
        enabled: true,
        time: slot.start_time.slice(0, 5), // "HH:MM:SS" → "HH:MM"
      };
    }
  }
  return {
    title: ct.title,
    description: ct.description ?? "",
    trainer_id: ct.trainer_id,
    duration_minutes: String(ct.duration_minutes),
    max_participants: String(ct.max_participants),
    base_rate_per_day: ct.base_rate_per_day,
    schedule,
  };
}

export function trainerLabel(t: TrainerUser): string {
  return [t.first_name, t.last_name].filter(Boolean).join(" ") || t.telephone || t.id.slice(0, 8);
}
