---
name: korascale-seo-revise
description: >-
  Revise existing KoraScale SEO articles via export, structured revision JSON,
  and dry-run validation. Use when the user asks to audit, improve, rewrite, or
  SEO-optimize an existing article, submit a revision, or work with article slugs
  and content-workspace/revisions.
---

# KoraScale SEO Revise (Existing Articles)

Revise **published or draft articles already in the database**. Outputs pending revisions only — never publishes.

## Shared references

Read as needed from `../korascale-seo-shared/references/`:

- [revision-schema.md](../korascale-seo-shared/references/revision-schema.md) — **required before writing JSON**
- [article-structure.md](../korascale-seo-shared/references/article-structure.md) — content vs contentBlocks
- [article-categories.md](../korascale-seo-shared/references/article-categories.md)
- [writing-style.md](../korascale-seo-shared/references/writing-style.md)
- [seo-standards.md](../korascale-seo-shared/references/seo-standards.md)
- [internal-linking.md](../korascale-seo-shared/references/internal-linking.md)
- [cta-rules.md](../korascale-seo-shared/references/cta-rules.md)
- [factual-safety.md](../korascale-seo-shared/references/factual-safety.md)
- [brand-positioning.md](../korascale-seo-shared/references/brand-positioning.md)

## Workflow

```
Task Progress:
- [ ] 1. Get slug or source JSON path from user
- [ ] 2. Export (if slug) → read source file
- [ ] 3. Audit → decision + reader + intent + category
- [ ] 4. Edit allowed fields → write revision JSON
- [ ] 5. Dry-run → fix schema errors → re-run until pass
- [ ] 6. Summarize changes (+ unresolved fact checks)
- [ ] 7. Submit pending revision ONLY if user explicitly asks
```

### Step 1 — Source

User provides **slug** or path to `content-workspace/source/<slug>.json`.

If slug only:

```bash
npm run seo:export -- --slug <slug>
```

Optional catalog for new internal links:

```bash
npm run seo:export-catalog
```

### Step 2 — Audit decision

Pick one:

| Decision | Meaning |
|----------|---------|
| `KEEP_WITH_MINOR_EDITS` | Small copy/SEO fixes |
| `REVISE` | Substantial edit, same topic |
| `REWRITE` | New structure/angle; may rebuild blocks |
| `MERGE` | Combine with another article (document only; do not delete) |
| `REMOVE` | Recommend deprecation (do **not** auto-submit or delete) |

Also document: primary reader, search intent, canonical category, keep/remove/add sections.

### Step 3 — Edit allowed fields

May change: `title`, `pageTitle`, `metaDescription`, `excerpt`, `category`, `tags`, `content`, `contentBlocks`, `faqs`, `ctaConfig`, `relatedArticles`, `relatedJourneys`, optional `recommendedSlug`.

**Must preserve unchanged** (copy from export): `sourceArticleId`, `sourceSlug`, `sourceUpdatedAt`.

**Never modify:** live `slug`, `id`, `author`, `status`, images, featured flags, timestamps, canonical/redirect/sitemap.

### Step 4 — Body rules (summary)

- **Blocks present** → edit `contentBlocks`; set `content` to `null`
- **Legacy HTML only** → edit `content`; keep `contentBlocks: []`
- See [article-structure.md](../korascale-seo-shared/references/article-structure.md)

### Step 5 — Write revision file

Path: `content-workspace/revisions/<sourceSlug>.revision.json`

Include `changeSummary` and `factCheckItems`. Schema: [revision-schema.md](../korascale-seo-shared/references/revision-schema.md).

**Do not modify** `content-workspace/source/<slug>.json`.

### Step 6 — Dry-run (required)

```bash
npm run seo:submit-revision -- --file content-workspace/revisions/<sourceSlug>.revision.json --dry-run
```

On failure: fix JSON, re-run until pass. Dry-run writes **nothing** to the database.

### Step 7 — Formal submit (explicit user request only)

Run **only** when the user clearly asks, e.g.:

- "submit revision"
- "提交后台"
- "保存为待审核版本"

```bash
npm run seo:submit-revision -- --file content-workspace/revisions/<sourceSlug>.revision.json
```

Without explicit request: stop after dry-run + summary.

## Forbidden

- Modifying source export files
- `UPDATE` on `articles` or any publish command
- Changing live slug, status, or admin UI
- Auto-submitting `REMOVE` decisions
- Inventing article/journey UUIDs
- External generation APIs (not part of this workflow)

## Example end-to-end

```bash
npm run seo:export -- --slug china-rail-guide
npm run seo:export-catalog
# … edit → content-workspace/revisions/china-rail-guide.revision.json
npm run seo:submit-revision -- --file content-workspace/revisions/china-rail-guide.revision.json --dry-run
# User: "submit revision"
npm run seo:submit-revision -- --file content-workspace/revisions/china-rail-guide.revision.json
```
