# Alyosha — Build Journal

Daily log of decisions, progress, and open questions. Newest entries on top.

---

## 2026-05-29 (Friday) — Day 1: Foundation + first corpus batch

**Where we started:** Empty `USAII/` folder with just the build plan
(`Alyosha_Build_Plan.md`), the older product doc (`alyosha-product-document.md`),
and a couple of reference images. No code. Vercel account ready; Supabase and
OpenAI not yet set up.

### Decisions made today

- **Build plan supersedes product doc.** The older product doc mentioned
  Pinecone + Ollama; the build plan says Supabase pgvector + OpenAI. Confirmed
  we're going with the build plan stack — single Supabase DB for app data and
  vectors, OpenAI for embeddings (`text-embedding-3-small`) and generation.
- **No hard deadline.** Optimizing for correctness and a polished demo over
  speed. Full BUILT scope (Smart Intake, the Map, resource search, RAG chat,
  progress sync, Caseload Intelligence, Gap Analysis) — no roadmap features.
- **Claude curates the corpus via WebFetch**, with verify-as-we-go discipline:
  per-source markdown + frontmatter (`source_title`, `source_url`,
  `source_date`, `verified`), `MANIFEST.md` index, leave-out-if-unverifiable
  rule. User spot-checks before any source is embedded.
- **App lives in `alyosha/` subfolder** because the working directory
  `USAII/` has capitals (npm naming rejects them). Build plan docs stay at
  the root alongside the app folder.
- **Persona "auth" is cookie-based.** No real auth for the demo — `/api/persona`
  sets a cookie identifying the active client or caseworker.

### What got built (Phase 1 — complete)

- Scaffolded **Next.js 16 + TypeScript + Tailwind v4 + App Router** via
  `create-next-app`. Build passes (`npx next build`), typecheck clean
  (`npx tsc --noEmit`).
- Installed runtime deps: `@supabase/supabase-js`, `openai`, `zod`,
  `server-only`.
- **Design system** in `app/globals.css` using Tailwind v4 `@theme`: deep navy
  primary palette (`--color-navy-50` through `--color-navy-900`), warm amber
  accent (`--color-accent-{400,500,600}`), system-font stack, visible
  focus-ring for keyboard users, `prefers-reduced-motion` respect.
- **Route groups:** `app/(client)` (large type, bottom nav, ≥44px tap targets)
  and `app/(org)` (top nav, dense). Each has its own layout reading the active
  persona via `getActivePersona()`.
- **Landing page** at `/` — persona chooser with two cards: "Enter as Marcus
  (client)" and "Enter as Diane (caseworker)". Footer disclaimer that all data
  is fictional.
- **Libs in place:**
  - `lib/persona/{types,server}.ts` — cookie-based persona switcher.
  - `lib/supabase/{client,server}.ts` — browser client (anon key) and server
    client (service role, `import "server-only"`).
  - `lib/openai/index.ts` — server-only OpenAI wrapper with `MODELS` constants
    for `reasoning`, `chat`, `embedding`. Throws clearly if `OPENAI_API_KEY`
    is missing.
- **Components:** `components/a11y/ReadAloud.tsx` — Web Speech API,
  play/stop toggle, ARIA pressed state, ≥44px tap target, gracefully hides
  if the browser doesn't support `speechSynthesis`.
- **Supabase schema** in `supabase/migrations/0001_init.sql`:
  - Tables for organizations, caseworkers, resources, clients, plan_steps,
    messages, corpus_chunks — exactly per build plan §4, with `jsonb` for
    flexible type-specific fields.
  - Enables `pgcrypto` and `vector` extensions.
  - HNSW index on `corpus_chunks.embedding` (vector_cosine_ops, 1536-dim).
  - SQL function `match_corpus_chunks(query_embedding, match_count)` for
    Phase 4 RAG retrieval.
- **Seed data** in `data/seed/`:
  - 1 partnered Brooklyn org + 9 real NYC orgs (Fortune Society, Osborne,
    CEO, Doe Fund, Legal Aid Reentry, Per Scholas, IDNYC, ACCESS HRA, DMV).
  - 10 resources spanning all categories (employment, housing, legal,
    education, id_benefits).
  - 1 caseworker (Diane R.).
  - 6 clients shaped for the demo: **Marcus Bell** (pinned tour, just released,
    needs ID+housing+job), Tanya (on track), Andre (nearly done), Keisha
    (gone quiet for 21 days — at-risk flag), Luis (brand new, no docs),
    Renée (childcare gap — unmet need for Gap Analysis).
  - Marcus's 5-step plan in dependency order (NY State ID → bank → Fortune
    housing → ACCESS HRA benefits → CEO employment), with `depends_on` wiring.
- **Seed script** `scripts/seed.mjs` — plain JS, no extra deps, uses
  `node --env-file=.env.local`. Run via `npm run seed`.
- **README** with setup walkthrough (Supabase project, OpenAI key, env vars,
  SQL migration, seed) and project structure.
- **`.env.local.example`** — `.env.local` already excluded by the default
  `.gitignore` (`.env*`).

### What got built (Phase 0 — first batch landed, none verified)

Four target sources collected into `alyosha/data/corpus/`:

| File | Source | How |
|------|--------|-----|
| `snap-access-hra.md` | access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/ | Clean WebFetch |
| `idnyc-how-to-apply.md` | access.nyc.gov/programs/idnyc/ | Clean WebFetch via mirror |
| `nys-non-driver-id.md` | dmv.ny.gov/non-driver-id/get-a-non-driver-id | Clean WebFetch |
| `nyc-fair-chance-act.md` | nyc.gov/site/cchr/law/fair-chance-act.page | **Reconstructed from search summaries** — original 403'd |

All four have `verified: false` in frontmatter. `MANIFEST.md` tracks status.

### What we learned today

- **The WebFetch risk I flagged in the plan was real.** Three of four
  first-attempt `nyc.gov` URLs hit anti-bot 403/404. The workaround was to
  use the `access.nyc.gov` subdomain (which serves the same programs) and
  fall back to authoritative search summaries for the Fair Chance Act page.
  Going forward, expect government `www.nyc.gov/site/*` URLs to fail and
  reach for access.nyc.gov or program org sites first.
- **Next.js 16 + Tailwind v4 differ from training data.** AGENTS.md in the
  scaffold warned to read `node_modules/next/dist/docs/` before writing code.
  Server/Client component patterns are the same as before; Tailwind v4 uses
  CSS `@theme` instead of `tailwind.config.ts` (no JS config file generated).
  `cookies()` from `next/headers` is async in 15+ — used `await cookies()` in
  the persona helpers.
- **Persona-aware layouts work cleanly with route groups.** Because the
  client and org surfaces live in `app/(client)/...` and `app/(org)/...`
  with separate root-like layouts, they can look and feel deliberately
  different without conditionals.

### Blocked / pending user input

1. **Supabase project + OpenAI key.** Needed before `npm run seed` or any
   live AI can run. Setup steps documented in `alyosha/README.md`.
2. **Corpus spot-check.** Four files in `data/corpus/` need the user to open
   each, click `source_url`, confirm content matches, and flip
   `verified: true`. Fair Chance Act especially — that one is reconstructed
   from search summaries, not a clean fetch.
3. **Direction on next corpus expansion** (Fortune Society, Osborne, CEO,
   Doe Fund, Legal Aid, Per Scholas, NYC DHS shelter intake): keep fetching
   in parallel, or wait for first-batch verification first.

### Open questions

- Will Vercel deploy of a Next.js 16 app surface any edge-runtime
  incompatibilities with `@supabase/supabase-js` or the OpenAI SDK? (To
  answer in Phase 4–5 when we deploy.)
- Should the OpenAI model `MODELS.reasoning` (currently `gpt-4o`) be bumped
  to a newer GPT-4 class model at Phase 4 time? Need to check OpenAI's
  current lineup when we get there.

### Task status

- ✅ Phase 1 — Foundation
- 🚧 Phase 0 — Corpus (4/many sources collected, 0/4 verified)
- ⬜ Phase 2 — Client surface (next up if user wants to proceed)
- ⬜ Phase 3 — Org surface
- ⬜ Phase 4 — Wire live AI
- ⬜ Phase 5 — Demo polish + Vercel deploy
- ⬜ Phase 6 — Landing / pitch page (later)
