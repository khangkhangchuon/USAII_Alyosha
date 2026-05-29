# Alyosha — Build Journal

Daily log of decisions, progress, and open questions. Newest entries on top.

---

## 2026-05-29 (Friday) — Phase 5: Demo polish (guided tour, cost guard) + deploy

**Goal:** Make the app demo-safe and publicly viewable. Scope (user's pick):
guided tour + pinned fixtures, rate limit + cost guard, Vercel deploy via GitHub.
(Accessibility pass and deeper loading/error UX deferred.)

### What got built (Phase 5)

- **Scripted spine** (`lib/fixtures/tour.ts`): pinned Marcus chat answers (ID,
  shelter, plea-deal handoff, jobs-with-a-record) with citations, matched by
  keyword via `matchPinnedChat`; a pinned intake profile keyed to the name
  "Marcus Bell". `/api/chat` simulates streaming the fixture on a match (instant,
  identical) and otherwise stays fully live; `/api/intake` returns the pinned
  profile for the Marcus sentinel. Off-script questions still hit live RAG.
- **GuidedTour** (`components/GuidedTour.tsx`): dismissible card on client Home and
  org Dashboard listing the scripted prompts so a presenter can walk the demo.
- **Rate limit + cost guard** (`lib/ratelimit.ts`): in-memory fixed-window limiter
  (~20 req/min/IP) + coarse global cap, applied to all five AI routes (chat,
  intake, intake/approve, caseload, gaps) → friendly 429 on exceed. Real ceiling
  is the OpenAI account usage limit (noted in code; in-memory resets on cold start).
- **Build hygiene:** pinned Turbopack/file-tracing root to `alyosha/` in
  `next.config.ts` — kills the stray-`~/pnpm-lock.yaml` workspace-root warning.

### Verification (local)

- `tsc` clean; `next build` passes with **no** workspace-root warning (22 routes).
- Pinned chat ("Should I take this plea deal?") and pinned intake ("Marcus Bell")
  return instant fixtures; rate limit returns 429 after ~20 rapid requests.

### Deploy (GitHub → Vercel)

- `gh` CLI not installed, but a GitHub remote already exists:
  `origin → github.com/khangkhangchuon/USAII_Alyosha`. `.env.local` confirmed
  gitignored (no secrets tracked). Pushed Phases 2–5.
- **Vercel (user, dashboard):** import the repo, set **Root Directory = `alyosha`**,
  add the 4 env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`).
- **Public URL:** _<to fill in after Vercel import>_.

### Security note

No auth (persona = cookie) + Supabase service-role key server-side means the public
site can write demo data and spend OpenAI credit. Rate limit + OpenAI usage cap
bound cost; DB writes only touch fictional, re-seedable data. Fine for a demo —
revisit before any real use.

### Task status

- ✅ Phases 1–4
- ✅ Phase 5 — Polish (guided tour, cost guard) + deploy prep (Vercel import pending)
- 🚧 Phase 0 — Corpus (4 ingested unverified; expand + verify before public demo)
- ⬜ Phase 6 — Landing / pitch page

## 2026-05-29 (Friday) — Phase 4: Live AI (RAG chat, Smart Intake, Caseload, Gaps)

**Goal:** Replace the four AI mocks with real OpenAI calls and verify end to end.

### Decisions made today

- **Ingest all 4 corpus files now, unverified.** Per user choice, `ingest.mjs`
  embeds every `data/corpus/*.md` regardless of the `verified:false` flag so RAG
  has content immediately. A `// TODO: re-enable verified-only gate before public
  demo` marks where the gate goes back. The Fair Chance Act file is still
  reconstructed-from-summaries — re-verify before any public demo.
- **All four features live this phase** (not just chat + intake): caseload and
  gaps also call OpenAI over seeded data.
- **Graceful fallback everywhere.** Every AI route wraps the OpenAI call in
  try/catch and returns the `lib/mock/` fixture (chat returns a safe handoff
  message) so the demo never hard-fails. UI shows a "sample / fallback" badge when
  `live:false`.
- **Models kept** at gpt-4o / gpt-4o-mini / text-embedding-3-small.
- **OpenAI billing is prepaid.** First ingest attempt hit `429 insufficient_quota`
  (valid key, no balance). After the user funded the account, ingest + all calls
  work. Lesson: a funded balance (min $5) is a hard prerequisite, separate from
  having a key.

### What got built (Phase 4)

- `lib/ai/schemas.ts` — zod contracts (citations, intake output, caseload digest,
  gap analysis); the `lib/mock/` fixtures conform to these shapes.
- `data/corpus/ingest.mjs` — frontmatter parse → paragraph chunk (~2.4k chars,
  200 overlap) → `text-embedding-3-small` → idempotent upsert into `corpus_chunks`.
- `lib/rag/retrieve.ts` — embed query → `match_corpus_chunks` RPC → `buildContext`
  + `citationsFrom` helpers.
- `app/api/chat/route.ts` — streamed RAG answer; citations passed via `X-Citations`
  header; guardrails (answer only from sources; route legal/parole/medical to a
  human). `app/(client)/chat/page.tsx` streams tokens + renders source chips.
- `app/api/intake/route.ts` (live profile, zod-validated, resource-grounded) +
  `app/api/intake/approve/route.ts` (writes a new client + dependency-ordered
  plan_steps, resolving `depends_on` by `order`). Intake page wired; Approve routes
  to the new client.
- `app/api/caseload/route.ts` + `app/api/gaps/route.ts` — LLM over seeded data;
  pages got "Generate" buttons (client components) defaulting to the fixture.

### Verification (all live, against funded OpenAI + seeded Supabase)

- `npm run ingest` → 4 chunks across 4 sources; `corpus_chunks` populated.
- Chat "How do I get my state ID?" → grounded DMV steps **with citations**.
- Chat "Should I take this plea deal?" → declines specifics, routes to a lawyer /
  legal aid (handoff guardrail holds).
- Smart Intake (James Carter) → live dependency-ordered plan; **Approve** created
  the client (appeared in `/clients`). Test client cleaned up afterward.
- Caseload (live) flagged Keisha (quiet ~21d); Gaps (live) surfaced childcare
  (Renée) + healthcare. `tsc` + `next build` clean (22 routes).
- Fallback path: verified by construction (try/catch → fixtures) and exercised
  indirectly by the earlier 429; not re-run destructively.

### Task status

- ✅ Phase 1 — Foundation
- ✅ Phase 2 — Client surface
- ✅ Phase 3 — Org surface
- ✅ Phase 4 — Live AI (RAG chat, Smart Intake, Caseload, Gaps)
- 🚧 Phase 0 — Corpus (4 ingested **unverified**; expand + verify before public demo)
- ⬜ Phase 5 — Demo polish: guided-tour fixtures, rate limit, a11y pass, Vercel deploy
- ⬜ Phase 6 — Landing / pitch page

### Open items / follow-ups

- Re-gate ingest to verified-only and verify the 4 corpus sources (esp. Fair
  Chance Act) before any public demo.
- Chat citations currently list all retrieved sources (k=6 returns all 4 chunks);
  consider trimming to sources actually used once the corpus grows.
- Expand the corpus (Fortune, Osborne, CEO, Doe Fund, Legal Aid, Per Scholas, DHS
  shelter) so retrieval is more discriminating.

## 2026-05-29 (Friday) — Phase 3: Org surface (caseworker dashboard)

**Goal:** Build Diane's side — Dashboard, Clients list/detail, Smart Intake,
Resource Management, Caseload, Gaps — closing the demo loop (a step Marcus checks
off appears as progress on Diane's dashboard).

### Decisions made today

- **AI features are mock-first (build-plan order).** Smart Intake, Caseload
  Intelligence, and Gap Analysis ship as full UIs backed by typed fixtures in
  `lib/mock/`, each marked "Demo preview — live AI in Phase 4." Lets us build the
  org surface without an API key or verified corpus.
- **Resource Management is fully live.** Per user choice, the org sees its own
  listings from Supabase and can add / pause / activate them — real writes via
  `POST /api/resources` and `PATCH /api/resources/[id]`.
- **Route-group collision fixed.** `(client)/resources` and `(org)/resources`
  both resolve to `/resources` (route groups don't add a path segment), which
  Next rejects. Moved the org resource-management route to **`/listings`** (nav
  label stays "Resources"). The client-facing `/resources` (Find Help search)
  keeps its path.
- **Server-only leak fixed.** The `ResourceManager` client component needed
  `RESOURCE_TYPES`/`ResourceInputSchema`, but importing them from the
  `"server-only"` `lib/data/resources.ts` dragged the Supabase client into the
  browser bundle. Split client-safe constants into `lib/data/resource-constants.ts`
  (no server-only); `resources.ts` re-exports them for back-compat.

### What got built (Phase 3)

- **`lib/data/` additions:** `caseworkers.ts` (`getCaseworker`),
  `listClientsForCaseworker`, `getStepCountsByClient` (one query, grouped in JS),
  `listResourcesByOrg`, and `resource-constants.ts` (`RESOURCE_TYPES`,
  `ResourceInputSchema`).
- **`lib/mock/`** fixtures: `intake.ts` (`generateMockProfile` from form input),
  `caseload.ts`, `gaps.ts` — shaped to the seed (Keisha at-risk, Renée childcare
  gap), typed to the §5 output contracts so Phase 4 swaps the source only.
- **Org pages** (`app/(org)/`): live-count Dashboard; Clients table (progress
  bars, quiet flag ≥14d) + client detail (profile, needs/skills, documents, plan
  steps w/ live status); mock Smart Intake (form → generated profile →
  Approve/Regenerate); `/listings` Resource Management (live CRUD); Caseload and
  Gaps fixture digests with demo banners.
- **API:** `POST /api/resources` (org-scoped insert) and `PATCH
  /api/resources/[id]` (edit / status toggle), zod-validated.

### Verification

- `npx tsc --noEmit` clean; `npx next build` passes (17 routes).
- Runtime demo path (Diane's dashboard counts, client detail showing Marcus's
  checked-off step, live resource add/pause) is **pending the user's Supabase
  setup** — same Day-1 blocker (credentials + migration + `npm run seed`).

### Task status

- ✅ Phase 1 — Foundation
- ✅ Phase 2 — Client surface
- ✅ Phase 3 — Org surface (pending live verification after Supabase setup)
- 🚧 Phase 0 — Corpus (4/many collected, 0/4 verified)
- ⬜ Phase 4 — Wire live AI (intake, chat RAG, caseload, gaps)
- ⬜ Phase 5 — Demo polish + Vercel deploy
- ⬜ Phase 6 — Landing / pitch page

## 2026-05-29 (Friday) — Phase 2: Client surface (wired to Supabase)

**Goal:** Build the client half of the demo spine — the Map, resource search,
progress, and chat UI — reading live from Supabase (user chose DB-first over a
temporary JSON layer).

### Decisions made today

- **Schema id type fixed: `uuid` → `text`.** The migration declared every PK/FK
  as `uuid default gen_random_uuid()`, but the seed JSON uses readable string ids
  (`client-marcus-bell`, `step-marcus-1`, `cw-diane-r`). `npm run seed` would have
  failed inserting text into uuid columns. Switched `organizations`, `caseworkers`,
  `resources`, `clients`, `plan_steps`, `messages` PKs/FKs to `text` (kept
  `corpus_chunks.id` as uuid — no inbound FKs; `messages.id` defaults to
  `gen_random_uuid()::text`). Keeps ids legible and stable for the demo.
- **Persona ids aligned to seed rows.** `DEFAULT_PERSONA` was `marcus-bell`;
  changed to `client-marcus-bell` so the Map can query by persona id directly.
- **Landing page was still the CRA default.** The Day-1 journal claimed a persona
  chooser existed, but `app/page.tsx` was the scaffold template. Built the real
  navy-themed chooser (Marcus → client, Diane → caseworker) hitting `/api/persona`.
- **Chat stays mocked in-component.** A canned reply marked as a Phase-4
  placeholder, rather than a throwaway `/api/chat` stub that Phase 4 would
  overwrite.

### What got built (Phase 2)

- **`lib/data/`** — typed server data layer over `supabaseServer()`:
  `types.ts`, `clients.ts` (`getClient`), `plan.ts` (`getPlanSteps` with derived
  `locked` flag), `resources.ts` (`listResources` w/ category + ilike search,
  org name join, `RESOURCE_TYPES`).
- **Client pages** (`app/(client)/`): `map` (ordered step cards, locked steps,
  per-step ReadAloud + check-off), `resources` (searchParams-driven search +
  category chips), `progress` (encouraging bar + milestone list), `chat` (mock
  shell with disclaimer, typing indicator).
- **`app/api/steps/[id]/route.ts`** — PATCH status with zod validation; the
  client→org sync write. Map's `StepCheck` client component calls it then
  `router.refresh()` so dependent steps unlock.
- Landing chooser rebuilt; Home links to Progress (bottom nav stays at 4 items).

### Verification

- `npx tsc --noEmit` clean; `npx next build` passes (11 routes).
- Runtime demo path (Map renders Marcus's steps, check-off unlocks, resource
  search, progress) is **pending the user's Supabase setup** — credentials +
  migration + `npm run seed`. Still the open blocker from Day 1.

### Task status

- ✅ Phase 1 — Foundation
- ✅ Phase 2 — Client surface (pending live verification after Supabase setup)
- 🚧 Phase 0 — Corpus (4/many collected, 0/4 verified)
- ⬜ Phase 3 — Org surface
- ⬜ Phase 4 — Wire live AI
- ⬜ Phase 5 — Demo polish + Vercel deploy
- ⬜ Phase 6 — Landing / pitch page

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
