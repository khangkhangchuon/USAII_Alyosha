// PHASE-4 PLACEHOLDER. The real Smart Intake (build-plan §5.1) will POST the
// intake form to /api/intake and stream an OpenAI-generated, RAG-grounded profile.
// For now `generateMockProfile` returns a deterministic fixture so the intake
// review/approve UI can be built and demoed without an API key.

export type GeneratedProfile = {
  profile_summary: string;
  immediate_needs: string[];
  skills: string[];
  eligible_programs: string[];
  next_steps: { order: number; title: string; rationale: string }[];
  risk_factors: string[];
};

export type IntakeForm = {
  name: string;
  released_on: string;
  incarceration_years: string;
  location: string;
  documents: string;
  skills: string;
  needs: string;
  goals: string;
  notes: string;
};

export const EMPTY_INTAKE: IntakeForm = {
  name: "",
  released_on: "",
  incarceration_years: "",
  location: "Brooklyn, NY",
  documents: "",
  skills: "",
  needs: "",
  goals: "",
  notes: "",
};

export function generateMockProfile(form: IntakeForm): GeneratedProfile {
  const name = form.name.trim() || "this client";
  const first = name.split(" ")[0];
  return {
    profile_summary:
      `${name} recently returned to ${form.location || "NYC"} after ` +
      `${form.incarceration_years || "several"} years. ` +
      `Priorities center on ${form.needs || "ID, housing, and employment"}. ` +
      `Motivated toward ${form.goals || "stable work and housing"}.`,
    immediate_needs: splitList(form.needs, ["ID", "Housing", "Employment"]),
    skills: splitList(form.skills, ["General labor"]),
    eligible_programs: [
      "Center for Employment Opportunities — transitional work",
      "The Fortune Society — transitional housing",
      "ACCESS HRA — SNAP & Medicaid",
    ],
    next_steps: [
      { order: 1, title: "Get NY State ID", rationale: "Gates banking, benefits, and most jobs." },
      { order: 2, title: "Open a bank account", rationale: "A place for pay and benefits to land." },
      { order: 3, title: "Apply for transitional housing", rationale: "Stable address supports everything else." },
      { order: 4, title: "Apply for SNAP & Medicaid", rationale: "Immediate basic-needs coverage." },
      { order: 5, title: "Start with an employment program", rationale: "Income and routine." },
    ],
    risk_factors: [
      `${first} has no phone yet — confirm a reliable contact method.`,
      "Long incarceration may mean low digital familiarity; offer in-person support.",
    ],
  };
}

function splitList(raw: string, fallback: string[]): string[] {
  const items = raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}
