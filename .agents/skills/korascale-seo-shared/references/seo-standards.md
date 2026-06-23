# SEO Standards

## Language

All public SEO articles are in **English**.

## On-page fields

| Field | Purpose | Guidance |
|-------|---------|----------|
| `title` | Editorial headline | Clear, specific; answers a real question or promise |
| `pageTitle` | `<title>` / SERP | Primary keyword + reader benefit; distinct from H1 when helpful |
| `metaDescription` | SERP snippet | 120–160 chars preferred; concrete, not slogan-heavy |
| `excerpt` | Cards / previews | 1–2 sentences; usable without the full article |
| `tags` | Internal grouping | Lowercase or Title Case consistently; no stuffing |

## Category

Must be one of four canonical values (see `article-categories.md`).

## Avoid

- Keyword stuffing
- Promising rankings or traffic
- Duplicate `pageTitle` and `title` unless intentionally identical
- Empty or generic meta descriptions ("Read more about China travel")

## Technical constraints

- Respect field max lengths in `revision-schema.md`
- Do not modify `slug`, canonical URLs, redirects, sitemap, or `status` via revision workflow
