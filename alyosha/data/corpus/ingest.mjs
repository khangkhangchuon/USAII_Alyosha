// Embed the corpus into Supabase `corpus_chunks` for RAG retrieval.
// Usage: npm run ingest
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + OPENAI_API_KEY.

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
if (!url || !key || !openaiKey) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY in .env.local.",
  );
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const openai = new OpenAI({ apiKey: openaiKey });
const EMBEDDING_MODEL = "text-embedding-3-small";

// Minimal YAML frontmatter parser (key: "value" pairs between --- fences).
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { meta, body: m[2] };
}

// Chunk on blank lines, packing paragraphs up to ~maxChars with a little overlap.
function chunk(text, maxChars = 2400, overlap = 200) {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = [];
  let buf = "";
  for (const p of paras) {
    if (buf && buf.length + p.length + 2 > maxChars) {
      chunks.push(buf);
      buf = buf.slice(Math.max(0, buf.length - overlap));
    }
    buf = buf ? `${buf}\n\n${p}` : p;
  }
  if (buf.trim()) chunks.push(buf);
  return chunks;
}

async function embed(text) {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

const files = readdirSync(here).filter(
  (f) => f.endsWith(".md") && f !== "MANIFEST.md",
);

let totalChunks = 0;
for (const file of files) {
  const raw = readFileSync(path.join(here, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);

  // TODO: re-enable verified-only gate before any public demo:
  //   if (meta.verified !== "true") { console.log(`skip (unverified): ${file}`); continue; }

  const sourceTitle = meta.source_title || file;
  const sourceUrl = meta.source_url || "";
  const sourceDate = meta.source_date || null;

  // Idempotent re-runs: clear this source's existing chunks first.
  await sb.from("corpus_chunks").delete().eq("source_url", sourceUrl);

  const parts = chunk(body);
  const rows = [];
  for (const part of parts) {
    const embedding = await embed(part);
    rows.push({
      id: randomUUID(),
      source_title: sourceTitle,
      source_url: sourceUrl,
      source_date: sourceDate,
      chunk_text: part,
      embedding,
    });
  }

  const { error } = await sb.from("corpus_chunks").insert(rows);
  if (error) {
    console.error(`Failed to ingest ${file}:`, error.message);
    process.exit(1);
  }
  totalChunks += rows.length;
  console.log(`✓ ${file} → ${rows.length} chunks`);
}

console.log(`Done. ${totalChunks} chunks across ${files.length} sources.`);
