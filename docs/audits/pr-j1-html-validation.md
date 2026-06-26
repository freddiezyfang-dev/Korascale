# PR-J1 HTML Validation (Final Merge Review)

Generated: 2026-06-26 — local production build + `npx tsx scripts/audit/pr-j1-html-validation.ts`

## Summary

| Check | Result |
|-------|--------|
| Active Journey detail pages | **24/24 pass** |
| Type pages | **4/4 pass** |
| Legacy type URL redirects | **4/4 pass** |

## Detail page checks (24 active)

Each page verified for:

- HTTP 200, canonical, exactly **1× H1**
- **1× Trip JSON-LD**, **1× BreadcrumbList JSON-LD**
- Breadcrumb `<nav aria-label="Breadcrumb">`
- No route-level skeleton-only `<main>`
- No duplicate primary blocks (multiple H1, legacy `journey-itinerary` id, duplicate itinerary section ids, duplicate day h3 titles)
- No sr-only / aria-hidden / display:none H1 cloaking
- Body text ≥ 1200 chars

## Type pages

| URL | Product links | Canonical | Robots |
|-----|---------------|-----------|--------|
| `/journeys/type/explore-together` | 8 | ✓ | index |
| `/journeys/type/deep-discovery` | 16 | ✓ | index |
| `/journeys/type/signature-journeys` | 0 | ✓ | **noindex, follow** |
| `/journeys/type/group-tours` | 0 (B2B landing) | ✓ | index |

## Legacy redirects (308)

All four legacy `/journeys/{type}` URLs → `/journeys/type/{type}` in one hop.

## Merge-review duplicate-content fix

- Removed visible server `<article>` duplicate (H1/excerpt/itinerary/CTA)
- Server shell now: JSON-LD + breadcrumb only
- Client renders primary content once (SSR via `initialJourney`)
- Removed redundant overview `shortDescription` paragraph in Deep Discovery layout

See `pr-j1-html-validation.json` for per-URL results.
