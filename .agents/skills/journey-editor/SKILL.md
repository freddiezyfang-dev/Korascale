---
name: journey-editor
description: >-
  Read, dry-run, create pending revisions, preview, publish, and reject Journey
  changes via the Journey Revision system. Use when the user asks to read,
  create, update, archive, restore, preview, or publish a Journey by slug or
  revision ID. Never write directly to the journeys table.
---

# Journey Editor (Codex)

Operate on Journeys **only** through the Journey Revision system. All create / update / archive / restore actions produce **`pending_review`** revisions — never auto-publish.

## References

- [codex-journey-editor-contract.md](../../docs/workflows/codex-journey-editor-contract.md)
- [codex-journey-editor-usage.md](../../docs/workflows/codex-journey-editor-usage.md)

## Fixed workflow

```
1. Identify user intent (read | dry-run | update | create | archive | restore | preview | publish | reject)
2. Confirm Journey object (slug or ID)
3. Read live Journey (no writes)
4. Capture updated_at from read result
5. Generate changes (partial — only requested fields)
6. Run dry-run
7. Show diff / validation / warnings
8. Create pending revision (only when user asks to save/submit)
9. Return Revision ID + Preview URL
10. STOP — wait for explicit publish instruction
11. Publish only after explicit "发布 Journey Revision <uuid>" style command
```

## CLI commands

```bash
npm run journey:revision -- read --slug <slug>
npm run journey:revision -- read --id <journey-id>
npm run journey:revision -- dry-run --request '<json-or-file>'
npm run journey:revision -- create --request '<json-or-file>' [--environment local|preview|production] [--confirm-production]
npm run journey:revision -- get --revision <revision-id>
npm run journey:revision -- publish --revision <id> --confirm <same-id> --environment production --confirm-production
npm run journey:revision -- reject --revision <id> --confirm <same-id> [--environment production] [--confirm-production]
```

**Default:** read / dry-run / get only — no database writes.

**Write commands** require `CODEX_JOURNEY_REVISION_WRITE_ENABLED=true` (strict string `true` only).

**Production** create / publish / reject additionally require:

```bash
--environment production --confirm-production
JOURNEY_REVISION_ACTOR=<human-reviewer>
```

Journey Revision publish **always writes normalized columns authoritatively** (column + compatibility JSONB). Operators do **not** need the `JOURNEY_NORMALIZATION_COLUMNS` env var on the CLI.

Database identity must match declared environment. Codex must **never** set environment variables to bypass guards.

## Request JSON shape

```json
{
  "operation": "update",
  "journeyId": "uuid",
  "sourceUpdatedAt": "2026-06-30T00:00:00.000Z",
  "changes": {
    "page_title": "...",
    "meta_description": "...",
    "data": { "faqs": [] }
  },
  "changeSummary": [
    "Rewrite page title",
    "Add four FAQs"
  ],
  "reviewMetadata": {
    "factCheckItems": []
  }
}
```

- `sourceUpdatedAt` must come from the **latest** read — never reuse stale values.
- Request contains **only** requested changes; server merges full proposed snapshot.
- Do not construct a full DB row manually.

## Supported intents

### Read

Return Journey ID, slug, status, `updated_at`, normalized SEO fields, itinerary, FAQ, relationships, revision status. **No modifications.**

### Dry-run

Validate changes without creating a revision row.

### Update / Create / Archive / Restore

Default: create **`pending_review`** revision only when write is enabled (`CODEX_JOURNEY_REVISION_WRITE_ENABLED=true`) and user explicitly asks to save/submit.

- **Create:** proposed status `draft` by default.
- **Archive:** `operation: archive` — no hard delete.
- **Restore:** proposed status `draft` unless user explicitly requests `active` and J3B gate passes.

### Preview

`get --revision <id>` — return diff context, validation, preview URL, allowed actions.

### Publish

**Only** when user explicitly says e.g. `发布 Journey Revision <exact-uuid>` or `Publish Journey Revision <exact-uuid>`.

**Never** treat as publish: `看起来可以`, `继续`, `好的`, `就这样`, `looks good`, `go ahead`.

Before publish, show: Revision ID, operation, slug, status, validation. Require `--revision` and `--confirm` to match.

### Reject

`reject --revision <id>` — does not modify live Journey.

## Pending revision edit loop

When user edits a pending revision ("把 Day 3 再改一下"):

1. Read existing pending revision (`get --revision`)
2. Base new `changes` on **proposed snapshot**, not live Journey alone
3. Create **new** pending revision (supersedes old pending)
4. Return new Revision ID — never mutate pending snapshot in place

## Field rules

**May change:** title, slug, status (per operation), SEO fields, hero (existing URLs only), itinerary, overview, highlights, inclusions, exclusions, gallery, FAQ, relationships, destination/route copy.

**Must not change:** id, timestamps, `seo_complete`, publish metadata, **all price fields**.

Price change attempt → `JOURNEY_REVISION_PRICE_FIELDS_LOCKED`.

## Images (J5C)

- Keep existing URLs or use user-provided confirmed asset URLs only.
- No invented Vercel Blob URLs, local paths, or web scraping.
- New upload needed → `ASSET_UPLOAD_REQUIRED` (J5D).

## Partial updates

Preserve all fields not explicitly requested: slug, status, itinerary days, gallery, relationships, price, unknown JSONB keys.

## changeSummary

List **concrete** edits only. Forbidden alone: "Improved SEO", "Enhanced user experience", "Optimized content".

## Fact check

Add `factCheckItems` for: route days, travel time, altitude, seasonal access, hotel tier, tickets, inclusions, price, visa, permits.

Unresolved facts → may create draft/pending revision; mark `FACT_CHECK_REQUIRED`; do not recommend publishing as `active`.

**J4A Batch 0** (`jiuzhaigou-cultural-adventure-4-day-tour`, `xian-culture-mount-hua-in-depth-4-day-tour`): do not publish active until human confirms true day count.

## Standard output

After dry-run, create, or publish — use the labeled blocks defined in the usage doc. Never output secrets, DB URLs, or auth tokens.

## Forbidden

- Direct `INSERT` / `UPDATE` / `DELETE` on `journeys`
- Auto-publish after create or vague approval
- Bypass revision API / domain service
- Modify Production env vars, deploy, or run migrations
- Set `CODEX_JOURNEY_REVISION_WRITE_ENABLED` without explicit human authorization
- Create Production pending revisions without user command
- Image upload (J5D)
- No-op revisions (identical proposed vs source for update)
