# PR-J2C2 — Journey Status Constraint Readiness (025C1 only)

Last updated: 2026-06-29 (PR-J2C2 preparation)

## Scope

This audit covers **status column constraints only**:

- `status NOT NULL`
- `journeys_status_check` → `draft`, `active`, `archived`

**Out of scope for PR-J2C2:** 025C2 (`journey_type_slug`, `currency`, `price_basis`), metadata NOT NULL, price normalization, row UPDATE.

## Production baseline (pre-025C1)

| Metric | Expected |
|--------|----------|
| total | 83 |
| active | 24 |
| archived | 59 |
| draft | 0 |
| inactive | 0 |
| NULL status | 0 |
| illegal status | 0 |
| status default | `draft` |
| public strict query | `status = 'active'` |

## Writer path verification

| Path | File | Status write behavior | Ready |
|------|------|----------------------|-------|
| Admin create | `src/app/admin/journeys/add/page.tsx` | Form default `draft` | ✅ |
| Admin edit publish/archive | `src/app/admin/journeys/edit/[id]/page.tsx` | Toggle `active` ↔ `archived` | ✅ |
| API POST | `src/app/api/journeys/route.ts` | `normalizeJourneyStatusForWrite(status, 'draft')` | ✅ |
| API PUT/PATCH | `src/app/api/journeys/[id]/route.ts` | `normalizeJourneyStatusForWrite(updates.status)` | ✅ |
| Write normalizer | `src/lib/journeyNormalization/write.ts` | `inactive` → `archived`; null → `draft` | ✅ |
| Admin display | `src/lib/journeyNormalization/adminStatus.ts` | Read maps `inactive` → `archived` | ✅ |
| Seed schema | `database/migrations/001_create_tables.sql` | `DEFAULT 'draft'` | ✅ |

### Writer guarantees

- New Journey → **draft** (unless explicitly published)
- Publish → **active**
- Archive → **archived**
- **Never** persists `inactive` (mapped to `archived` before DB)
- **Never** persists `NULL` (`normalizeJourneyStatusForWrite(null)` → `draft`)
- Illegal values throw before SQL

## Public query isolation

- PR-J2C1 strict mode deployed: `buildPublicStatusWhereClause()` → `status = 'active'`
- `seo_complete` does **not** affect public visibility (`src/app/**` has zero references)

## 025C1 migration safety

| Check | Forward SQL | Rollback SQL |
|-------|-------------|--------------|
| No UPDATE/DELETE on journeys | ✅ | ✅ |
| Fixed constraint name `journeys_status_check` | ✅ | ✅ |
| Aborts if constraint exists with wrong definition | ✅ | N/A |
| Aborts if already applied | ✅ | N/A |
| Rollback verifies constraint before DROP | N/A | ✅ |
| Post-check row counts unchanged | ✅ | ✅ |

## Preflight

```bash
npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2c2-status-constraint-preflight.ts
```

`ready=true` required before authorized execution.

If `alreadyApplied=true` / `noActionRequired=true`, do **not** re-run forward migration.

## Post-execution acceptance (after authorized run)

- `status.is_nullable = NO`
- `journeys_status_check` CHECK includes draft / active / archived
- Counts: active 24, archived 59, total 83
- `/journeys` = 200, public 24, sitemap 24
- archived detail = 404
- Admin list includes active + archived
- No constraint violations in runtime logs
