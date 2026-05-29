import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { ResourceInputSchema } from "@/lib/data/resource-constants";

// Edit fields and/or toggle status. All fields optional — send what changed.
const PatchSchema = ResourceInputSchema.partial().extend({
  status: z.enum(["active", "needs_review", "paused", "removed"]).optional(),
});

/**
 * PATCH /api/resources/:id — edit a resource or change its status.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let patch;
  try {
    patch = PatchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("resources")
    .update(patch)
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
