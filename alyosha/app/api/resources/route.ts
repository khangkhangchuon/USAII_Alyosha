import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { ResourceInputSchema } from "@/lib/data/resource-constants";
import { getActivePersona } from "@/lib/persona/server";
import { getCaseworker } from "@/lib/data/caseworkers";

/**
 * POST /api/resources — create a resource owned by the active caseworker's org.
 */
export async function POST(request: Request) {
  const persona = await getActivePersona();
  if (persona.role !== "caseworker") {
    return NextResponse.json({ error: "Caseworkers only" }, { status: 403 });
  }
  const cw = await getCaseworker(persona.id);
  if (!cw?.org_id) {
    return NextResponse.json(
      { error: "No org associated with this caseworker" },
      { status: 400 },
    );
  }

  let input;
  try {
    input = ResourceInputSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("resources")
    .insert({
      id: crypto.randomUUID(),
      org_id: cw.org_id,
      status: "active",
      ...input,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
