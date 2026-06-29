# PR-J2C0 — Public Journey Status Query Audit

Last updated: 2026-06-26 (PR-J2C0 preparation)

## Summary

Public Journey visibility is determined by **`status` column only**. `seo_complete` is **not** used for list inclusion, detail 200, sitemap, canonical, indexability, or status judgment (`src/app/**` has zero `seo_complete` references).

**J2C1 target:** all public SQL uses `status = 'active'` (strict). Admin paths retain full `draft` / `active` / `archived` via `includeAll=true`.

## Files still using `status IS NULL` (compat semantics)

| File | Usage | Action in J2C1 |
|------|-------|----------------|
| `src/lib/journeyNormalization/status.ts` | `JOURNEY_PUBLIC_STATUS_SQL_COMPAT`, `isPublicJourneyStatusCompat` | Retain for audit scripts; **not** default for public |
| `src/lib/journeyNormalization/statusBackfill.ts` | Historical B1 preview (`publicBefore`) | No change — migration audit only |
| `src/lib/journeyNormalization/slugBackfill.ts` | Historical B2 preview | No change |
| `scripts/migrations/pr-j2-generate-review-csvs.ts` | Explicit compat filter for review CSV | No change |
| `scripts/migrations/pr-j2-journey-normalization-dry-run.ts` | Explicit compat filter | No change |
| `database/migrations/pending/025c_journey_normalization_constraints.sql` | Legacy monolithic 025C preflight | Superseded by `025c1` / `025c2` |
| `database/migrations/pending/025b1_journey_status_backfill.sql` | Historical migration | No change |

**After J2C1:** public query call sites use `buildPublicStatusWhereClause()` which defaults to strict (`status = 'active'`).

## Public status query inventory

| Query | File | Purpose | Current condition | Proposed condition | Public/Admin | Required change |
|-------|------|---------|-------------------|-------------------|--------------|-----------------|
| Journey list (DB) | `src/lib/journeyListQuery.server.ts` → `queryJourneyRows` | Public list + API default | `buildPublicStatusWhereClause()` → **strict** (J2C1) | `status = 'active'` | Public | **Done (J2C1 candidate)** |
| Journey list page | `src/lib/journeyServer.ts` → `getActiveJourneysForList` | `/journeys` SSR | Via `queryJourneyRows({ includeAll: false })` | `status = 'active'` | Public | Inherited |
| Journey type page | `src/lib/journeyServer.ts` → `getActiveJourneysByType` | `/journeys/type/[type]` | Via `fetchActiveJourneysByTypeFromDb` | `status = 'active'` | Public | Inherited |
| Journey detail fetch | `src/lib/journeyDetailQuery.server.ts` → `fetchJourneyBySlugFromDb` | Detail 200/404 | `AND (status = 'active')` via `buildPublicStatusWhereClause()` | `status = 'active'` | Public | **Done (J2C1 candidate)** |
| generateStaticParams | `src/lib/journeyDetailQuery.server.ts` → `fetchActiveJourneySlugsForStaticParams` | Build-time slug list | `WHERE status = 'active'` | Same | Public | **Done (J2C1 candidate)** |
| Sitemap journey URLs | `src/lib/journeyDetailQuery.server.ts` → `fetchActiveJourneySitemapEntries` | `sitemap.ts` entries | `WHERE status = 'active'` | Same | Public | **Done (J2C1 candidate)** |
| Sitemap inclusion guard | `src/lib/journeyNormalization/sitemap.ts` → `shouldIncludeJourneyInSitemap` | Filter helper | `isPublicJourneyStatusStrict` | Same | Public | **Done (J2C1 candidate)** |
| Published check | `src/lib/journeyNormalization/published.ts` → `isJourneyPublished` | List/detail/sitemap guard | `isPublicJourneyStatusStrict` | Same | Public | **Done (J2C1 candidate)** |
| SEO content catalog | `src/lib/seo/exportCatalog.ts` → `fetchActiveJourneysForCatalog` | `seo:export-catalog` | `WHERE status = 'active'` | Same | Public (export) | **Done (J2C1 candidate)** |
| App sitemap route | `src/app/sitemap.ts` | Next.js sitemap | Via `fetchActiveJourneySitemapEntries` | `status = 'active'` | Public | Inherited |
| Journey detail page | `src/app/journeys/[...slug]/page.tsx` | Detail render | Via `getJourneyBySlugForPage` → detail query | `status = 'active'` | Public | Inherited |
| Journey list page | `src/app/journeys/page.tsx` | List render | Via `getActiveJourneysForList` | `status = 'active'` | Public | Inherited |
| Type page | `src/app/journeys/type/[type]/page.tsx` | Type listing | Via `getActiveJourneysByType` | `status = 'active'` | Public | Inherited |
| Public API GET | `src/app/api/journeys/route.ts` | Default listing | `queryJourneyRows({ includeAll: false })` | `status = 'active'` | Public API | **Done (J2C1 candidate)** |
| Admin API GET | `src/app/api/journeys/route.ts` | `?includeAll=true` | No status filter | Unchanged | Admin | **No** |
| Admin list UI | `src/context/JourneyManagementContext.tsx` | `loadJourneys(true)` | `includeAll=true` | Unchanged | Admin | **No** |
| Admin add | `src/app/admin/journeys/add/page.tsx` | Create form | N/A (write path) | Writers use canonical status | Admin | Writer only |
| Admin edit | `src/app/admin/journeys/edit/[id]/page.tsx` | Publish/archive toggle | N/A (write path) | `active` ↔ `archived` | Admin | Writer only |
| Safety gate test SQL | `src/lib/journeyNormalization/safetyGates.test.ts` | Regression | `buildPublicStatusWhereClause()` → strict | `status = 'active'` | Test | Auto-updated |
| B1 status backfill preview | `src/lib/journeyNormalization/statusBackfill.ts` | Migration audit | `isPublicJourneyStatusCompat` | Keep compat | Script | **No** |
| B2 slug backfill preview | `src/lib/journeyNormalization/slugBackfill.ts` | Migration audit | `isPublicJourneyStatusCompat` | Keep compat | Script | **No** |
| J2 review CSV generator | `scripts/migrations/pr-j2-generate-review-csvs.ts` | Historical review | `isPublicJourneyStatusCompat` | Keep compat | Script | **No** |
| J2 normalization dry-run | `scripts/migrations/pr-j2-journey-normalization-dry-run.ts` | Historical dry-run | `isPublicJourneyStatusCompat` | Keep compat | Script | **No** |
| J2C strict dry-run | `scripts/migrations/pr-j2c-strict-query-dry-run.ts` | J2C0 verification | Compares strict vs compat | N/A | Script | New |
| Import/export scripts | `scripts/seo/export-catalog.ts` | Catalog export | Via `exportCatalog.ts` | `status = 'active'` | Script | Inherited |

## seo_complete exclusion (verified)

| Surface | Uses seo_complete? |
|---------|-------------------|
| List inclusion | **No** |
| Detail 200 | **No** |
| Sitemap | **No** |
| Canonical | **No** |
| Indexability | **No** |
| Status judgment | **No** |

`seo_complete` is an admin quality marker set by 025B4 for 24 active rows only.

## Expected public counts (production, post-B4)

| Metric | Value |
|--------|-------|
| Public Journey (strict) | 24 |
| Explore Together | 8 |
| Deep Discovery | 16 |
| Sitemap journey detail URLs | 24 |
| NULL status rows | 0 |

With `NULL status = 0`, strict and compat produce identical public counts today. J2C1 removes latent NULL-as-active behavior for future safety.
