import { z } from "zod";

// Shared output contracts for the live AI routes (build-plan §5). Routes validate
// model output against these; the lib/mock fixtures conform to the same shapes so
// they can serve as graceful fallbacks.

// --- Chat citations ---
export const CitationSchema = z.object({
  source_title: z.string(),
  source_url: z.string(),
});
export type Citation = z.infer<typeof CitationSchema>;

// --- Smart Intake (§5.1) ---
export const PLAN_CATEGORIES = [
  "id",
  "benefits",
  "housing",
  "employment",
  "education",
  "legal",
  "healthcare",
  "financial",
  "other",
] as const;

export const IntakePlanStepSchema = z.object({
  order: z.number().int().positive(),
  category: z.enum(PLAN_CATEGORIES),
  title: z.string().min(1),
  instructions: z.string(),
  where_to_go: z.string(),
  what_to_bring: z.string(),
  // Index (1-based `order`) of the step this one depends on, or null.
  depends_on: z.number().int().positive().nullable(),
});

export const IntakeOutputSchema = z.object({
  profile_summary: z.string().min(1),
  structured_profile: z.object({
    immediate_needs: z.array(z.string()),
    skills: z.array(z.string()),
    eligible_programs: z.array(z.string()),
    risk_factors: z.array(z.string()),
  }),
  plan_steps: z.array(IntakePlanStepSchema).min(1),
});
export type IntakeOutput = z.infer<typeof IntakeOutputSchema>;

// --- Caseload Intelligence (§5.3) ---
export const CaseloadDigestSchema = z.object({
  generated_for: z.string(),
  at_risk: z.array(
    z.object({
      client_id: z.string(),
      name: z.string(),
      reason: z.string(),
    }),
  ),
  patterns: z.array(z.string()),
  positive_signals: z.array(z.string()),
});
export type CaseloadDigest = z.infer<typeof CaseloadDigestSchema>;

// --- Gap Analysis (§5.4) ---
export const GapAnalysisSchema = z.object({
  unmet_needs: z.array(
    z.object({
      need: z.string(),
      clients: z.array(z.string()),
      note: z.string(),
    }),
  ),
  underserved_categories: z.array(
    z.object({ category: z.string(), note: z.string() }),
  ),
  suggested_partners: z.array(
    z.object({ name: z.string(), why: z.string() }),
  ),
});
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;
