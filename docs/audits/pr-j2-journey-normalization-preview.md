# PR-J2 Journey Normalization Preview

Generated: 2026-06-26T13:54:22.003Z

**Stage A only — no production UPDATE was executed.**

## Summary

| Metric | Count |
|--------|------:|
| Journey total | 83 |
| Active (compat query) | 24 |
| Status NULL | 0 |
| Status illegal/other | 0 |
| Slug anomalies (change or redirect) | 4 |
| Type MANUAL_REVIEW | 1 |
| Status MANUAL_REVIEW | 0 |
| SEO-complete active (quality marker) | 0 / 24 |
| Price-complete active | 0 / 24 |
| Manual review rows | 1 |

## Sitemap reconciliation

| Metric | Count |
|--------|------:|
| Active | 24 |
| Valid canonical slug | 24 |
| Sitemap Journey detail URLs | 24 |
| Missing | 0 |
| Redirect URLs in sitemap | 0 |
| Duplicate URLs | 0 |

## Schema map

| Logical field | Current DB column | JSONB path | Proposed source |
|---------------|-------------------|------------|-----------------|
| id | `id` | — | column |
| slug | `slug` | `data.slug` (legacy) | column (normalized) |
| status | `status` | — | column (`draft/active/archived`) |
| journey type | `journey_type` (label) | `data.journeyType` | column `journey_type_slug` + label compat |
| name / H1 | `title` | `data.name` | column `title` |
| page title | — | `data.pageTitle` | column `page_title` |
| meta description | `short_description` (fallback) | `data.metaDescription` | column `meta_description` |
| excerpt | `short_description` | `data.shortDescription` | column `short_description` |
| hero image | `image` | `data.heroImage` | column `hero_image_url` |
| hero alt | — | `data.heroAlt` / `heroImageAlt` | column `hero_image_alt` |
| price | `price` | `data.price` | column `price_from` + `price_on_request` |
| currency | — | `data.currency` | column `currency` (manual backfill) |
| price basis | — | `data.priceBasis` | column `price_basis` (manual backfill) |
| updated_at | `updated_at` | — | column (sitemap lastModified) |
| seo_complete | — | — | column `seo_complete` (admin quality marker, NOT indexability) |

## Trailing-hyphen active slug

| Current | Proposed | Redirect |
|---------|----------|----------|
| `beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-` | `beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour` | permanent via `next.config.ts` + DB slug update in migration 025 |

## Manual review required (1)

- `e468b842-7c59-4258-8d56-8b585566be82` — Missing journey_type in column and JSONB | Slug contains /journeys/ path prefix | manual_review: add currency and price_basis columns after confirmation

## Migration files

- `database/migrations/025_journey_data_normalization.sql`
- `database/migrations/025_journey_data_normalization.rollback.sql`

Run migration only after approving this preview.
