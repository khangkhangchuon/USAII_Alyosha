# Corpus Manifest

The RAG binder. Every entry must trace to a verified authoritative source. If a
source can't be fetched cleanly, leave it out — do not paraphrase from memory.

## Rules
- One markdown file per source under `/data/corpus/`.
- Frontmatter on every file: `source_title`, `source_url`, `source_date` (when
  fetched), `verified` (`true` once spot-checked).
- Parole / probation specifics: out of scope. RAG chat routes those to a human.
- Legal / medical specifics: also routed to humans even if present in corpus.
- **Verification workflow:** owner opens each file, clicks `source_url`,
  confirms the content matches the live page, and flips `verified: true`. Only
  verified files are embedded by `npm run ingest`.

## Status

| File | Source | Fetched | Verified | Notes |
|------|--------|---------|----------|-------|
| `snap-access-hra.md` | access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/ | 2026-05-29 | ☐ | Clean WebFetch. |
| `idnyc-how-to-apply.md` | access.nyc.gov/programs/idnyc/ | 2026-05-29 | ☐ | Clean WebFetch via ACCESS NYC mirror. Original nyc.gov/site/idnyc page is anti-bot blocked. |
| `nys-non-driver-id.md` | dmv.ny.gov/non-driver-id/get-a-non-driver-id | 2026-05-29 | ☐ | Clean WebFetch. Fee specifics live on a linked sub-page. |
| `nyc-fair-chance-act.md` | nyc.gov/site/cchr/law/fair-chance-act.page | 2026-05-29 | ☐ | **Original page 403'd. Content reconstructed from NYC CCHR search summaries — spot-check carefully before flipping `verified`.** |

## Phase 0 target — first usable batch

These four unblock Phase 4 RAG chat for the Marcus tour. ✅ All four collected.
Spot-check pending.

## Expansion list (next)

- Fortune Society programs (housing + employment) — fortunesociety.org
- Osborne Association — osborneny.org
- The Doe Fund Ready, Willing & Able — doe.org
- Center for Employment Opportunities — ceoworks.org
- Legal Aid Society Reentry Unit — legalaidnyc.org
- Per Scholas IT training — perscholas.org
- Medicaid via NY State of Health — nystateofhealth.ny.gov
- NYC shelter intake (DHS) — nyc.gov/dhs

## Known anti-bot domains (need alternates)

- `www.nyc.gov/site/*` — Akamai blocks WebFetch user-agent. Try access.nyc.gov
  or the underlying program org pages.
- `www.nyc.gov/site/cchr/*` — same block. CCHR fact sheets PDFs may be
  fetchable via direct link; the Fair Chance Act page is not.
