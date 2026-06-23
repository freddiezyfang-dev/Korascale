# Article Structure

## Body rendering priority (code truth)

`ArticleBodyContent` (`src/components/articles/ArticleBodyContent.tsx`):

1. If `contentBlocks.length > 0` → render **contentBlocks only**
2. Else if `content` has text → render legacy HTML `content`
3. Tags and FAQs render below the body regardless

**`contentBlocks` is primary when present.** Legacy `content` is ignored on the live page when blocks exist.

## Codex rules for revisions

### Block-based articles (`contentBlocks.length > 0`)

- Edit `contentBlocks` as the source of truth.
- Set `content` to `null` in the revision JSON (matches schema; avoids dual-body drift).
- Preserve block `id` values when editing existing blocks.
- Supported `type` values: `heading`, `paragraph`, `image`, `callout`, `trip_cta`.
- Do not remove `image`, `callout`, or custom blocks unless intentional — note in `changeSummary`.
- `trip_cta` blocks are legacy in-body CTAs; page-level `ctaConfig` takes precedence when active.

### Legacy HTML articles (`contentBlocks` empty, `content` populated)

- Edit `content` (HTML string) as the source of truth.
- Keep `contentBlocks` as `[]`.
- Do **not** invent `contentBlocks` unless performing a full REWRITE with explicit block structure.
- Use existing rich-text patterns (`<p>`, `<h2>`, `<h3>`, lists) consistent with `articleRichText`.

### Never

- Ship different stories in `content` and `contentBlocks`.
- Break unsupported block types or strip required image/CTA fields without explanation.

## Typical article flow

1. Opening — state the reader problem or decision
2. Core guidance — routes, timing, tradeoffs, context
3. Practical detail — examples, constraints, what to book first
4. Optional KoraScale angle — planning support, private journeys, corporate logistics
5. FAQs — search-led questions not fully covered above
6. Page CTA — category-appropriate (see `cta-rules.md`)
