# PR-J4A Active Journey Content & SEO Audit Summary

- Generated: 2026-06-29T12:38:41.462Z
- Site: https://www.korascale.com
- Active Journeys audited: 24

## Score overview

- Average total score: 84.1/100
- The score is a composite of technical foundation, content proxy signals, and commercial-value proxy. It does not mean the content has reached mature SEO quality.
- FAQ coverage, structured highlights, contextual links, and content differentiation remain systemic gaps.
- Commercial value is a proxy only; revenue, traffic, ranking, CTR, and conversion data are unavailable.
- P0: 2 | P1: 19 | P2: 3 | P3: 0

## Technical / content signals

- Duplicate HTML titles (production): 0
- Duplicate meta descriptions (production): 7
- Duplicate meta rewrite groups: 2
- Product cannibalization / differentiation groups: 6
- Merge-review groups: 1
- Missing FAQ in DB: 24/24
- Weak contextual internal linking / missing related content: 14/24

## Execution order

1. Batch 0: 2 factual corrections requiring source-of-truth confirmation.
2. Batch 1: 6 template-style content restructures.
3. Batch 2: other retained active pages.
4. P3: differentiation / merge review.

## Batch 0 — FACT_CHECK_REQUIRED

1. `jiuzhaigou-cultural-adventure-4-day-tour` — title / slug / page_title / itinerary duration inconsistency; do not modify until true route duration is confirmed.
2. `xian-culture-mount-hua-in-depth-4-day-tour` — title / slug / page_title / itinerary duration inconsistency; do not modify until true route duration is confirmed.

Batch 0 must be resolved later using current itinerary days, original product design, backend history, and operator confirmation. This audit does not guess the correct duration.

## Batch 1 (6 recommended)

1. `grand-china-highlights-16-day-multi-city-journey` — FIRST_TIME_CHINA, score 84
2. `yunnan-kunming-dali-lijiang-shangri-la-9-day-tour` — REGIONAL_ROUTE, score 84
3. `xian-terracotta-warriors-tang-paradise-night-tour` — SPECIAL_INTEREST, score 69
4. `beijing-city-imperial-grandeur-urban-chic-1-day-tour` — DAY_TOUR, score 79
5. `xining-to-lhasa-mount-everest-tibet-grand-10-day-tour` — NATURE_ADVENTURE, score 89
6. `shanghai-suzhou-classic-dual-city-7-day-tour` — CITY_COMBINATION, score 84

## Batch 2 retained active pages (P2, score ≥ 58 — defer until Batch 1 templates exist)

- `chongqing-highlights-magic-cityscape-day-tour`
- `leshan-buddha-emei-mountain-2-day-tour`
- `siguniang-mountain-2-day-tour`

## FACT_CHECK_REQUIRED slugs

- `huangshan-to-huizhou-ancient-villages-6-day-tour`
- `jiuzhaigou-cultural-adventure-4-day-tour`
- `jiuzhaigou-huanglong-by-high-speed-rail-3-day-tour`
- `leshan-buddha-emei-mountain-2-day-tour`
- `lhasa-holy-lakes-classic-tibet-8-day-tour`
- `siguniang-mountain-2-day-tour`
- `xian-culture-mount-hua-in-depth-4-day-tour`
- `xining-to-lhasa-mount-everest-tibet-grand-10-day-tour`

## Duplicate meta vs merge review

- Duplicate meta descriptions default to REWRITE.
- MERGE_REVIEW is reserved for cases where primary search intent, destination/route, itinerary content, and product differentiation all substantially overlap.
- Repeated text such as "Beijing begins, Beijing ends" or "Chengdu begins, Chengdu ends" is not enough to recommend merging Journeys.

## Internal linking terminology

- All 24 active Journeys have public list, type-page, or sitemap entry points.
- This audit therefore uses weak contextual internal linking, missing related content, and insufficient destination/article connections rather than a blanket orphan label.
- Only a page with no internal site entry point should be marked orphan.

## Output artifacts

- `pr-j4a-active-journey-source-snapshot.json`
- `pr-j4a-active-journey-content-seo-matrix.csv`
- `pr-j4a-production-page-audit.csv`
- `pr-j4a-journey-cannibalization-groups.csv`
- `pr-j4a-batch1-recommendation.md`
- `pr-j4a-active-journey-audit-summary.md`

## Boundaries

- No Journey rows modified.
- No Revision submitted.
- No Production deploy.
- Search volume / CTR / ranking: unavailable (not in repo).
- Commercial scores are content/commercial proxies, not revenue, traffic, or conversion data.
