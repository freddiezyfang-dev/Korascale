# Journey Normalization Migration Ledger

Production database: `neondb` (`ep-red-sunset-adgu8hlv-pooler`)

Last updated: 2026-06-29 (PR-J2B3A preparation)

## Status overview

| Migration | Phase | Status | Rollback |
|-----------|-------|--------|----------|
| 025A | Schema (expanded columns) | **executed** | available |
| 025B1 | Status backfill (59 inactive → archived) | **executed** | not executed |
| 025B2 | Slug normalization (4 trailing-hyphen) | **executed** | not executed |
| 025B3A | Active metadata & taxonomy (24 active) | **prepared / not executed** | prepared |
| 025B4 | — | **not executed** | — |
| 025C | Constraints | **not executed** | — |

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
- **Production acceptance:**
  - sitemap Journey URLs = 24
  - `e468b842` archived (slug/type remain MANUAL_REVIEW, excluded from later backfills)

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
- **Production acceptance:**
  - active old slug → **308** (permanent redirect retained)
  - active canonical slug → **200**
  - sitemap contains canonical new slug only (24 URLs)
  - archived 3 rows: old/new URLs remain **404**, no public redirect added

## 025B3A — prepared / not executed

- **Files:**
  - `database/migrations/pending/025b3a_active_journey_metadata_backfill.sql`
  - `database/migrations/pending/025b3a_active_journey_metadata_backfill.rollback.sql`
- **Manifest:** 24 active IDs (`prJ2b3aActiveManifest.ts`)
- **Scope:** `page_title`, `meta_description`, `hero_image_url`, `journey_type_slug` only
- **Excludes:** archived 59, `hero_image_alt` (already 24/24), `seo_complete`, price fields, slug, status, JSONB
- **Preflight:** `scripts/migrations/pr-j2b3a-active-metadata-preflight.ts`
- **Audit artifacts:**
  - `docs/audits/pr-j2b3a-active-source-matrix.csv`
  - `docs/audits/pr-j2b3a-active-preview.csv`
  - `docs/audits/pr-j2b3a-rendered-value-snapshot.json`

## 025B4 / 025C — not executed

Frozen until B3A completes and is separately authorized.
