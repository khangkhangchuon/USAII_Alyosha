// Row types mirroring the Supabase schema (build plan §4). Kept deliberately
// loose where columns are jsonb so callers can narrow as needed.

export type StepStatus = "todo" | "in_progress" | "done";

export type ResourceType =
  | "employment"
  | "housing"
  | "legal"
  | "financial"
  | "education"
  | "healthcare"
  | "id_benefits";

export type Client = {
  id: string;
  name: string;
  released_on: string | null;
  incarceration_years: number | null;
  documents: Record<string, boolean>;
  skills: string[];
  needs: string[];
  goals: string | null;
  assigned_caseworker_id: string | null;
  profile_summary: string | null;
  last_activity_at: string;
};

export type PlanStep = {
  id: string;
  client_id: string;
  order: number;
  category: string;
  title: string;
  instructions: string | null;
  where_to_go: string | null;
  what_to_bring: string | null;
  status: StepStatus;
  depends_on: string | null;
  updated_at: string;
};

// PlanStep with a derived `locked` flag (its prerequisite isn't done yet).
export type PlanStepView = PlanStep & { locked: boolean };

export type Resource = {
  id: string;
  org_id: string | null;
  type: ResourceType;
  title: string;
  description: string | null;
  location: string | null;
  eligibility: string | null;
  details: Record<string, unknown>;
  date_listed: string;
  status: string;
  // Joined from organizations.
  org_name?: string | null;
};
