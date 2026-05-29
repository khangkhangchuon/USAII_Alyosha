import { z } from "zod";
import { openai, MODELS } from "@/lib/openai";
import { retrieve, buildContext, citationsFrom } from "@/lib/rag/retrieve";
import { matchPinnedChat } from "@/lib/fixtures/tour";
import { checkRateLimit, clientKey } from "@/lib/ratelimit";

const BodySchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .optional(),
});

const FALLBACK =
  "I can't reach my live answers right now. For anything urgent, call 311. " +
  "For legal, medical, or parole questions, please ask your caseworker to connect " +
  "you with the right organization.";

const SYSTEM = `You are Alyosha, an assistant for people reentering society after incarceration in New York City. Be warm, plain-spoken (8th-grade reading level), and dignified — never patronizing.

RULES:
- Answer ONLY using the SOURCES provided below. If the sources don't cover the question, say so plainly and offer to connect the person to a human.
- For legal, parole/probation, immigration, or medical questions, DO NOT give specific advice. Briefly explain you can't, and direct them to a relevant named organization or their caseworker.
- Do not invent organizations, addresses, phone numbers, or procedures.
- Refer to sources by name when you use them (e.g., "According to ACCESS HRA…").
- Keep answers short and concrete: what to do, where to go, what to bring.`;

function streamText(text: string, citations: unknown): Response {
  const encoder = new TextEncoder();
  // Chunk the fixture into word groups so it visibly "types out" like live output.
  const words = text.split(/(\s+)/);
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < words.length; i += 2) {
        controller.enqueue(encoder.encode(words[i] + (words[i + 1] ?? "")));
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Citations": encodeURIComponent(JSON.stringify(citations)),
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!checkRateLimit(clientKey(request))) {
    return new Response(
      "You're sending messages too quickly. Please wait a moment and try again.",
      { status: 429 },
    );
  }

  let body;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  // Scripted spine: pinned questions answer instantly and identically.
  const pinned = matchPinnedChat(body.message);
  if (pinned) {
    return streamText(pinned.answer, pinned.citations);
  }

  try {
    const chunks = await retrieve(body.message);
    const context = buildContext(chunks);
    const citations = citationsFrom(chunks);

    const completion = await openai().chat.completions.create({
      model: MODELS.chat,
      stream: true,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM },
        ...(body.history ?? []),
        {
          role: "user",
          content: `SOURCES:\n${context}\n\nQUESTION: ${body.message}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of completion) {
            const token = part.choices[0]?.delta?.content;
            if (token) controller.enqueue(encoder.encode(token));
          }
        } catch {
          controller.enqueue(encoder.encode("\n\n" + FALLBACK));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Citations": encodeURIComponent(JSON.stringify(citations)),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(FALLBACK, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Citations": encodeURIComponent("[]"),
      },
    });
  }
}
