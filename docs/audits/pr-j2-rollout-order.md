# PR-J2 Rollout & Rollback Order

## Execution sequence

| Step | Action | Verify | Rollback on failure |
|------|--------|--------|---------------------|
| 1 | Run **025A** expand (`025a_journey_normalization_expand.sql`) | `SELECT COUNT(*) FROM journeys` = 83; app starts; admin loads | `025a_rollback.sql` drops nullable columns |
| 2 | Deploy compat read/write code (this PR) | `npm run build`; admin create/edit; public `/journeys` 24 cards | revert deploy; 025A rollback if columns cause issues |
| 3 | Set `JOURNEY_NORMALIZATION_COLUMNS=1` in Preview | dual-write populates new columns | unset env; reads still work via JSONB |
| 4 | Manual: hero alt + price CSV review | `pr-j2-hero-alt-manual-review.csv`, `pr-j2-price-manual-review.csv` | n/a |
| 5 | Audit 025B preview | `pr-j2-journey-normalization-preview.md` approved | do not run 025B |
| 6 | Run **025B** backfill | active=24; redirects work; sitemap 24 URLs | `025b_rollback.sql` (best-effort) |
| 7 | Verify production | 24 active 200; old trailing-hyphen → **308**; canonical sitemap | revert deploy + 025B rollback |
| 8 | Deploy strict status queries (`status = 'active'`) | NULL/inactive not public | revert to compat query helper |
| 9 | Run **025C** constraints | no CHECK violations | `025c_rollback.sql` drops constraints |
| 10 | Later: remove legacy JSONB fallbacks | separate PR | — |

## Slug redirect note

- `next.config.ts` `permanent: true` → **HTTP 308** (Next.js/Vercel default for permanent redirects)
- Journey detail `page.tsx` uses `permanentRedirect()` → 308
- Legacy slug URL must not return 200 (redirect runs before DB fetch)

## seo_complete vs published

- `isJourneyPublished()` → list / detail / sitemap / 200
- `evaluateJourneySeoCompleteness()` → admin quality only; **never** hides active journeys

## 025 not approved

Monolithic `025_journey_data_normalization.sql` **removed**. Use 025A → 025B → 025C only.
