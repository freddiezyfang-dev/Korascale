# PR-J5B Journey Revision Preview / Diff UI — Scope

## Goal

Admin UI to review pending Journey revisions before publish, mirroring `ArticleRevisionPanel` patterns from PR-J4 SEO revisions.

## In scope (J5B)

| Deliverable | Path |
|-------------|------|
| Field diff utility | `src/lib/journeyRevisions/revisionDiff.ts` |
| Preview panel | `src/components/admin/JourneyRevisionPreviewPanel.tsx` |
| Admin route | `/admin/journey-revisions/[id]/preview` |
| Unit tests | `src/lib/journeyRevisions/revisionDiff.test.ts` |

## Views

1. **Source snapshot** — baseline at revision creation (NULL for create)
2. **Proposed snapshot** — merged state to apply on publish
3. **Compare** — scalar + selected JSONB field diffs

## Actions (admin only)

- Publish (blocked on source conflict)
- Reject
- Link back to Journey edit when `journeyId` present

## Out of scope (J5B)

- Codex Skill (J5C)
- Inline editing of pending revision fields
- Public Journey page visual diff
- Journey row direct writes
- Price field editing

## Prerequisites

- Migration **027 executed** (`journey_revisions` table exists)
- PR-J5A APIs deployed

## Follow-up

- Embed panel in `/admin/journeys/edit/[id]` when pending revision exists
- Rich itinerary / gallery diff rendering
