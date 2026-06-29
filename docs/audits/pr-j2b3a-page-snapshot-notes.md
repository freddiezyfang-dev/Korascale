# PR-J2B3A Production Page Snapshot Notes

Representative pages sampled after 025B3A execution on Production (`www.korascale.com`).

## Files

- Pre-migration: `pr-j2b3a-pre-migration-page-snapshot.json`
- Post-migration: `pr-j2b3a-post-migration-page-snapshot.json`

## Sampled slugs

1. `badaling-great-wall-day-tour`
2. `beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour`
3. `grand-china-highlights-16-day-multi-city-journey`

## Verified unchanged (3/3)

| Field | Result |
|-------|--------|
| HTML `<title>` | unchanged |
| `<meta name="description">` | unchanged |
| `<h1>` | unchanged |
| `<link rel="canonical">` | unchanged |

## Hero image (`og:image`)

- **Post-migration:** `og:image` URLs match the B3A manifest `hero_image_url` for all three sampled pages.
- **Pre-migration:** the capture script recorded `/logo.png` for all three pages. This was a **selector limitation** (fallback asset), not evidence that the live page hero changed. Do **not** treat pre-migration `heroImageUrl` as a valid baseline.
- **Conclusion:** no visible hero regression observed; post-migration `og:image` aligns with manifest.

## Taxonomy (`journey_type_slug`)

- HTML/JSON-LD extraction did not reliably surface `journey_type_slug` in the snapshot script (`journeyTypeSlug` empty in both JSON files).
- Taxonomy acceptance relies on **database verification**: `journey_type_slug` 24/24 on active rows after B3A.
- Do not use the page snapshot JSON for taxonomy equivalence claims.

## What B3A did not change

- `price_from`, `currency`, `price_basis`, `price_on_request` — all remain unfilled on active rows
- `seo_complete` — remains `false` on all journeys
- `hero_image_alt` — already 24/24 before B3A; unchanged by migration
