// Seed the Supabase database from /data/seed/*.json.
// Usage: npm run seed
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(here, "..", "data", "seed");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Did you create .env.local?",
  );
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function readJson(name) {
  return JSON.parse(readFileSync(path.join(seedDir, name), "utf8"));
}

async function upsert(table, rows) {
  const { error } = await sb.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(`Failed to seed ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`✓ Seeded ${rows.length} rows into ${table}`);
}

await upsert("organizations", readJson("organizations.json"));
await upsert("caseworkers", readJson("caseworkers.json"));
await upsert("resources", readJson("resources.json"));
await upsert("clients", readJson("clients.json"));
await upsert("plan_steps", readJson("plan_steps.json"));

console.log("Done.");
