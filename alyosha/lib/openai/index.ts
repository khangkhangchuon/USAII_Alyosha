import "server-only";
import OpenAI from "openai";

let cached: OpenAI | undefined;

export function openai(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Set it in .env.local (server-side only).",
    );
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

/** Model names live here so they're easy to swap as OpenAI's lineup shifts. */
export const MODELS = {
  reasoning: "gpt-4o", // Smart Intake, gap analysis — confirm latest at build time
  chat: "gpt-4o-mini", // RAG chat — cheaper, fast
  embedding: "text-embedding-3-small",
} as const;
