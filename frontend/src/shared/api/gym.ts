import { request } from "@/shared/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export type ScheduleSlot = {
  id?: string;
  day_of_week: number; // 0=Mon … 6=Sun
  start_time: string;  // "HH:MM:SS"
};

export type ClassType = {
  id: string;
  title: string;
  description: string | null;
  trainer_id: string;
  duration_minutes: number;
  max_participants: number;
  base_rate_per_day: string;
  is_active: boolean;
  schedules: ScheduleSlot[];
};

export type TrainerUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  telephone: string | null;
  role: string;
};

export type ClassTypeCreatePayload = {
  title: string;
  description?: string;
  trainer_id: string;
  duration_minutes: number;
  max_participants: number;
  base_rate_per_day: number;
  schedules: Array<{ day_of_week: number; start_time: string }>;
};

export type ClassTypeUpdatePayload = Partial<{
  title: string;
  description: string;
  trainer_id: string;
  duration_minutes: number;
  max_participants: number;
  base_rate_per_day: number;
  is_active: boolean;
}>;

// ── Admin: Class Types ────────────────────────────────────────────────────────

export async function getAdminClassTypes(includeInactive = true): Promise<ClassType[]> {
  const res = await request<ClassType[]>(
    `/gym/admin/class-types?include_inactive=${includeInactive}`,
    { method: "GET" },
  );
  return res ?? [];
}

export async function createClassType(
  payload: ClassTypeCreatePayload,
  csrfToken: string,
): Promise<ClassType> {
  const res = await request<ClassType>("/gym/admin/class-types", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "X-CSRF-Token": csrfToken },
  });
  if (!res) throw new Error("Empty response");
  return res;
}

export async function updateClassType(
  id: string,
  payload: ClassTypeUpdatePayload,
  csrfToken: string,
): Promise<ClassType> {
  const res = await request<ClassType>(`/gym/admin/class-types/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: { "X-CSRF-Token": csrfToken },
  });
  if (!res) throw new Error("Empty response");
  return res;
}

export async function setClassTypeSchedules(
  id: string,
  slots: Array<{ day_of_week: number; start_time: string }>,
  csrfToken: string,
): Promise<ClassType> {
  const res = await request<ClassType>(`/gym/admin/class-types/${id}/schedules`, {
    method: "PUT",
    body: JSON.stringify(slots),
    headers: { "X-CSRF-Token": csrfToken },
  });
  if (!res) throw new Error("Empty response");
  return res;
}

export async function deactivateClassType(id: string, csrfToken: string): Promise<void> {
  await request<null>(`/gym/admin/class-types/${id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": csrfToken },
  });
}

// ── Admin: Users ─────────────────────────────────────────────────────────────

export async function getAdminUsers(): Promise<TrainerUser[]> {
  const res = await request<TrainerUser[]>("/gym/admin/users", { method: "GET" });
  return res ?? [];
}

// ── Admin: Sessions ───────────────────────────────────────────────────────────

export type AdminSession = {
  session_id: string;
  scheduled_at: string;
  ends_at: string;
  status: string;
  class_type_id: string;
  class_type_title: string;
  trainer_id: string;
  trainer_name: string;
  duration_minutes: number;
  max_participants: number;
};

export async function materializeSessions(csrfToken: string): Promise<{ created: number }> {
  const res = await request<{ created: number }>("/gym/admin/materialize-sessions", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
  });
  return res ?? { created: 0 };
}

export async function getAdminSessions(params?: {
  class_type_id?: string;
  trainer_id?: string;
}): Promise<AdminSession[]> {
  const q = new URLSearchParams();
  if (params?.class_type_id) q.set("class_type_id", params.class_type_id);
  if (params?.trainer_id) q.set("trainer_id", params.trainer_id);
  const qs = q.toString() ? `?${q.toString()}` : "";
  const res = await request<AdminSession[]>(`/gym/admin/sessions${qs}`, { method: "GET" });
  return res ?? [];
}

// ── User schedule ─────────────────────────────────────────────────────────────

export type ScheduleEvent = {
  booking_id: string;
  booking_status: string;
  session_id: string;
  scheduled_at: string;
  ends_at: string;
  class_type_title: string;
  class_type_description: string | null;
  duration_minutes: number;
  max_participants: number;
  subscription_id: string;
};

export async function getUserSchedule(): Promise<ScheduleEvent[]> {
  const res = await request<ScheduleEvent[]>("/gym/schedule", { method: "GET" });
  return res ?? [];
}

// ── User subscriptions & credits ──────────────────────────────────────────────

export type DiscountCredit = {
  id: string;
  class_type_id: string;
  amount: string;
  is_used: boolean;
};

export type SubscriptionPreview = {
  class_type_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  days_count: number;
  gross_amount: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  available_spots: number;
};

export type Subscription = {
  id: string;
  class_type_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  status: string;
  total_amount: string;
  currency: string;
};

export async function getUserCredits(): Promise<DiscountCredit[]> {
  const res = await request<DiscountCredit[]>("/gym/credits", { method: "GET" });
  return res ?? [];
}

export async function getUserClassTypes(): Promise<ClassType[]> {
  const res = await request<ClassType[]>("/gym/class-types", { method: "GET" });
  return res ?? [];
}

export async function getUserSubscriptions(): Promise<Subscription[]> {
  const res = await request<Subscription[]>("/gym/subscriptions", { method: "GET" });
  return res ?? [];
}

export async function previewSubscription(
  class_type_id: string,
  period_type: string,
): Promise<SubscriptionPreview | null> {
  return request<SubscriptionPreview>("/gym/subscriptions/preview", {
    method: "POST",
    body: JSON.stringify({ class_type_id, period_type }),
  });
}

export async function purchaseSubscription(
  class_type_id: string,
  period_type: string,
  provider_txn_id: string,
): Promise<Subscription | null> {
  return request<Subscription>("/gym/subscriptions", {
    method: "POST",
    body: JSON.stringify({ class_type_id, period_type, provider: "mock", provider_txn_id }),
  });
}

export async function activateSubscription(
  subscription_id: string,
  provider_txn_id: string,
): Promise<void> {
  await request("/gym/payments/webhook", {
    method: "POST",
    body: JSON.stringify({ subscription_id, provider_txn_id, status: "succeeded" }),
  });
}