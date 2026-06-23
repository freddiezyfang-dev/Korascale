# Article Categories (Canonical Only)

Revision submissions and new SEO drafts must use **exact** database category strings. URL slugs are separate and must not be substituted for category values.

## Allowed values (exact strings)

1. `China Travel Planning`
2. `Business Travel & Bleisure in China`
3. `Destinations & Route Strategy`
4. `Culture, Dining & Local Experiences`

Source of truth: `CANONICAL_ARTICLE_CATEGORIES` in `src/lib/articleCategories.ts`.

## URL slug mapping (reference only — do not use as `category` value)

| Canonical category | URL slug |
|--------------------|----------|
| China Travel Planning | `china-travel-planning` |
| Business Travel & Bleisure in China | `business-travel-bleisure-china` |
| Destinations & Route Strategy | `destinations-route-strategy` |
| Culture, Dining & Local Experiences | `culture-dining-local-experiences` |

## Legacy categories

Legacy DB values (e.g. `Food Journey`, `The Western Corridor`) may appear in **export** files from older articles. When revising:

- Map the article to the correct **canonical** category above.
- Never write a legacy category into a revision JSON.

## One category per article

Each article has exactly one canonical category. Pick the best fit for primary search intent and reader type.
