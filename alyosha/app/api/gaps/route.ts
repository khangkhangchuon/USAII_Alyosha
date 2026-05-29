import { NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { getActivePersona } from "@/lib/persona/server";
import { listClientsForCaseworker } from "@/lib/data/clients";
import { listResources } from "@/lib/data/resources";
import { GapAnalysisSchema } from "@/lib/ai/schemas";
import { MOCK_GAPS } from "@/lib/mock/gaps";
import { checkRateLimit, clientKey } from "@/lib/ratelimit";

const SYSTEM = `You analyze gaps between client needs and the available resource network for a reentry org.

Return STRICT JSON:
{
  "unmet_needs": [{ "need": string, "clients": string[], "note": string }],
  "underserved_categories": [{ "category": string, "note": string }],
  "suggested_partners": [{ "name": string, "why": string }]
}

A need is unmet when clients list it but no resource category covers it. Suggest realistic NYC partner organizations to fill gaps. Do not invent client data; use names as given.`;

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
    const resources = await listResources();
    const clientNeeds = clients.map((c) => ({ name: c.name, needs: c.needs }));
    const resourceTypes = resources.map((r) => ({
      title: r.title,
      type: r.type,
    }));

    const completion = await openai().chat.completions.create({
      model: MODELS.reasoning,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
            `CLIENT NEEDS:\n${JSON.stringify(clientNeeds, null, 2)}\n\n` +
            `RESOURCES IN NETWORK:\n${JSON.stringify(resourceTypes, null, 2)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const analysis = GapAnalysisSchema.parse(JSON.parse(raw));
    return NextResponse.json({ analysis, live: true });
  } catch {
    return NextResponse.json({ analysis: MOCK_GAPS, live: false });
  }
}
