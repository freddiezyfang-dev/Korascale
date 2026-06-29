# PR-J3C — Slug Writer Readiness Audit

Last updated: 2026-06-29 (preparation)

## Summary

Runtime Admin Journey writers must pre-check slug uniqueness across **all statuses** using `normalizeJourneySlugForComparison()` and map database race conflicts on **`journeys_slug_key` or `journeys_slug_normalized_unique_idx`** to HTTP **409**.

## Writer inventory

| Writer | Auth | Can write slug | Pre-check all statuses | Excludes current ID | Handles 23505 | Atomic write | Ready |
|--------|------|----------------|------------------------|---------------------|---------------|--------------|-------|
| `POST /api/journeys` | `enforceAdminWrite` | Yes | Yes (non-active pre-check; active via J3B gate) | N/A on create | Yes | Single INSERT | **Yes** |
| `PUT /api/journeys/[id]` | `enforceAdminWrite` | Yes | Yes | Yes | Yes | Single UPDATE | **Yes** |
| PATCH / publish endpoint | — | — | — | — | — | — | **N/A (none)** |
| `JourneyManagementContext` add/update | Client → API | Yes | Via API | Via API | Via API | Via API | **Yes** |
| Admin add/edit pages | Client → API | Yes | Via API + UI 409/422 | Via API | Via API | Via API | **Yes** |
| `heroAltApply.ts` | Script | No slug writes | No | N/A | No | Batch | HISTORICAL_SCRIPT |
| `scripts/migrations/*` | Manual | Varies | N/A | N/A | N/A | SQL | TRUSTED_MIGRATION |
| `scripts/init-database.js` | Manual | Yes | No | N/A | No | INSERT | HISTORICAL_SCRIPT |
| `pr-j3c-slug-uniqueness.test.ts` | Test | Simulated | Yes | Yes | Mocked | N/A | TEST_ONLY |

## Classification

| Class | Paths |
|-------|-------|
| RUNTIME_ADMIN_WRITE | `POST/PUT /api/journeys*` |
| TRUSTED_MIGRATION | `026_journey_slug_normalized_unique_index.sql`, preflight scripts |
| HISTORICAL_SCRIPT | seed/init, hero alt batch |
| TEST_ONLY | `pr-j3c-slug-uniqueness.test.ts`, API slug tests |

## J3B vs J3C semantics

| Layer | Rule |
|-------|------|
| J3B active publish gate | slug required + canonical lowercase + no hyphen issues + uniqueness (422) |
| J3C app pre-check (draft/archived) | non-empty slug must not collide → HTTP **409** |
| J3C DB race (`23505`) | `journeys_slug_key` or `journeys_slug_normalized_unique_idx` → HTTP **409** |

Archived legacy non-canonical slugs may remain at rest. Editing without slug change does not trigger canonical repair. Promoting to `active` still requires J3B canonical validation.
