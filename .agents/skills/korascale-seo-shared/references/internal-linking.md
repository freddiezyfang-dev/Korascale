# Internal Linking

## ID types in revision JSON

| Field | Type | Maps to DB |
|-------|------|------------|
| `relatedArticles` | `string[]` (UUID) | `articles.recommended_items` where `type === "article"` |
| `relatedJourneys` | `string[]` (UUID) | Union of `articles.related_journey_ids` and `recommended_items` where `type === "journey"` |

Export merges journey IDs from both sources into `relatedJourneys`. Codex should treat the export/catalog IDs as authoritative.

## Rules

1. **Default: preserve** existing IDs from export unless there is a clear editorial reason to remove.
2. **Add IDs only** when confirmed in:
   - `content-workspace/source/content-catalog.json` (from `npm run seo:export-catalog`), or
   - the article export itself, or
   - an explicit catalog provided by the user
3. **Never** guess UUIDs from slugs or titles.
4. **Never** use slug strings where UUIDs are required.
5. **Removing** a link requires explanation in `changeSummary`.

## Catalog command

```bash
npm run seo:export-catalog
```

Writes `content-workspace/source/content-catalog.json` with active articles and journeys (id, slug, title/name, category/type). SELECT only; no sensitive fields.

## Sidebar behavior

`relatedArticles` feed the article sidebar (`getSidebarRelatedArticles`). Journeys in `relatedJourneys` are stored for recommendations; sidebar prioritizes manual article picks first.
