# Journey Normalization Migration Ledger

Production database: `neondb` (`ep-red-sunset-adgu8hlv-pooler`)

Last updated: 2026-06-29 (PR-J2B3A closeout)

## Status overview

| Migration | Phase | Status | Rollback |
|-----------|-------|--------|----------|
| 025A | Schema (expanded columns) | **executed** | available |
| 025B1 | Status backfill (59 inactive → archived) | **executed** | not executed |
| 025B2 | Slug normalization (4 trailing-hyphen) | **executed** | not executed |
| 025B3A | Active metadata & taxonomy (24 active) | **executed** | not executed |
| 025B4 | Active seo_complete (24 active) | **not prepared / not executed** | — |
| 025C | Constraints | **not executed** | — |

**Price normalization:** frozen pending business review — see `pr-j2-price-normalization-frozen.md`.

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

## 025B4 — not prepared / not executed

Reserved for **active seo_complete backfill** (24 active). Preparation tracked on branch `fix/pr-j2b4-active-seo-complete-backfill`.

Does **not** include price normalization.

## 025C — not executed

Frozen until 025B4 completes and is separately authorized.
