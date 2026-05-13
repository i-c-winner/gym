import type { ProgramAccess } from "./programs";

const stubProgramAccesses: ProgramAccess[] = [
  { programSlug: "flexibility", hasAccess: true },
  { programSlug: "strength", hasAccess: false },
  { programSlug: "split", hasAccess: false },
  { programSlug: "rhythmic", hasAccess: true },
];

async function getAccountProgramAccessesStub(): Promise<ProgramAccess[]> {
  return Promise.resolve(stubProgramAccesses);
}

export { getAccountProgramAccessesStub };