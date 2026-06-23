# KoraScale SEO Revision Schema

This document mirrors `validateSeoRevisionSubmission()` in `src/lib/seo/schema.ts`. Do not maintain a conflicting schema elsewhere.

## Allowed top-level keys

Only these keys may appear in a revision JSON file:

| Key | Required | Type | Notes |
|-----|----------|------|-------|
| `sourceArticleId` | yes | UUID string | Must match live article `id` |
| `sourceSlug` | yes | string, max 255 | Must match live article `slug` |
| `sourceUpdatedAt` | yes | ISO 8601 string | Must match live `articles.updated_at` exactly |
| `title` | yes | string, max 255 | |
| `pageTitle` | yes | string, max 255 | |
| `metaDescription` | yes | string, max 500 | |
| `excerpt` | yes | string, max 2000 | |
| `category` | yes | string | One of four canonical values only (see `article-categories.md`) |
| `tags` | yes | string[] | Max 30 tags; each max 80 chars |
| `content` | yes* | string or `null` | Max 500,000 chars |
| `contentBlocks` | yes* | array | See ContentBlock below |
| `faqs` | yes | array | Max 20 items |
| `ctaConfig` | yes | object | See CTA below |
| `relatedArticles` | yes | UUID[] | Max 20; article IDs only |
| `relatedJourneys` | yes | UUID[] | Max 20; journey IDs only |
| `recommendedSlug` | no | string, max 255 | Suggested slug only; does not change live slug |
| `changeSummary` | yes | string, max 4000 | Human-readable summary of edits |
| `factCheckItems` | yes | array | Max 50 items |

\* At least one of `content` (non-empty) or `contentBlocks` (non-empty array) must be present.

## Forbidden keys

Never include: `id`, `articleId`, `slug`, `author`, `status`, `createdAt`, `updatedAt`, `publishedAt`, `canonical`, `redirect`, `sitemap`, `robots`, `featured`, `displayOrder`, `coverImage`, `heroImage`, `readingTime`, `role`, `created_by`, `createdBy`, or any unknown field.

Do not set `status` to `published` or `active`.

## ContentBlock

```json
{
  "id": "string",
  "type": "heading | paragraph | image | callout | trip_cta",
  "text": "optional string",
  "level": "optional number (headings)",
  "imageSrc": "optional string",
  "caption": "optional string",
  "imageWidth": "contained | full-bleed",
  "monthTag": "optional string",
  "highlightColor": "optional string",
  "journeyId": "optional string",
  "ctaText": "optional string"
}
```

## FAQ item

```json
{ "question": "string, max 500", "answer": "string, max 5000" }
```

## ctaConfig

```json
{
  "mode": "auto | private_journey | corporate_travel | custom | hidden",
  "eyebrow": "optional string",
  "heading": "optional string",
  "body": "optional string",
  "supportingText": "optional string",
  "primaryLabel": "optional string",
  "primaryHref": "optional string — must start with /, https://, http://, or mailto:",
  "secondaryLabel": "optional string",
  "secondaryHref": "optional string — same URL rules"
}
```

`#plan-your-journey` is a valid internal href for plan-trip modal CTAs.

## factCheckItem

```json
{
  "item": "string, max 500",
  "resolved": true,
  "note": "optional string, max 1000"
}
```

Unresolved items (`resolved: false`) still allow dry-run and pending submission; they must appear in the change summary.

## Export file vs revision file

**Export** (`content-workspace/source/<slug>.json`) adds:

- `exportedAt`
- `sourceArticleId`, `sourceSlug`, `sourceUpdatedAt`

**Revision** replaces export metadata fields with the same three source fields (unchanged from export unless article was re-exported), plus `changeSummary` and `factCheckItems`. Do not include `exportedAt` in revision files.

## Validation command

```bash
npm run seo:submit-revision -- --file content-workspace/revisions/<slug>.revision.json --dry-run
```

## Database persistence (submit only)

On formal submit, fields are split:

| JSON file field | DB column | Notes |
|-----------------|-----------|-------|
| Editable content fields | `proposed_content` | Publishable article fields only |
| `changeSummary`, `factCheckItems` | `review_metadata` | Admin review metadata; never written to `articles` |
| Live article snapshot at submit time | `source_snapshot` | Editable fields only; no review metadata |

Legacy rows with `review_metadata = {}` read back as `changeSummary: ""` and `factCheckItems: []`.
