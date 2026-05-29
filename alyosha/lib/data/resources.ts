import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Resource, ResourceType } from "./types";

// Re-export client-safe constants so existing imports keep working.
export {
  RESOURCE_TYPES,
  RESOURCE_TYPE_VALUES,
  ResourceInputSchema,
  type ResourceInput,
} from "./resource-constants";

export type ResourceFilter = {
  type?: ResourceType;
  q?: string;
};

/**
 * Active resources in the shared network, newest first. Optionally filtered by
 * category and a case-insensitive search over title + description.
 */
export async function listResources(
  filter: ResourceFilter = {},
): Promise<Resource[]> {
  const sb = supabaseServer();
  let query = sb
    .from("resources")
    .select("*, organizations(name)")
    .eq("status", "active")
    .order("date_listed", { ascending: false });

  if (filter.type) query = query.eq("type", filter.type);
  if (filter.q && filter.q.trim()) {
    const term = `%${filter.q.trim()}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`listResources: ${error.message}`);

  return (data ?? []).map((row) => {
    const { organizations, ...rest } = row as Resource & {
      organizations?: { name: string } | null;
    };
    return { ...rest, org_name: organizations?.name ?? null } as Resource;
  });
}

/** All resources owned by an org, any status, newest first (org "My Resources"). */
export async function listResourcesByOrg(orgId: string): Promise<Resource[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("resources")
    .select("*, organizations(name)")
    .eq("org_id", orgId)
    .order("date_listed", { ascending: false });
  if (error) throw new Error(`listResourcesByOrg(${orgId}): ${error.message}`);
  return (data ?? []).map((row) => {
    const { organizations, ...rest } = row as Resource & {
      organizations?: { name: string } | null;
    };
    return { ...rest, org_name: organizations?.name ?? null } as Resource;
  });
}

