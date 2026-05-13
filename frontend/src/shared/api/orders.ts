import { request } from "./client";

type OrderRead = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  provider: string;
};

async function createOrder(
  resourceId: string,
  planId: string,
  csrfToken: string,
): Promise<OrderRead> {
  const result = await request<OrderRead>("/orders", {
    method: "POST",
    body: JSON.stringify({ resource_id: resourceId, plan_id: planId, provider: "manual" }),
    headers: { "X-CSRF-Token": csrfToken },
  });
  if (!result) throw new Error("Empty response");
  return result;
}

export { createOrder };
export type { OrderRead };
