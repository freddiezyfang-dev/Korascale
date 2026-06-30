# PR-J5B Journey Revision Admin UI — Scope

## Goal

Admin UI for reviewing Journey revisions: **List → Preview / Diff → Publish / Reject**.

Mirrors Article revision admin patterns; does not write `journeys` directly.

## In scope (J5B)

| Deliverable | Path |
|-------------|------|
| List API | `GET /api/admin/journey-revisions` |
| List service | `listJourneyRevisionsForAdmin` |
| Field diff utility | `src/lib/journeyRevisions/revisionDiff.ts` |
| List page | `/admin/journey-revisions` |
| Preview / diff panel | `src/components/admin/JourneyRevisionPreviewPanel.tsx` |
| Preview route | `/admin/journey-revisions/[id]/preview` |
| Journeys nav link | `/admin/journeys` → Revisions button |
| Auth tests | list + existing J5A routes |

## User flow

1. **List** — filter by status (`pending_review` default), see operation, proposed title/slug, conflict badge
2. **Preview / Diff** — source / proposed / compare views; field-level diff summary
3. **Publish / Reject** — from preview page (blocked when source conflict)

## Out of scope (J5B)

- Codex Skill (J5C)
- J4 Batch 0 / Batch 1 content edits
- Inline edit of pending revision JSON
- Public Journey visual diff
- Price field editing
- Journey row direct writes

## Prerequisites

- Migration **027 executed** — `journey_revisions` exists, **row count 0** at cutover; **no Journey row changes**
- PR-J5A APIs deployed

## Follow-up

- Embed pending-revision banner on `/admin/journeys/edit/[id]`
- Rich itinerary / gallery side-by-side diff
