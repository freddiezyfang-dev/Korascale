# Codex Journey Editor Contract (PR-J5A)

This document defines how Codex (and other automation) may interact with Journeys **after** migration `027` is applied in a future PR.

## Allowed workflow

```
read Journey (Admin API or export)
  → POST /api/admin/journey-revisions/dry-run
  → POST /api/admin/journey-revisions  (creates pending_review revision)
  → return revisionId + previewPath to user
  → STOP — wait for explicit human "publish" instruction
  → POST /api/admin/journey-revisions/{id}/publish  (human/admin only)
```

## Required headers / auth

- Valid admin session cookie (same as Article revision admin).
- CSRF same-origin check on mutating routes (`enforceAdminWrite`).

## Operations

| Operation | Use when |
|-----------|----------|
| `create` | New Journey (default `draft` status in proposed snapshot) |
| `update` | Edit existing Journey content/metadata |
| `archive` | Set `status=archived` only; content preserved |
| `restore` | Move archived → `draft` (not auto-active) |

## Dry-run request shape

```json
{
  "operation": "update",
  "journeyId": "uuid",
  "sourceUpdatedAt": "2026-06-29T12:00:00.000Z",
  "changes": {
    "title": "Example",
    "data": { "itinerary": [] }
  },
  "reviewMetadata": {
    "changeSummary": ["Updated day 2 copy"],
    "factCheckItems": []
  }
}
```

Server merges `changes` into full `proposed_snapshot`. Client cannot set protected fields directly.

## Forbidden (Codex)

- Direct `INSERT` / `UPDATE` / `DELETE` on `journeys`
- Bypass revision API
- Publish without explicit user command
- Modify price fields: `price`, `price_from`, `currency`, `price_basis`, `price_on_request`, `price_note`, `price_valid_until`
- Set `seo_complete` (server recalculates on publish)
- Skip `sourceUpdatedAt` on update/archive/restore
- Fabricate related Journey / Article UUIDs
- Fabricate image URLs
- Hard delete / purge Journeys
- Modify Production environment variables
- Deploy or run migrations
- Restart archived Journeys as `active` without passing J3B Publish Gate

## Archive rules

- Use `operation: "archive"` revision — not direct status UPDATE.
- Slug unchanged; no redirect created; content retained.

## Restore rules

- Default proposed status: **`draft`**
- To restore as **`active`**: proposed snapshot must pass full J3B gate at dry-run and publish.

## Error handling

On failure, read structured `errors[]` with `{ field, code, message }`. Do not retry publish on `JOURNEY_REVISION_SOURCE_CHANGED` — re-read Journey and create a new revision.

## Human review

`pending_review` revisions require admin publish or reject. Codex must surface:

- `changeSummary`
- `validationReport.warnings` (e.g. `FACT_CHECK_REQUIRED`)
- unresolved fact check items (if any)

## J5C Codex tooling

- Skill: `.agents/skills/journey-editor/SKILL.md`
- CLI: `npm run journey:revision`
- Usage: `docs/workflows/codex-journey-editor-usage.md`
- Reuse audit: `docs/audits/pr-j5c-inspiration-codex-workflow-reuse.md`

Migration `027` is applied in Production. Revision APIs require `journey_revisions` table; preflight script verifies readiness.

## J5C write guards (fail-closed)

| Command | Write flag | Production extras |
|---------|------------|-------------------|
| read / get / dry-run | Not required | — |
| create / publish / reject | `CODEX_JOURNEY_REVISION_WRITE_ENABLED=true` (strict) | `--environment production --confirm-production` + `JOURNEY_REVISION_ACTOR` + Production DB identity match |
| publish / reject | — | `--revision` and `--confirm` must be identical UUIDs |

- No-op updates (`JOURNEY_REVISION_NO_CHANGES`) must not create pending revisions.
- Database identity output is masked (host/db only, no credentials).
- Legacy `CODEX_JOURNEY_REVISION_PREP` is not supported.
