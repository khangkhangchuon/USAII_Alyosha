import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Client } from "./types";

export async function getClient(id: string): Promise<Client | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getClient(${id}): ${error.message}`);
  return (data as Client | null) ?? null;
}

export async function listClientsForCaseworker(
  caseworkerId: string,
): Promise<Client[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("clients")
    .select("*")
    .eq("assigned_caseworker_id", caseworkerId)
    .order("last_activity_at", { ascending: false });
  if (error)
    throw new Error(`listClientsForCaseworker(${caseworkerId}): ${error.message}`);
  return (data ?? []) as Client[];
}
