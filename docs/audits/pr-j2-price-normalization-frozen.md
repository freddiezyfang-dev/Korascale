# PR-J2 Price Normalization — Frozen

**Status:** frozen pending business review  
**Date:** 2026-06-29

## Decision

Active Journey **price backfill is not approved** and must not be executed as part of PR-J2B3A closeout or 025B4.

025B4 is reserved for **`seo_complete` backfill** only.

## Production state (verified)

| Column | Active (24) state |
|--------|-------------------|
| `price_from` | **not backfilled** (0/24 filled) |
| `currency` | not backfilled |
| `price_basis` | not backfilled |
| `price_on_request` | not backfilled |

Legacy `price` column values remain the source of displayed pricing.

## Removed from repository

A draft active price backfill package was briefly merged via PR #18 and **removed** in the B3A closeout PR. It included:

- `activePriceBackfill.ts`, `prJ2b4ActiveManifest.ts`
- `025b4_active_journey_price_backfill.sql` (+ rollback)
- price preflight / generate scripts and preview CSV
- price backfill tests

These files must **not** be reintroduced without explicit business approval and a new migration ID.

## What remains frozen

- Automatic `price_from = COALESCE(price_from, NULLIF(price, 0))` for active journeys
- Any automatic fill of `currency`, `price_basis`, or `price_on_request`
- Manual review queue: `docs/audits/pr-j2-price-manual-review.csv`
