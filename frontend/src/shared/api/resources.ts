import { request } from "./client";

type ResourceContent = {
  slug: string;
  content: string;
};

async function getResourceContent(slug: string): Promise<ResourceContent> {
  const result = await request<ResourceContent>(`/resources/${slug}/content`, { method: "GET" });
  if (!result) throw new Error("Empty response");
  return result;
}

export { getResourceContent };
export type { ResourceContent };