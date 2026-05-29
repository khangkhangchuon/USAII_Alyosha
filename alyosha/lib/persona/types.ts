export type PersonaRole = "client" | "caseworker";

export type Persona = {
  role: PersonaRole;
  id: string;
  name: string;
};

export const PERSONA_COOKIE = "alyosha_persona";
