# Journey Normalization Migration Ledger

Production database: `neondb` (`ep-red-sunset-adgu8hlv-pooler`)

Last updated: 2026-06-29 (026 Production executed)

## Journey status pipeline (closed)

| Layer | Rule |
|-------|------|
| Public queries | `status = 'active'` only |
| Writers | `draft` / `active` / `archived` only |
| Database | `status NOT NULL` + `journeys_status_check`; rejects NULL, `inactive`, and illegal values |

## Status overview

| Migration | Status |
|-----------|--------|
| 025A | **executed** |
| 025B1 | **executed** |
| 025B2 | **executed** |
| 025B3A | **executed** |
| 025B4 | **executed** |
| 025C1 | **executed** |
| 025C2 | **not prepared / not executed** |

**Price normalization:** frozen pending business review — see `pr-j2-price-normalization-frozen.md`.

**Audits:** `pr-j2c-public-status-query-audit.md`, `pr-j2c-writer-readiness.md`, `pr-j2c2-status-constraint-readiness.md`.

## 025A — executed

- **Files:** `database/migrations/025a_journey_normalization_columns.sql`
- **Result:** 13 nullable normalization columns added
- **Production flag:** `JOURNEY_NORMALIZATION_COLUMNS=1` enabled on `korascale`

## 025B1 — executed

- **Files:**
  - `database/migrations/pending/025b1_journey_status_backfill.sql`
  - `database/migrations/pending/025b1_journey_status_backfill.rollback.sql`
- **Manifest:** 59 IDs (`prJ2b1StatusManifest.ts`)
- **Expected / actual row counts:**
  - total: 83 / 83
  - active: 24 / 24
  - archived: 59 / 59 (was 0 before B1)
  - inactive: 0 / 0
- **Rollback:** not executed

## 025B2 — executed

- **Files:**
  - `database/migrations/pending/025b2_journey_slug_normalization.sql`
  - `database/migrations/pending/025b2_journey_slug_normalization.rollback.sql`
- **Manifest:** 4 IDs (1 active + 3 archived) (`prJ2b2SlugManifest.ts`)
- **Expected / actual row counts:**
  - total: 83 / 83
  - active: 24 / 24
  - archived: 59 / 59
  - updated rows: 4 / 4
- **Rollback:** not executed

## 025B3A — executed

- **Files:**
  - `database/migrations/pending/025b3a_active_journey_metadata_backfill.sql`
  - `database/migrations/pending/025b3a_active_journey_metadata_backfill.rollback.sql`
- **Manifest:** 24 active IDs (`prJ2b3aActiveManifest.ts`)
- **Scope:** `page_title`, `meta_description`, `hero_image_url`, `journey_type_slug` only
- **Expected / actual row counts:**
  - total: 83 / 83
  - active: 24 / 24
  - archived: 59 / 59
  - updated rows: 24 / 24
  - page_title / meta_description / hero_image_url / journey_type_slug: 24/24 each
  - hero_image_alt: 24/24 (unchanged)
- **Rollback:** not executed
- **Production acceptance:**
  - preflight `ready: true` before execution
  - migration executed successfully on Production (no re-run)
  - page snapshots: `pr-j2b3a-pre-migration-page-snapshot.json`, `pr-j2b3a-post-migration-page-snapshot.json`
  - snapshot notes: `pr-j2b3a-page-snapshot-notes.md`
- **Not modified:** `price_from`, `currency`, `price_basis`, `price_on_request`, `seo_complete`, status, slug, JSONB

## 025B4 — executed

- **Files:**
  - `database/migrations/pending/025b4_active_journey_seo_complete_backfill.sql`
  - `database/migrations/pending/025b4_active_journey_seo_complete_backfill.rollback.sql`
- **Manifest:** 24 active IDs (`prJ2b4ActiveSeoCompleteManifest.ts`)
- **Scope:** `seo_complete = true` for active manifest only (admin quality marker)
- **Expected / actual row counts:**
  - active: 24 / 24
  - active seo_complete: 24 / 24
  - archived seo_complete: 0 / 0
- **Rollback:** not executed (restores NULL per manifest)
- **Production acceptance:**
  - preflight `ready: true` before execution
  - `/journeys` 200, sitemap 24 journey URLs
  - taxonomy: explore-together 8 / deep-discovery 16
  - 3 representative detail pages: title / meta / H1 / canonical / og:image unchanged
  - `seo_complete` not used in public list/detail/sitemap queries
  - price columns unchanged (0/24 filled)

## 025C — reference only (superseded)

Monolithic file `025c_journey_normalization_constraints.sql` superseded by 025C1 / 025C2 split plan. Not executed.

## 025C1 — executed

- **Files:**
  - `database/migrations/pending/025c1_journey_status_constraints.sql`
  - `database/migrations/pending/025c1_journey_status_constraints.rollback.sql`
- **Scope:** `status NOT NULL` + `journeys_status_check` (`draft`, `active`, `archived`)
- **Executed:** Production 2026-06-29 (manual `run-migration.js`)
- **Pre-execution preflight:** `ready=true`, all baseline counts matched
- **Post-execution verification:**
  - `status.is_nullable = NO`, `column_default = 'draft'::character varying`
  - `journeys_status_check` present (draft / active / archived)
  - counts: active 24, archived 59, total 83, invalid 0
  - explore-together 8 / deep-discovery 16 (active)
  - `/journeys` 200, sitemap journey detail URLs 24
  - active detail 200 (`badaling-great-wall-day-tour`), archived detail 404
- **Rollback:** not executed
- **Does not include:** 025C2 optional field CHECKs

## 025C2 — not prepared / not executed

Optional field constraints (`journey_type_slug`, `currency`, `price_basis`) — frozen until separately authorized.

## 026 — Journey normalized slug unique index

- **Files:**
  - `database/migrations/pending/026_journey_slug_normalized_unique_index.sql`
  - `database/migrations/pending/026_journey_slug_normalized_unique_index.rollback.sql`
- **Scope:** unique expression index `journeys_slug_normalized_unique_idx` on `LOWER(BTRIM(slug))` where slug is non-null/non-empty; coexists with existing `journeys_slug_key`
- **Status:** **executed** on Production
- **Executed:** Production 2026-06-29 (authorized post PR #26 merge)
- **Main commit (app):** `be6e29f` (PR #26 — dual slug `23505` → 409 handling)
- **Production Vercel deploy:** `59703a0` on `Production – korascale` (includes `be6e29f`)
- **Execution report:** `docs/audits/pr-j3c-production-execution-report.md`
- **Pre-execution preflight:** `ready=true`, `normalizedDuplicateGroups=[]`, `targetIndexExists=false`
- **Post-execution verification:**
  - both slug unique objects present: `journeys_slug_key`, `journeys_slug_normalized_unique_idx`
  - row fingerprint unchanged (`7b324929b7a0d898a6a245b15b786bf3`)
  - counts: total 83, active 24, archived 59
  - public taxonomy: Explore Together 8 / Deep Discovery 16
  - J3A preflight `ready=true`; J2C strict delta 0
  - Production sitemap journey detail URLs: 24
  - **no Journey row UPDATE/DELETE** (index-only migration)
- **Rollback:** not executed
- **Does not include:** slug NOT NULL changes, canonical CHECK, DROP `journeys_slug_key`, slug data cleanup
