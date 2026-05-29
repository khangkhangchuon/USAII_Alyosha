import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { getActivePersona } from "@/lib/persona/server";
import { getCaseworker } from "@/lib/data/caseworkers";
import { IntakeOutputSchema } from "@/lib/ai/schemas";
import { checkRateLimit, clientKey } from "@/lib/ratelimit";

const BodySchema = z.object({
  name: z.string().min(1),
  released_on: z.string().optional(),
  profile: IntakeOutputSchema,
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/**
 * POST /api/intake/approve — persist an approved intake profile as a new client
 * plus dependency-ordered plan_steps. Returns the new client id.
 */
export async function POST(request: Request) {
  if (!checkRateLimit(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment." },
      { status: 429 },
    );
  }
  const persona = await getActivePersona();
  if (persona.role !== "caseworker") {
    return NextResponse.json({ error: "Caseworkers only" }, { status: 403 });
  }

  let body;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cw = await getCaseworker(persona.id);
  const sb = supabaseServer();
  const clientId = `client-${slugify(body.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const p = body.profile;

  const { error: clientErr } = await sb.from("clients").insert({
    id: clientId,
    name: body.name,
    released_on: body.released_on || null,
    documents: {},
    skills: p.structured_profile.skills,
    needs: p.structured_profile.immediate_needs,
    goals: null,
    assigned_caseworker_id: cw?.id ?? null,
    profile_summary: p.profile_summary,
    last_activity_at: new Date().toISOString(),
  });
  if (clientErr) {
    return NextResponse.json({ error: clientErr.message }, { status: 500 });
  }

  // Pre-generate step ids so depends_on (referencing an `order`) can resolve.
  const idByOrder = new Map<number, string>();
  for (const s of p.plan_steps) {
    idByOrder.set(s.order, `${clientId}-step-${s.order}`);
  }

  const stepRows = p.plan_steps.map((s) => ({
    id: idByOrder.get(s.order)!,
    client_id: clientId,
    order: s.order,
    category: s.category,
    title: s.title,
    instructions: s.instructions,
    where_to_go: s.where_to_go,
    what_to_bring: s.what_to_bring,
    status: "todo",
    depends_on: s.depends_on ? (idByOrder.get(s.depends_on) ?? null) : null,
  }));

  const { error: stepsErr } = await sb.from("plan_steps").insert(stepRows);
  if (stepsErr) {
    return NextResponse.json({ error: stepsErr.message }, { status: 500 });
  }

  return NextResponse.json({ client_id: clientId });
}
