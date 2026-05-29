import "server-only";
import { openai, MODELS } from "@/lib/openai";
import { supabaseServer } from "@/lib/supabase/server";

export type RetrievedChunk = {
  id: string;
  source_title: string;
  source_url: string;
  source_date: string | null;
  chunk_text: string;
  similarity: number;
};

/**
 * Embed the query and pull the top-k most similar corpus chunks via the
 * `match_corpus_chunks` SQL function (cosine similarity over pgvector).
 */
export async function retrieve(
  query: string,
  k = 6,
): Promise<RetrievedChunk[]> {
  const embedRes = await openai().embeddings.create({
    model: MODELS.embedding,
    input: query,
  });
  const queryEmbedding = embedRes.data[0].embedding;

  const { data, error } = await supabaseServer().rpc("match_corpus_chunks", {
    query_embedding: queryEmbedding,
    match_count: k,
  });
  if (error) throw new Error(`retrieve: ${error.message}`);
  return (data ?? []) as RetrievedChunk[];
}

/** Format retrieved chunks into a numbered context block for the prompt. */
export function buildContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "(no relevant sources found)";
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] ${c.source_title} (${c.source_url})\n${c.chunk_text}`,
    )
    .join("\n\n---\n\n");
}

/** Distinct sources from a set of chunks, for citation chips. */
export function citationsFrom(
  chunks: RetrievedChunk[],
): { source_title: string; source_url: string }[] {
  const seen = new Set<string>();
  const out: { source_title: string; source_url: string }[] = [];
  for (const c of chunks) {
    if (seen.has(c.source_url)) continue;
    seen.add(c.source_url);
    out.push({ source_title: c.source_title, source_url: c.source_url });
  }
  return out;
}
