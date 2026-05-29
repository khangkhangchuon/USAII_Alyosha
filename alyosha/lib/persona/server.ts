import "server-only";
import { cookies } from "next/headers";
import { PERSONA_COOKIE, type Persona, type PersonaRole } from "./types";

const DEFAULT_PERSONA: Persona = {
  role: "client",
  id: "client-marcus-bell",
  name: "Marcus Bell",
};

export async function getActivePersona(): Promise<Persona> {
  const store = await cookies();
  const raw = store.get(PERSONA_COOKIE)?.value;
  if (!raw) return DEFAULT_PERSONA;
  try {
    const parsed = JSON.parse(raw) as Partial<Persona>;
    if (parsed.role && parsed.id && parsed.name) {
      return parsed as Persona;
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_PERSONA;
}

export async function setActivePersona(persona: Persona): Promise<void> {
  const store = await cookies();
  store.set(PERSONA_COOKIE, JSON.stringify(persona), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
}

export async function getActiveRole(): Promise<PersonaRole> {
  const persona = await getActivePersona();
  return persona.role;
}
