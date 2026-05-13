import { request } from "./client";

type ProgramAccess = {
  programSlug: string;
  hasAccess: boolean;
};

async function getAccountProgramAccesses(): Promise<ProgramAccess[]> {
  return (await request<ProgramAccess[]>("/programs/accesses", { method: "GET" })) ?? [];
}

export { getAccountProgramAccesses };
export type { ProgramAccess };