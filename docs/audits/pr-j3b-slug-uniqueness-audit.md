# PR-J3B — Slug Uniqueness Audit

Last updated: 2026-06-29 (preparation)

## Database constraint status

| Check | Result |
|-------|--------|
| `journeys.slug` UNIQUE constraint | **Not present** (application-level check only in J3B) |
| `journeys.slug` UNIQUE index | **Not verified in J3B** — no ALTER in this PR |

## Production duplicate scan (read-only preflight)

The J3B preflight script builds canonical slug ownership across **all 83 rows** (active, draft, archived).

Expected Production baseline after J2B2 slug normalization:

```text
slugConflictIds = []
```

## Server-side uniqueness query

`findJourneySlugConflict()` in `journeyPublishIntegrity.server.ts`:

- Scans **all rows** (active, draft, archived) — not active-only
- Normalizes candidate slug via `resolveCanonicalPublishSlug()` (trim + lowercase)
- Compares canonical form of every row's slug (case-insensitive via canonical lowercase)
- Excludes current Journey ID on update (self never conflicts)

## Database constraint status (unchanged in J3B)

- Current database has **no** `journeys.slug` UNIQUE constraint or index
- Read-only preflight on 83 Production rows: **no duplicate canonical slugs**
- Concurrent Admin writes can still race between check and commit
- **PR-J3C** (separate follow-up): add DB UNIQUE after verification; **no ALTER in J3B**
