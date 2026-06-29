# PR-J2C0 — Journey Writer Readiness Audit

Last updated: 2026-06-26 (PR-J2C0 preparation)

## Summary

All Journey write paths route status through `normalizeJourneyStatusForWrite` in `src/lib/journeyNormalization/write.ts`. New rows default to **`draft`**. Legacy **`inactive`** input maps to **`archived`**. Writers do **not** persist `inactive` or `NULL` status.

Price fields (`currency`, `price_basis`, `price_from`) remain **NULL** when not provided — no auto-fill (price normalization frozen).

## Writer path inventory

| Path | File | Status handling | Default | inactive input | NULL input | type slug | currency / price_basis |
|------|------|-----------------|---------|----------------|------------|-----------|------------------------|
| Admin create | `src/app/admin/journeys/add/page.tsx` | Form `status: 'draft'` | `draft` | UI options: draft/active/archived only | N/A | Via `journeyType` label → dual-write | Not set in form defaults |
| Admin edit publish/archive | `src/app/admin/journeys/edit/[id]/page.tsx` | Toggle `active` ↔ `archived` | Preserves existing | Not exposed in UI | N/A | Existing row | Existing row |
| API POST | `src/app/api/journeys/route.ts` | `normalizeJourneyStatusForWrite(status, 'draft')` | `draft` | → `archived` | → `draft` | `buildJourneyDualWritePayload` | Only if explicitly sent |
| API PUT/PATCH | `src/app/api/journeys/[id]/route.ts` | `normalizeJourneyStatusForWrite(updates.status)` | Unchanged if omitted | → `archived` | Skipped if omitted | Dual-write on update | Only if explicitly sent |
| Dual-write helper | `src/lib/journeyNormalization/write.ts` | N/A | N/A | N/A | N/A | `journeyTypeLabelToSlug` when label provided | Not touched |
| Admin status display | `src/lib/journeyNormalization/adminStatus.ts` | Read: `inactive` → `archived` display | N/A | Mapped on read | Shows `draft` | N/A | N/A |
| Status proposal (audit) | `src/lib/journeyNormalization/status.ts` → `proposeJourneyStatus` | Preview only | N/A | → `archived` | → `draft` | N/A | N/A |
| B1 status backfill SQL | `database/migrations/pending/025b1_journey_status_backfill.sql` | `inactive` → `archived` (executed) | N/A | Migrated | N/A | N/A | N/A |
| B3A metadata backfill | `database/migrations/pending/025b3a_active_journey_metadata_backfill.sql` | Active manifest only; no status writes | N/A | N/A | N/A | Sets slug for 24 active | No price writes |
| B4 seo_complete backfill | `database/migrations/pending/025b4_active_journey_seo_complete_backfill.sql` | Active manifest only | N/A | N/A | N/A | N/A | No price writes |
| Seed / init | `database/migrations/001_create_tables.sql` | `DEFAULT 'draft'` on journeys | `draft` | Legacy schema allowed inactive | Possible pre-B1 | Legacy `journey_type` label column | No constraints |
| Tests | `src/lib/journeyNormalization/journeyNormalization.test.ts`, `pr-j2c-strict-mode.test.ts` | Assert write normalization | `draft` | → `archived` | → `draft` | Canonical slugs | NULL preserved |

## Readiness checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| New Journey defaults `draft` | ✅ | Admin add form + API POST default |
| Publish writes `active` | ✅ | Admin toggle + API accepts `active` |
| Archive writes `archived` | ✅ | Admin toggle + API accepts `archived` / maps `inactive` |
| No new `inactive` rows | ✅ | `normalizeJourneyStatusForWrite` maps to `archived`; production `inactive=0` |
| Status never written as NULL | ✅ | `normalizeJourneyStatusForWrite(null)` → `draft` |
| Type uses canonical slug when set | ✅ | `journeyTypeLabelToSlug` in dual-write |
| currency / price_basis NULL when omitted | ✅ | No writer auto-fill; B3A/B4/025B skip price |
| Legacy `inactive` handling explicit | ✅ | Map to `archived` on write; reject as DB vocabulary |

## 025C1 writer impact

After `status NOT NULL` + CHECK:

- Writers already emit only `draft` / `active` / `archived`.
- NULL status rejected at DB layer (writers already prevent NULL).
- `inactive` rejected at write layer before DB (mapped to `archived`).

## 025C2 writer impact

- `journey_type_slug`: NULL allowed (59 archived rows + e468b842).
- `currency` / `price_basis`: NULL allowed (price frozen, 0/24 active filled).
- Illegal values rejected at write time where validated; DB CHECK is backstop.

## e468b842

| Field | Value | Writer / constraint impact |
|-------|-------|---------------------------|
| id | `e468b842-7c59-4258-8d56-8b585566be82` | Excluded from automated backfills |
| status | `archived` | Valid for 025C1 |
| journey_type_slug | `NULL` | Valid for 025C2 (CHECK allows NULL) |
| seo_complete | `NULL` | No NOT NULL planned |

**Safe:** optional-field CHECK permits NULL `journey_type_slug`; no NOT NULL on metadata fields.
