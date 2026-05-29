import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { PlanStep, PlanStepView } from "./types";

/**
 * Plan steps for a client, ordered by `order`, each annotated with a derived
 * `locked` flag — true when its `depends_on` prerequisite step is not `done`.
 */
export async function getPlanSteps(clientId: string): Promise<PlanStepView[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("plan_steps")
    .select("*")
    .eq("client_id", clientId)
    .order("order", { ascending: true });
  if (error) throw new Error(`getPlanSteps(${clientId}): ${error.message}`);

  const steps = (data ?? []) as PlanStep[];
  const statusById = new Map(steps.map((s) => [s.id, s.status]));

  return steps.map((s) => ({
    ...s,
    locked: s.depends_on != null && statusById.get(s.depends_on) !== "done",
  }));
}

export type StepCounts = { done: number; total: number };

/**
 * Done/total step counts for many clients in a single query, keyed by client_id.
 * Clients with no steps are absent from the map (callers default to 0/0).
 */
export async function getStepCountsByClient(
  clientIds: string[],
): Promise<Record<string, StepCounts>> {
  if (clientIds.length === 0) return {};
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("plan_steps")
    .select("client_id, status")
    .in("client_id", clientIds);
  if (error) throw new Error(`getStepCountsByClient: ${error.message}`);

  const counts: Record<string, StepCounts> = {};
  for (const row of (data ?? []) as { client_id: string; status: string }[]) {
    const c = (counts[row.client_id] ??= { done: 0, total: 0 });
    c.total += 1;
    if (row.status === "done") c.done += 1;
  }
  return counts;
}
