import { request } from "./client";

type AccessGrant = {
  id: string;
  resource_id: string;
  grant_type: string;
  starts_at: string;
  expires_at: string | null;
  is_lifetime: boolean;
};

async function getMyAccesses(): Promise<AccessGrant[]> {
  return (await request<AccessGrant[]>("/me/accesses", { method: "GET" })) ?? [];
}

export { getMyAccesses };
export type { AccessGrant };
