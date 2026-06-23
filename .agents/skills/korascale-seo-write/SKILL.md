---
name: korascale-seo-write
description: >-
  Draft new KoraScale SEO articles as briefs and JSON/Markdown in
  content-workspace/drafts. Use when the user asks to write a new article,
  content brief, or SEO draft from scratch. Does not submit to the database.
---

# KoraScale SEO Write (New Articles)

Draft **new** SEO content. **New article backend submission is not supported by the current revision infrastructure.**

There is no `sourceArticleId`, no `seo:submit-revision`, and no `articles` INSERT in this workflow.

## Shared references

From `../korascale-seo-shared/references/`:

- [brand-positioning.md](../korascale-seo-shared/references/brand-positioning.md)
- [article-categories.md](../korascale-seo-shared/references/article-categories.md)
- [seo-standards.md](../korascale-seo-shared/references/seo-standards.md)
- [writing-style.md](../korascale-seo-shared/references/writing-style.md)
- [article-structure.md](../korascale-seo-shared/references/article-structure.md)
- [internal-linking.md](../korascale-seo-shared/references/internal-linking.md)
- [cta-rules.md](../korascale-seo-shared/references/cta-rules.md)
- [factual-safety.md](../korascale-seo-shared/references/factual-safety.md)

For revision field shapes (future handoff), see [revision-schema.md](../korascale-seo-shared/references/revision-schema.md) — but omit `sourceArticleId`, `sourceSlug`, `sourceUpdatedAt` in drafts.

## Workflow

1. Clarify topic, reader, search intent, and canonical category (four values only).
2. Optional: `npm run seo:export-catalog` for real journey/article IDs for link suggestions.
3. Produce:
   - Content brief (reader, intent, outline, category, proposed slug **as suggestion only**)
   - SEO fields: `title`, `pageTitle`, `metaDescription`, `excerpt`, `tags`
   - Body: prefer `contentBlocks` structure for new drafts; or HTML `content` if blocks are not used
   - `faqs`, `ctaConfig`, suggested `relatedArticles` / `relatedJourneys` (IDs from catalog only)
   - `factCheckItems` for unverified claims
4. Save to `content-workspace/drafts/<proposed-slug>.draft.json` (or `.md` brief alongside).

## Output template (draft JSON)

```json
{
  "draftType": "new-article",
  "proposedSlug": "example-slug",
  "category": "China Travel Planning",
  "title": "",
  "pageTitle": "",
  "metaDescription": "",
  "excerpt": "",
  "tags": [],
  "content": null,
  "contentBlocks": [],
  "faqs": [],
  "ctaConfig": { "mode": "auto" },
  "suggestedRelatedArticles": [],
  "suggestedRelatedJourneys": [],
  "factCheckItems": [],
  "brief": "One-paragraph editorial brief"
}
```

## Supported today

- Content briefs and SEO field drafts
- Body, FAQs, CTA, and internal link **suggestions** (verified IDs only)
- Files under `content-workspace/drafts/`

## Not supported today

- `seo:submit-revision` (requires existing article)
- `article_revisions` or `articles` database writes
- Publishing or admin creation
- Fabricating `sourceArticleId`

## Handoff to revise workflow

After an admin creates the article in the CMS, use **korascale-seo-revise** with `npm run seo:export` and the live slug.

## Forbidden

- Calling `seo:submit-revision`
- Faking `sourceArticleId` / `sourceUpdatedAt`
- Inventing internal link UUIDs
- Auto-publish or UPDATE articles
