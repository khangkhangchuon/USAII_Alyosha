import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export type Caseworker = {
  id: string;
  name: string;
  org_id: string | null;
  role: string | null;
};

export async function getCaseworker(id: string): Promise<Caseworker | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("caseworkers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getCaseworker(${id}): ${error.message}`);
  return (data as Caseworker | null) ?? null;
}
