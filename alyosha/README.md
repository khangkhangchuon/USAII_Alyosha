# Alyosha

Two-sided NYC reentry demo: a client guide (`/home`, `/map`, `/resources`,
`/chat`, `/progress`) and a caseworker dashboard (`/dashboard`, `/intake`,
`/clients`, `/resources`, `/caseload`, `/gaps`). One Next.js codebase, one
Supabase database. Live RAG chat grounded in a verified NYC corpus.

Spec: `../Alyosha_Build_Plan.md` (authoritative). The product doc next to it is
older context — the build plan supersedes it.

## Setup

1. **Supabase project.** Create one at https://supabase.com/dashboard. Note your
   project URL, anon key, and service role key (Settings → API).
2. **OpenAI key.** Create one at https://platform.openai.com/api-keys and **set
   a hard spend cap** on the account.
3. **Env vars.**
   ```bash
   cp .env.local.example .env.local
   # fill in the values
   ```
4. **Apply the schema.** Open the Supabase SQL Editor, paste the contents of
   `supabase/migrations/0001_init.sql`, run it. This also enables the `vector`
   extension.
5. **Seed.**
   ```bash
   npm run seed
   ```
6. **Run.**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 and pick a persona.

## Project structure

```
app/
  (client)/      # Returning-citizen surface — large type, ReadAloud, simple
  (org)/         # Caseworker dashboard — dense, professional
  api/           # Server-only routes (OpenAI key never leaves here)
  page.tsx       # Persona-chooser landing
components/a11y/ # ReadAloud + focus helpers
lib/
  supabase/      # client + server clients
  openai/        # server-only OpenAI wrapper
  persona/       # demo-mode persona switcher (cookie-based)
  rag/           # (Phase 4) embed + retrieve + grounded prompt
data/
  seed/          # JSON canonical source for seeding
  corpus/        # RAG source markdown + MANIFEST + ingest script
supabase/migrations/  # SQL — paste into Supabase SQL Editor
scripts/seed.mjs      # `npm run seed`
```

## Non-negotiable rules

- **OpenAI key is server-side only.** Every model call goes through
  `app/api/*`. Never import `lib/openai` into a client component.
- **Human-in-the-loop on anything that matters.** Smart Intake is a draft the
  caseworker must approve before it writes to `clients` / `plan_steps`.
- **RAG chat answers ONLY from retrieved corpus.** Routes legal, parole,
  immigration, and medical questions to a named human.
- **All AI JSON validated with `zod`** before it drives UI or DB writes.

## Phase status

- ✅ Phase 1 — Foundation (scaffold, schema, libs, design tokens, seed)
- 🚧 Phase 0 — Corpus curation (running in parallel)
- ⬜ Phase 2 — Client surface
- ⬜ Phase 3 — Org surface
- ⬜ Phase 4 — Wire live AI (RAG + intake + caseload + gaps)
- ⬜ Phase 5 — Demo polish + Vercel deploy

All clients, caseworkers, and resources in the demo are fictional. No real
personal information is stored.
