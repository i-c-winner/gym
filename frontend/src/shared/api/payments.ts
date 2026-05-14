import { request } from "./client";

type Provider = "click" | "payme";

async function simulatePayment(orderId: string, provider: Provider, csrfToken: string): Promise<void> {
  await request("/payments/simulate", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId, provider }),
    headers: { "X-CSRF-Token": csrfToken },
  });
}

export { simulatePayment };
export type { Provider };
