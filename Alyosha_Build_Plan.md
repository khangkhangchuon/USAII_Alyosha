# Alyosha — Build Plan & Claude Code Instructions

*Two website surfaces, one codebase. NYC demo. Live AI at submission. Built for low digital literacy. Blue theme.*

---

## 0. What we are building (in one breath)

One Next.js codebase that presents **two surfaces**:

1. **Client surface** (`/client`) — the dead-simple guide a returning citizen uses.
2. **Org surface** (`/org`) — the caseworker's operations dashboard.

They share one Supabase database, so the two sides are genuinely connected: a caseworker runs intake and the client sees the resulting map; the client checks off a step and the caseworker's dashboard reflects it. A separate **landing/pitch page** comes in a later phase. The AI is **RAG** (the binder), not a fine-tuned model — an off-the-shelf model that answers only from a verified corpus of NYC documents.

---

## 1. The demo spine (the one story everything serves)

Build *this loop* first and well. Everything else is secondary.

1. **Org side — Smart Intake.** Caseworker Diane runs an intake on a new client, **Marcus**. The AI turns the messy conversation into a clean profile **and a dependency-ordered plan** (ID → bank account → housing application → benefits → job). Diane reviews, edits, approves.
2. **Client side — the Map.** Marcus logs in (persona switch, no real password) and sees *his* map: the ordered steps with plain instructions — what to do, where to go, what to bring. He searches the shared resource network (real NYC orgs), asks the AI companion a question, gets a grounded answer **with a citation** that **hands him to a human** for the legal part.
3. **Org side — the loop closes.** Marcus checks off "Got my ID." Diane's caseload view updates. Caseload Intelligence flags a *different* client who's gone quiet. Gap Analysis points out an unmet need and suggests a partner org.

This loop dramatizes the entire problem statement: the help was invisible, now it's a map, and the two sides are connected by it.

---

## 2. Scope — what is BUILT vs. ROADMAP

Discipline here is the difference between a great demo and a broken one. **The cut below is law.**

**BUILT (the five-feature spine):**
- Smart Intake (org) → generates profile + ordered plan
- The Map / step-by-step guidance (client)
- Shared resource network + search (both sides)
- AI chat companion with citations + human handoff (client)
- Progress tracking that syncs to the caseworker (both)
- Plus the two supporting AI panels on the org side: **Caseload Intelligence** and **Gap Analysis** (lower risk — they run on our own seeded data)

**ROADMAP (shown in the pitch, not built):**
- Educational deep-dive library, funder reporting, in-prison onboarding, multi-language, the full open/partnered tier automation, scraping pipeline for the open tier.

If a feature isn't in the BUILT list, it does not get code. It gets a sentence in the pitch.

---

## 3. Architecture

**Stack**
- **Next.js (App Router) + TypeScript** — one repo, route groups for the two surfaces.
- **Tailwind CSS** — design tokens for the blue theme.
- **Supabase (Postgres + pgvector)** — shared data *and* the vector store for RAG live in the same database. No extra service.
- **OpenAI API** — a current GPT-4-class model for the heavy reasoning (intake), a smaller/cheaper model for routine chat. Confirm exact model names at build time; they change. Embeddings: `text-embedding-3-small`.
- **Vercel** — hosting.
- **Read-aloud** — browser Web Speech API (`SpeechSynthesis`) first; upgrade to OpenAI TTS later if you want a warmer voice.

**Repo layout**
```
/app
  /(client)            client surface — simple layout
    /home  /map  /resources  /chat  /progress
  /(org)               caseworker surface — dashboard layout
    /dashboard  /intake  /clients/[id]  /resources  /caseload  /gaps
  /(marketing)         landing/pitch page — LATER PHASE
  /api
    /intake            Smart Intake (server-only, OpenAI)
    /chat              RAG chat (retrieve + OpenAI, streamed)
    /caseload          caseload digest (server)
    /gaps              gap analysis (server)
    /tts               optional TTS proxy
/lib
  /supabase            client + server helpers
  /openai              model calls, streaming
  /rag                 embedding + retrieval
  /persona             demo-mode persona switching
/data
  /corpus              verified NYC docs (markdown) + ingest script
  /seed                seed scripts: orgs, resources, clients, plans
/components
  /ui                  shared primitives
  /a11y                ReadAloud button, focus helpers
```

**Two non-negotiable rules**
- **The OpenAI key lives server-side only** — every AI call goes through an `/api` route. It is *never* in a client component or shipped to the browser.
- **Human-in-the-loop on anything that matters** — Smart Intake output is a *draft* the caseworker must approve before it becomes the client's plan. The AI drafts; the human commits.

---

## 4. Data model (Supabase)

Keep type-specific fields in `jsonb` so resource types stay flexible.

| Table | Key fields |
|---|---|
| `organizations` | id, name, type, location, `partnered` (bool), contact, services_summary |
| `resources` | id, org_id, type (`employment`/`housing`/`legal`/`financial`/`education`/`id_benefits`), title, description, location, eligibility, `details` jsonb (fair_chance, pay_range, capacity, application_process) |
| `caseworkers` | id, name, org_id, role |
| `clients` | id, name, released_on, incarceration_years, documents jsonb, skills jsonb, needs jsonb, goals, assigned_caseworker_id, profile_summary, last_activity_at |
| `plan_steps` | id, client_id, `order`, category, title, instructions, where_to_go, what_to_bring, status (`todo`/`in_progress`/`done`), depends_on (step id) |
| `messages` | id, client_id, org_id, sender (`client`/`org`), body, created_at |
| `corpus_chunks` | id, source_title, source_url, source_date, chunk_text, embedding `vector` |

Progress is just `plan_steps.status` — no separate table needed. Enable the `vector` extension for `corpus_chunks`.

---

## 5. The AI layer (RAG) — contracts and guardrails

Each AI feature is an `/api` route with a clear input/output contract. All outputs that drive UI should be **validated JSON** (use `zod`).

**5.1 Smart Intake** — `POST /api/intake`
- In: intake answers (or transcript).
- Out (streamed): `{ profile_summary, structured_profile, plan_steps[] }` where `plan_steps` are **ordered by dependency** (ID before bank before housing before job) and only include steps relevant to the profile.
- System prompt: reentry case-planning assistant; never invent procedures; order by dependency and urgency; flag any legal/parole item for human follow-up; output strict JSON.
- UI: caseworker sees the draft, edits inline, clicks **Approve** → writes `clients` + `plan_steps`.

**5.2 RAG chat** — `POST /api/chat`
- In: `{ client_id, message, history }`.
- Flow: embed the question → retrieve top-k `corpus_chunks` (filter to client's location where relevant) → build prompt with retrieved text → model answers **only from that text** → stream.
- Out: streamed answer + `citations[]` (source_title, source_url).
- Guardrails (hard rules in the system prompt):
  - Answer **only** from retrieved context. If it's not there, say so plainly and offer to connect a human.
  - **Always** route legal, parole, immigration, and medical questions to a named human/org — do not answer the specifics.
  - Always show the source.

**5.3 Caseload Intelligence** — `POST /api/caseload`
- In: `{ org_id }`. Runs on seeded clients.
- Flow: compare each client's `last_activity_at` + step completion against expectations → model writes a digest.
- Out: `{ at_risk[], overdue[], patterns[] }`. Lower risk because it only touches our data. On-demand button ("Generate today's digest") is fine for the demo — no real scheduler needed.

**5.4 Gap Analysis** — `POST /api/gaps`
- In: `{ org_id }`.
- Flow: compare clients' unmet needs against the resource network → model surfaces mismatches and recommends partner orgs.
- Out: `{ unmet_needs[], underserved_categories[], suggested_partners[] }`.

---

## 6. Scripted spine, live sandbox

So live AI never wobbles your headline story:

- **Guided Tour** = the pinned Marcus scenario. For the AI moments inside the tour, serve **cached fixtures** (pre-generated, verified responses stored in `/data/seed/fixtures`). Same UI, instant and identical every time. Implementation: the API routes check whether the input matches the pinned scenario id; if so, return the fixture; otherwise call live.
- **Free exploration** = anything a judge types themselves → fully live OpenAI + RAG.

Result: the demo always lands, and the AI is genuinely live.

---

## 7. Design system

**Theme:** blue. A calm, trustworthy palette — a deep navy as primary, a clear mid-blue for interactive elements, a single warm accent for primary actions, generous neutral space. High contrast throughout (WCAG AA minimum, aim AAA on the client side).

**Two deliberately different surfaces:**

*Client — radical simplicity (this is your accessibility answer):*
- Large type (≥18px body, large headings), one primary action per screen.
- Plain language — write for an 8th-grade reading level or lower; no jargon, no acronyms without expansion.
- Big tap targets (≥44px), lots of spacing, simple bottom nav (max 4 items, icon + label).
- **Read-aloud** button on every screen (Web Speech API).
- Progress shown as encouraging forward momentum, never as a deficit.
- Tone: dignified. Simple is not the same as childish — *"more than the worst thing we've ever done."*

*Org — efficient dashboard:*
- Denser, professional. Tables, filters, the AI panels in cards. Multi-column. Built for speed, not hand-holding.

**Accessibility baseline (both):** semantic HTML, keyboard navigation, visible focus states, alt text, color contrast checks. Have Claude Code read its `frontend-design` guidance before writing UI and follow Next.js + Tailwind conventions.

---

## 8. Personas & seed data (NYC)

**Pinned client (tour):** *Marcus Bell* — released recently, ~6 years incarcerated, has a birth certificate but no state ID, no phone, skills in warehouse work and basic cooking, needs ID/housing/job, goal of steady work and his own place, Brooklyn.

**Other seeded clients (so caseload + gap analysis have something to chew on):** 5–6 clients at varying stages — one fully on track, one nearly done, one gone quiet for ~2 weeks (the at-risk flag), one brand-new, one with an unmet need no listed resource covers (the gap).

**Caseworker:** *Diane R.*, Reentry Coordinator.

**Partnered org:** one fictional but realistic Brooklyn reentry org (full tooling).

**Open-tier orgs + resources:** model ~20–40 resources on real NYC organizations (Fortune Society, Osborne Association, and others) across employment (with fair-chance flags), housing, legal aid, ID/benefits help, and training. These power resource search and gap analysis.

> Mark all demo data as fictional in the UI footer. Never store real PII.

---

## 9. The corpus (PARALLEL TRACK — start day one)

This is your critical path and your biggest risk. Live AI is only as good as the binder. **Begin collecting while the website is being built**, not after.

**What goes in (verify each from an authoritative, dated source):**
- ID: IDNYC, DMV non-driver state ID — how to get/replace, what documents are accepted.
- Benefits: SNAP, Medicaid, cash assistance via ACCESS HRA — eligibility and how to apply.
- Housing: shelter intake, transitional/supportive housing pathways.
- Employment: NYC Fair Chance Act basics, fair-chance employers, Work Opportunity Tax Credit (employer-facing).
- Reentry orgs directory: Fortune Society, Osborne Association, etc. — what they offer, where, how to contact.
- General reentry sequencing guidance.

**Process:** collect → clean into markdown with `source_title` + `source_url` + `source_date` → chunk (~500–800 tokens, slight overlap) → embed (`text-embedding-3-small`) → upsert into `corpus_chunks`. One script: `npm run ingest`.

**Rule:** anything you can't verify from an authoritative source, leave out. For parole/probation specifics, the AI must route to a human — don't try to encode those.

---

## 10. Phased build plan

| Phase | What | Depends on |
|---|---|---|
| **0 (parallel)** | Corpus curation track — runs alongside everything from day 1 | — |
| **1** | Foundation: repo, Next.js + TS + Tailwind, Supabase project, schema + `vector` extension, seed scripts, persona switcher, design tokens, shared layout + `ReadAloud` component | — |
| **2** | Client surface: home, **the Map**, resource search, progress, chat UI (wired to a mock first) | 1 |
| **3** | Org surface: dashboard, client list/detail, **intake UI**, resource management, caseload + gap panels (mock first) | 1 |
| **4** | AI live (RAG): run `ingest`, build `/lib/rag` retrieval, wire `/api/chat`, `/api/intake`, `/api/caseload`, `/api/gaps` to real OpenAI; streaming; guardrails; replace all mocks | 0 (first corpus batch), 2, 3 |
| **5** | Demo polish: guided tour + pinned fixtures, fallbacks, spend cap + rate limit, loading/streaming UX, full accessibility pass, deploy to Vercel | 4 |
| **6 (later)** | Landing/pitch page (problem → solution), final pitch polish | 5 |

Phase 4 can *start* as soon as the corpus has a usable first batch — overlap it with 2/3 rather than waiting.

---

## 11. Driving Claude Code

**Setup (do once):**
- `npx create-next-app@latest` (TypeScript, App Router, Tailwind).
- Create a Supabase project; enable the `vector` extension.
- `.env.local` with `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. **Add `.env.local` to `.gitignore` — never commit keys.**

**How to work with Claude Code:**
- Feed it **one phase, then one task at a time** — not the whole plan at once. Paste the relevant section, then the specific task.
- Have it **commit after each working task** and test the demo path before moving on.
- Tell it to read its `frontend-design` skill before building any UI.
- Enforce: OpenAI calls only in `/api` routes (never client-side); validate AI JSON with `zod`; wrap every OpenAI call in try/catch with a graceful fallback.

**Example first prompts to give Claude Code:**
- *Phase 1:* "Set up the Supabase schema from section 4 of the plan as a migration, enable the vector extension, and write seed scripts for the personas and resources in section 8. Then build the persona switcher in `/lib/persona` and a shared `ReadAloud` component."
- *Phase 2:* "Build the client `/map` page reading `plan_steps` for the active persona, ordered by `order`, showing status, instructions, where-to-go, what-to-bring, with a read-aloud button. Steps with unmet `depends_on` are visually locked."
- *Phase 4:* "Implement `/api/chat` per section 5.2: embed the message, retrieve top-k from `corpus_chunks`, build the grounded prompt with the guardrails, stream the answer, and return citations. Stub nothing — wire the real OpenAI call, key server-side only."

---

## 12. Risks & mitigations

- **Corpus thin or wrong** (biggest) → start the parallel track now; verify every source; leave out anything unverifiable; route parole/legal/medical to humans.
- **Live AI fails mid-judging** → scripted spine with cached fixtures for the tour; graceful fallback message on API error.
- **Latency** → stream all responses; show "reviewing Marcus's situation…" states.
- **Cost** → hard spend cap on the OpenAI account; light rate limiting on the API routes.
- **Two-sided sync doesn't work** → build and test the shared-DB round trip (client checks step → org sees it) early, in Phase 1/2, not at the end.
- **Scope creep** → the section 2 cut is law.

---

*Each of us is more than the worst thing we've ever done.*
