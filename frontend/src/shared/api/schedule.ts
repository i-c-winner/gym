import { request } from "./client";

type TrainingEvent = {
  id: string;
  trainer_id: string;
  resource_id: string | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  max_participants: number | null;
  status: string;
  created_at: string;
};

type Enrollment = {
  id: string;
  user_id: string;
  event_id: string;
  subscription_id: string;
  status: string;
  notified_at: string | null;
  confirmed_at: string | null;
  extended: boolean;
  created_at: string;
};

type EnrollmentWithEvent = Enrollment & {
  event: TrainingEvent;
};

type TrainerInfo = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  telegram_id: string | null;
};

type CreateEventPayload = {
  trainer_id: string;
  resource_id?: string | null;
  title: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  max_participants?: number | null;
};

type AttendanceItem = {
  enrollment_id: string;
  attended: boolean;
};

async function getEvents(params?: {
  trainer_id?: string;
  resource_id?: string;
  start?: string;
  end?: string;
}): Promise<TrainingEvent[]> {
  const query = new URLSearchParams();
  if (params?.trainer_id) query.set("trainer_id", params.trainer_id);
  if (params?.resource_id) query.set("resource_id", params.resource_id);
  if (params?.start) query.set("start", params.start);
  if (params?.end) query.set("end", params.end);
  const qs = query.toString();
  return (await request<TrainingEvent[]>(`/schedule${qs ? `?${qs}` : ""}`)) ?? [];
}

async function getMyEnrollments(): Promise<EnrollmentWithEvent[]> {
  return (await request<EnrollmentWithEvent[]>("/me/enrollments")) ?? [];
}

async function createEvent(payload: CreateEventPayload, csrfToken: string): Promise<TrainingEvent | null> {
  return request<TrainingEvent>("/schedule", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "X-CSRF-Token": csrfToken },
  });
}

async function getEnrollments(eventId: string): Promise<Enrollment[]> {
  return (await request<Enrollment[]>(`/schedule/${eventId}/enrollments`)) ?? [];
}

async function confirmAttendance(
  eventId: string,
  attendances: AttendanceItem[],
  csrfToken: string,
): Promise<Enrollment[]> {
  return (
    (await request<Enrollment[]>(`/schedule/${eventId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ attendances }),
      headers: { "X-CSRF-Token": csrfToken },
    })) ?? []
  );
}

async function getTrainers(): Promise<TrainerInfo[]> {
  return (await request<TrainerInfo[]>("/admin/trainers")) ?? [];
}

async function getScheduleTrainers(): Promise<TrainerInfo[]> {
  return (await request<TrainerInfo[]>("/schedule/trainers")) ?? [];
}

type SubscriptionInfo = {
  id: string;
  resource_id: string;
  classes_total: number;
  classes_remaining: number;
  max_extensions: number;
  extensions_used: number;
  starts_at: string;
  expires_at: string | null;
  status: string;
};

async function getMySubscriptions(): Promise<SubscriptionInfo[]> {
  return (await request<SubscriptionInfo[]>("/me/subscriptions")) ?? [];
}

export {
  getEvents, getMyEnrollments, createEvent, getEnrollments,
  confirmAttendance, getTrainers, getScheduleTrainers, getMySubscriptions,
};
export type { TrainingEvent, Enrollment, EnrollmentWithEvent, CreateEventPayload, AttendanceItem, TrainerInfo, SubscriptionInfo };
