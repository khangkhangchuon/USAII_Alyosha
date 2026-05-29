import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

const BodySchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]),
});

/**
 * PATCH /api/steps/:id — update a plan step's status. This is the client→org
 * sync write: the caseworker dashboard reads the same plan_steps rows.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let parsed;
  try {
    parsed = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Body must be { status: 'todo' | 'in_progress' | 'done' }" },
      { status: 400 },
    );
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("plan_steps")
    .update({ status: parsed.status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
