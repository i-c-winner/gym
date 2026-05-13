import { request } from "./client";

type Plan = {
  id: string;
  resource_id: string;
  code: string;
  title: string;
  duration_type: string;
  duration_months: number | null;
  price_amount: string;
  currency: string;
};

async function getPlansByResourceSlug(slug: string): Promise<Plan[]> {
  return (await request<Plan[]>(`/plans?resource_slug=${encodeURIComponent(slug)}`, { method: "GET" })) ?? [];
}

export { getPlansByResourceSlug };
export type { Plan };
