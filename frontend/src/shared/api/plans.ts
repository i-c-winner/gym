import { request } from "./client";

type Plan = {
  id: string;
  resource_id: string;
  code: string;
  title: string;
  plan_type: string;
  duration_type: string;
  duration_months: number | null;
  price_amount: string;
  currency: string;
  class_count: number | null;
  max_extensions: number | null;
};

async function getPlansByResourceSlug(slug: string): Promise<Plan[]> {
  return (await request<Plan[]>(`/plans?resource_slug=${encodeURIComponent(slug)}`, { method: "GET" })) ?? [];
}

async function getAllPlans(): Promise<Plan[]> {
  return (await request<Plan[]>("/plans", { method: "GET" })) ?? [];
}

export { getPlansByResourceSlug, getAllPlans };
export type { Plan };
