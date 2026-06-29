# PR-J3A — Public Source of Truth Audit

Last updated: 2026-06-29 (preparation)

## Summary

Public runtime reads five SEO/taxonomy fields from **normalized columns only**. Admin runtime keeps **column-first compat** with legacy JSONB fallbacks. Public visibility remains **`status = 'active'` only** — not `seo_complete`.

## Resolver design

| Resolver | Module | Flag | JSONB fallback | Used by |
|----------|--------|------|----------------|---------|
| Public normalized | `publicNormalizedFields.ts` | No | No | Public list/detail/API, sitemap, SEO export |
| Admin compat | `adminCompatFields.ts` | Write gate only | Yes when column empty | Admin UI, Admin API `includeAll`, migration scripts |

## Public read path inventory

| File | Function | Runtime | Field | Current source | Proposed source | Public/Admin | Change |
|------|----------|---------|-------|----------------|-----------------|--------------|--------|
| `journeyListQuery.server.ts` | `fetchActiveJourneysForListFromDb` | Public list | All 5 + relational | JSONB/flag mix | Normalized columns | PUBLIC_STRICT | **Done** |
| `journeyListQuery.server.ts` | `fetchActiveJourneysByTypeFromDb` | Type pages | All 5 + relational | JSONB/flag mix | Normalized columns | PUBLIC_STRICT | **Done** |
| `journeyDetailQuery.server.ts` | `fetchJourneyBySlugFromDb` | Detail | All 5 + relational | JSONB/flag mix | Normalized columns | PUBLIC_STRICT | **Done** |
| `journeyServer.ts` | `getJourneyBySlugForPage` | Detail SSR | Via mapper | Inherited | PUBLIC_STRICT | Inherited |
| `journeys/[...slug]/page.tsx` | `generateMetadata` | Metadata | title/meta/og | Journey mapped fields | Normalized via mapper | PUBLIC_STRICT | **Done** |
| `journeySeo.server.ts` | `getJourneyDisplayTitle` / `getJourneyExcerpt` | SEO helpers | pageTitle/meta | Journey fields | Normalized via mapper | PUBLIC_STRICT | **Done** |
| `journeySeo.server.ts` | `buildJourneyTripJsonLd` | JSON-LD | name/description/image | Journey fields | Normalized via mapper | PUBLIC_STRICT | Inherited |
| `journeyDetailQuery.server.ts` | `fetchActiveJourneySlugsForStaticParams` | SSG params | slug/status | status only | Unchanged | PUBLIC_STRICT | No |
| `sitemap.ts` / `journeyDetailQuery.server.ts` | sitemap entries | Sitemap | slug/status | status only | Unchanged | PUBLIC_STRICT | No |
| `app/api/journeys/route.ts` | GET default | Public API | All 5 | JSONB/flag mix | Normalized columns | PUBLIC_STRICT | **Done** |
| `app/api/journeys/route.ts` | GET `includeAll` | Admin API | All 5 | Admin compat | Admin compat | ADMIN_COMPAT | No |
| `exportCatalog.ts` | `fetchActiveJourneysForCatalog` | SEO export | status | status only | Unchanged | PUBLIC_STRICT | No |
| `seo.ts` | `evaluateJourneySeoCompleteness` | Admin quality | All 5 | Admin compat | Admin compat | ADMIN_COMPAT | No |
| Admin journeys UI | create/edit | Admin | dual-write | Admin compat | ADMIN_COMPAT | No |
| Migration scripts | preflight/artifacts | Historical | varies | Unchanged | HISTORICAL_SCRIPT | No |

## JSONB content retained (not cut over in J3A)

- `itinerary` / days
- `highlights`, `inclusions`, `exclusions`, `gallery`
- `overview`, destination content, body modules
- `relatedTrips`, accommodations, experiences
- Price fields (frozen)

## Integrity policy

Active public Journey missing normalized column → `JourneyPublicNormalizedFieldIntegrityError` + server diagnostic log. No silent JSONB fallback.
