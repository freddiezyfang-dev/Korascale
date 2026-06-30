# Codex Journey Editor Usage (PR-J5C)

Controlled CLI and Skill workflow for Journey revisions. **Does not write `journeys` directly.**

## Prerequisites

- Migration `027` applied (`journey_revisions` table exists).
- PR-J5B Admin UI available for human review.
- Local: `POSTGRES_URL` or `NEON_POSTGRES_URL` in `.env.local`.

## Authorization model

| Capability | Requirement |
|------------|-------------|
| `read` / `get` / `dry-run` | Database configured; no write flag |
| `create` / `publish` / `reject` | `CODEX_JOURNEY_REVISION_WRITE_ENABLED=true` (strict `true` only) |
| Production writes | `--environment production --confirm-production` + `JOURNEY_REVISION_ACTOR` + official Production DB identity |
| `publish` / `reject` | `--revision <uuid> --confirm <same-uuid>` |

**Not valid confirmations:** `yes`, `continue`, `looks good`, `好的`, `就这样`.

Codex must **not** set environment variables to bypass guards. Do not create Production pending revisions without explicit user command.

## 1. Read Journey

```bash
npm run journey:revision -- read --slug badaling-great-wall-day-tour
```

Returns JSON with masked `databaseIdentity`, `journeyId`, `slug`, `status`, `updatedAt`, `snapshot`. No revision created.

## 2. Modify existing Journey

```bash
npm run journey:revision -- dry-run --request request.json
# Only after explicit user request and write enabled:
CODEX_JOURNEY_REVISION_WRITE_ENABLED=true \
  npm run journey:revision -- create --request request.json
```

Example `request.json`:

```json
{
  "operation": "update",
  "journeyId": "11111111-1111-4111-8111-111111111111",
  "sourceUpdatedAt": "2026-06-29T10:00:00.000Z",
  "changes": {
    "meta_description": "Updated meta for Badaling day tour."
  },
  "changeSummary": ["Rewrote meta description; preserved itinerary and slug"]
}
```

Identical proposed vs source → `JOURNEY_REVISION_NO_CHANGES` (no pending revision).

## 3. Create new Journey

Proposed status defaults to **`draft`**. Requires write enabled.

## 4. Archive / 5. Restore

Create pending revision via `operation: archive` or `restore`. No hard delete.

## 6. Dry-run only

No `journey_revisions` row inserted. No write flag required.

## 7. Preview / diff

```bash
npm run journey:revision -- get --revision <revision-id>
```

## 8. Publish (explicit only)

User must say: `发布 Journey Revision <exact-uuid>`.

```bash
CODEX_JOURNEY_REVISION_WRITE_ENABLED=true \
JOURNEY_REVISION_ACTOR=human-reviewer \
npm run journey:revision -- publish \
  --revision <uuid> \
  --confirm <same-uuid> \
  --environment production \
  --confirm-production
```

## 9. Reject

```bash
npm run journey:revision -- reject \
  --revision <uuid> \
  --confirm <same-uuid> \
  [--environment production --confirm-production]
```

## 10. Source changed (409)

Re-read Journey, refresh `sourceUpdatedAt`, create new revision.

## 11. Slug conflict

Choose different slug or resolve conflicting Journey.

## 12. Price locked

`JOURNEY_REVISION_PRICE_FIELDS_LOCKED`

## 13. Asset upload required

`ASSET_UPLOAD_REQUIRED` — upload in J5D first.

## 14. Fact check required

`FACT_CHECK_REQUIRED` — keep as pending/draft until resolved.

**J4A Batch 0** (`jiuzhaigou-cultural-adventure-4-day-tour`, `xian-culture-mount-hua-in-depth-4-day-tour`): do not publish as `active` until human confirms true day count.

## Environment flags

| Variable | Purpose |
|----------|---------|
| `CODEX_JOURNEY_REVISION_WRITE_ENABLED` | Must be exactly `true` for create/publish/reject |
| `CODEX_JOURNEY_ENVIRONMENT` | Default CLI environment: `local` \| `preview` \| `production` |
| `JOURNEY_REVISION_ACTOR` | **Required** for Production writes (`created_by` / `published_by`) |
| `JOURNEY_REVISION_API_BASE_URL` | Preview URL host (default `http://localhost:3001`) |
