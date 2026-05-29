import { NextResponse } from "next/server";
import { setActivePersona } from "@/lib/persona/server";
import type { Persona, PersonaRole } from "@/lib/persona/types";

/**
 * Demo-mode persona switch. No real auth — sets a cookie identifying the
 * active client or caseworker, then redirects.
 *
 *   GET /api/persona?role=client&id=marcus-bell&name=Marcus%20Bell&next=/home
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role") as PersonaRole | null;
  const id = url.searchParams.get("id");
  const name = url.searchParams.get("name");
  const next = url.searchParams.get("next") ?? "/";

  if (!role || !id || !name || (role !== "client" && role !== "caseworker")) {
    return NextResponse.json(
      { error: "role, id, and name are required" },
      { status: 400 },
    );
  }

  const persona: Persona = { role, id, name };
  await setActivePersona(persona);
  return NextResponse.redirect(new URL(next, url.origin));
}
