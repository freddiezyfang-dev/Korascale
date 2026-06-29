# PR-J3B — Journey Writer Audit

Last updated: 2026-06-29 (preparation)

## Summary

Runtime Admin Journey writers that can produce `status = 'active'` must use the central publish integrity gate before any database write.

## Writer inventory

| File | Function/Route | Auth | Operation | Can set active | Current validation | Uses central gate | Required change |
|------|----------------|------|-----------|----------------|------------------|-------------------|-----------------|
| `src/app/api/journeys/route.ts` | POST | `enforceAdminWrite` | Create | Yes | Status normalize only | **Yes** | Done |
| `src/app/api/journeys/[id]/route.ts` | PUT | `enforceAdminWrite` | Update | Yes | Status normalize only | **Yes** | Done |
| `src/app/api/journeys/[id]/route.ts` | GET | None / Admin read | Read | No | N/A | N/A | No |
| `src/app/api/journeys/[id]/route.ts` | DELETE | `enforceAdminWrite` | Delete | No | N/A | N/A | No |
| `src/app/api/journeys/route.ts` | GET | Public / Admin includeAll | Read | No | N/A | N/A | No |
| `src/context/JourneyManagementContext.tsx` | `updateJourney` / `addJourney` | Client → API | Proxy | Yes | Via API | **Yes (API)** | No |
| `src/app/admin/journeys/edit/[id]/page.tsx` | `handleSave` | Client → API | Proxy | Yes | Via API + UI 422 display | **Yes (API)** | Done |
| `src/app/admin/journeys/add/page.tsx` | create flow | Client → API | Proxy | Yes | Via API + UI 422 display | **Yes (API)** | Done |
| `src/app/admin/journeys/page.tsx` | status toggle | Client → API | Proxy | Yes | Via API | **Yes (API)** | No |
| `src/lib/journeyNormalization/heroAltApply.ts` | batch apply | Script | Update | No | Manual | No | HISTORICAL_SCRIPT |
| `src/app/api/admin/cleanup-db/route.ts` | cleanup | Admin | Update | Unknown | Legacy | No | Out of J3B scope |
| `scripts/migrations/*` | preflight/backfill | Manual | SQL | Varies | Manifest guards | No | TRUSTED_MIGRATION |
| `scripts/init-database.js` | bootstrap | Manual | INSERT | Yes | None | No | HISTORICAL_SCRIPT |

## Classification

| Class | Paths |
|-------|-------|
| RUNTIME_ADMIN_WRITE | `POST/PUT /api/journeys*` |
| TRUSTED_MIGRATION | `scripts/migrations/pending/*`, `scripts/run-migration.js` |
| HISTORICAL_SCRIPT | `heroAltApply.ts`, seed/init scripts |
| TEST_ONLY | `pr-j3b-publish-integrity.test.ts`, API auth tests |

## Gate behavior

- Validates **merged final row**, not request payload alone
- Rejects `status = 'active'` when publish fields incomplete → HTTP 422
- Sets `seo_complete = contentComplete` server-side; ignores client value
- Draft/archived saves allowed with incomplete normalized fields
- **Concurrency note:** `loadJourneyDbRowById` → slug conflict scan → single atomic `INSERT`/`UPDATE` are **not** wrapped in one DB transaction. J3B guarantees **zero writes before gate pass** and **one atomic statement on success**; concurrent slug races remain until PR-J3C UNIQUE constraint.
