// Client-safe resource constants and validation. No "server-only" import here —
// both client components and server routes/queries import from this module.
import { z } from "zod";
import type { ResourceType } from "./types";

export const RESOURCE_TYPE_VALUES = [
  "employment",
  "housing",
  "legal",
  "financial",
  "education",
  "healthcare",
  "id_benefits",
] as const;

/** Validated input for creating/editing a resource. Shared with the API routes. */
export const ResourceInputSchema = z.object({
  type: z.enum(RESOURCE_TYPE_VALUES),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(300).optional(),
  eligibility: z.string().max(1000).optional(),
});

export type ResourceInput = z.infer<typeof ResourceInputSchema>;

export const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "employment", label: "Jobs" },
  { value: "housing", label: "Housing" },
  { value: "id_benefits", label: "ID & Benefits" },
  { value: "legal", label: "Legal" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Health" },
  { value: "financial", label: "Money" },
];
