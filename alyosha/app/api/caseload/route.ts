import { NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { getActivePersona } from "@/lib/persona/server";
import { listClientsForCaseworker } from "@/lib/data/clients";
import { getStepCountsByClient } from "@/lib/data/plan";
import { CaseloadDigestSchema } from "@/lib/ai/schemas";
import { MOCK_CASELOAD } from "@/lib/mock/caseload";
import { checkRateLimit, clientKey } from "@/lib/ratelimit";

const SYSTEM = `You are a caseload analyst for a reentry case manager. Given the caseload JSON, produce a digest.

Return STRICT JSON:
{
  "generated_for": string (today's date, human readable),
  "at_risk": [{ "client_id": string, "name": string, "reason": string }],
  "patterns": string[],
  "positive_signals": string[]
}

Flag clients quiet >= 14 days or stalled on early steps as at_risk. Note aggregate patterns across needs and unmet needs. Call out genuine progress in positive_signals. Be specific and concise; use the client_id values exactly as given.`;

export async function POST(request: Request) {
  if (!checkRateLimit(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment." },
      { status: 429 },
    );
  }
  const persona = await getActivePersona();

  try {
    const clients = await listClientsForCaseworker(persona.id);
    const counts = await getStepCountsByClient(clients.map((c) => c.id));
    const payload = clients.map((c) => ({
      client_id: c.id,
      name: c.name,
      needs: c.needs,
      last_activity_at: c.last_activity_at,
      steps: counts[c.id] ?? { done: 0, total: 0 },
      summary: c.profile_summary,
    }));

    const completion = await openai().chat.completions.create({
      model: MODELS.reasoning,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Today is ${new Date().toISOString().slice(0, 10)}.\nCASELOAD:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const digest = CaseloadDigestSchema.parse(JSON.parse(raw));
    return NextResponse.json({ digest, live: true });
  } catch {
    return NextResponse.json({ digest: MOCK_CASELOAD, live: false });
  }
}
