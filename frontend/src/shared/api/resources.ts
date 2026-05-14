import { request } from "./client";

type ResourceContent = {
  slug: string;
  content: string;
};

type Resource = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
};

async function getResourceContent(slug: string): Promise<ResourceContent> {
  const result = await request<ResourceContent>(`/resources/${slug}/content`, { method: "GET" });
  if (!result) throw new Error("Empty response");
  return result;
}

async function getResources(): Promise<Resource[]> {
  return (await request<Resource[]>("/resources", { method: "GET" })) ?? [];
}

async function getResourceBySlug(slug: string): Promise<Resource | null> {
  try {
    return await request<Resource>(`/resources/${slug}`, { method: "GET" });
  } catch {
    return null;
  }
}

export { getResourceContent, getResources, getResourceBySlug };
export type { ResourceContent, Resource };