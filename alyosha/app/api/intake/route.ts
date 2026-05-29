import { NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { listResources } from "@/lib/data/resources";
import { IntakeOutputSchema, type IntakeOutput } from "@/lib/ai/schemas";
import { generateMockProfile, type IntakeForm } from "@/lib/mock/intake";
import { PINNED_INTAKE, TOUR_INTAKE_NAME } from "@/lib/fixtures/tour";
import { checkRateLimit, clientKey } from "@/lib/ratelimit";

const SYSTEM = `You are an intake assistant for reentry case managers in New York City.
Given intake notes about a newly released client, produce a structured plan.

Return STRICT JSON matching this shape:
{
  "profile_summary": string (2-3 sentences),
  "structured_profile": {
    "immediate_needs": string[],
    "skills": string[],
    "eligible_programs": string[],   // name real programs from the RESOURCES list only
    "risk_factors": string[]
  },
  "plan_steps": [
    {
      "order": number (1-based),
      "category": one of "id"|"benefits"|"housing"|"employment"|"education"|"legal"|"healthcare"|"financial"|"other",
      "title": string,
      "instructions": string,
      "where_to_go": string,
      "what_to_bring": string,
      "depends_on": number|null   // the "order" of the prerequisite step, or null
    }
  ]
}

Rules: order plan_steps by dependency and urgency (ID before banking before housing/benefits/jobs). Only include steps relevant to this client. Name real programs from RESOURCES; never invent organizations or procedures. Flag any legal/parole item as a risk_factor for human follow-up rather than giving advice. Use plain, compassionate language.`;

function toFallback(form: IntakeForm): IntakeOutput {
  const m = generateMockProfile(form);
  return {
    profile_summary: m.profile_summary,
    structured_profile: {
      immediate_needs: m.immediate_needs,
      skills: m.skills,
      eligible_programs: m.eligible_programs,
      risk_factors: m.risk_factors,
    },
    plan_steps: m.next_steps.map((s) => ({
      order: s.order,
      category: "other" as const,
      title: s.title,
      instructions: s.rationale,
      where_to_go: "",
      what_to_bring: "",
      depends_on: s.order > 1 ? s.order - 1 : null,
    })),
  };
}

export async function POST(request: Request) {
  if (!checkRateLimit(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment." },
      { status: 429 },
    );
  }

  const form = (await request.json()) as IntakeForm;

  // Scripted spine: the pinned Marcus intake returns an identical profile instantly.
  if ((form.name ?? "").trim().toLowerCase() === TOUR_INTAKE_NAME) {
    return NextResponse.json({ profile: PINNED_INTAKE, live: true });
  }

  try {
    const resources = await listResources();
    const resourceList = resources
      .map((r) => `- ${r.title} (${r.type}) — ${r.location ?? ""}`)
      .join("\n");

    const completion = await openai().chat.completions.create({
      model: MODELS.reasoning,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
            `RESOURCES:\n${resourceList}\n\nINTAKE NOTES:\n` +
            JSON.stringify(form, null, 2),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = IntakeOutputSchema.parse(JSON.parse(raw));
    return NextResponse.json({ profile: parsed, live: true });
  } catch {
    return NextResponse.json({ profile: toFallback(form), live: false });
  }
}
