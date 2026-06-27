# PR-J2 Rollout & Rollback Order

**Status:** PR-J2A merged — follow **Post-merge rollout** below.

## Pre-rollout disclosure (data already written)

During PR-J2A development, **24 active Journey records** in the connected Neon database were updated via `scripts/migrations/pr-j2-apply-approved-hero-alt.ts --apply`:

```text
24 active Journey records were updated in the connected Neon database:
data.heroAlt and data.heroImageAlt only.

No schema migration was executed.
hero_image_alt column did not exist and was not written.
```

This PR is **not** schema-only. Preview must keep `JOURNEY_NORMALIZATION_COLUMNS` **unset** until 025A runs. Do **not** re-run the apply script on Preview for read-only verification.

After 025A + flag on, run the apply script **dry-run** then `--apply` to sync `hero_image_alt` columns only (target-aware skip; JSONB already populated).

## Post-merge rollout (Production / Preview)

### Step 1 — Run 025A (schema only)

```bash
psql "$POSTGRES_URL" \
  -v ON_ERROR_STOP=1 \
  -f database/migrations/025a_journey_normalization_expand.sql
```

025A only adds nullable columns + indexes. **No UPDATE** on journey rows.

Verify immediately (read-only):

```bash
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f scripts/migrations/pr-j2-post-025a-verify.sql
```

Or run manually:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'journeys'
  AND column_name IN (
    'page_title', 'meta_description', 'hero_image_url', 'hero_image_alt',
    'journey_type_slug', 'price_from', 'currency', 'price_basis',
    'price_on_request', 'price_note', 'price_valid_until',
    'seo_complete', 'display_order'
  )
ORDER BY column_name;

SELECT status, COUNT(*) FROM journeys GROUP BY status ORDER BY status;
```

**Expected before 025B:**

| status | count |
|--------|------:|
| active | 24 |
| inactive | 59 |

Expanded columns should all be **NULL** until dual-write or 025B.

**Rollback:** `database/migrations/025a_journey_normalization_expand.rollback.sql`

---

### Step 2 — Enable column dual-write

After Step 1 passes, set in Vercel (Preview first, then Production when ready):

```env
JOURNEY_NORMALIZATION_COLUMNS=1
```

Trigger a **new deployment** so running instances pick up the env var.

While flag is **off**, app must not reference expanded columns in SQL (pre-025A safe).
While flag is **on**, Admin/API POST/PUT dual-writes JSONB + columns in one statement.

---

### Step 3 — Verify Admin dual-write

**Do not use the 24 active journeys for the first write test.**

Pick a **draft** or **inactive** journey (or use a test DB). Suggested candidates: any row with `status IN ('draft', 'inactive')` from admin list.

1. Open `/admin/journeys/edit/{id}`
2. Edit and save:
   - page title
   - meta description
   - hero alt
   - journey type (label)
   - status — test legacy input `inactive` → should persist as **`archived`**
3. Confirm public read still works (flag on reads columns with JSONB fallback)

Verify in DB:

```bash
psql "$POSTGRES_URL" -v journey_id='<uuid>' -f scripts/migrations/pr-j2-dual-write-verify.sql
```

**Expected:**

| Field | JSONB | Column |
|-------|-------|--------|
| page title | `data.pageTitle` | `page_title` |
| meta description | `data.metaDescription` | `meta_description` |
| hero alt | `data.heroAlt` / `heroImageAlt` | `hero_image_alt` |
| journey type | `data.journeyType` (label) | `journey_type_slug` (slug) |
| status input `inactive` | — | `archived` |

Consistency query at bottom of `pr-j2-dual-write-verify.sql` should return **0 rows**.

---

### Step 4 — Sync hero_image_alt columns (after Step 2)

JSONB hero alt for 24 active journeys was applied during PR-J2A (see disclosure above). After 025A and `JOURNEY_NORMALIZATION_COLUMNS=1`:

```bash
JOURNEY_NORMALIZATION_COLUMNS=1 \
npx tsx --tsconfig tsconfig.json \
  scripts/migrations/pr-j2-apply-approved-hero-alt.ts
```

Expected dry-run:

```text
jsonbMatched=24  columnMissing=24  wouldUpdate=24  skipped=0
```

Then apply:

```bash
JOURNEY_NORMALIZATION_COLUMNS=1 \
npx tsx --tsconfig tsconfig.json \
  scripts/migrations/pr-j2-apply-approved-hero-alt.ts --apply
```

SQL acceptance:

```sql
SELECT COUNT(*) AS active_with_column_alt
FROM journeys
WHERE status = 'active'
  AND NULLIF(TRIM(hero_image_alt), '') IS NOT NULL;
-- expected: 24

SELECT id, slug, hero_image_alt, data->>'heroAlt' AS jsonb_alt
FROM journeys
WHERE status = 'active'
  AND hero_image_alt IS DISTINCT FROM data->>'heroAlt';
-- expected: 0 rows
```

Do **not** run 025B or 025C yet.

---

## Later steps (not part of Step 1–4)

| Step | Action | Verify |
|------|--------|--------|
| 5 | **Manual review (blocks 025B)** | Hero alt CSV approved + `pr-j2-price-manual-review.csv` + `e468b842` admin decision — see [`pr-j2-manual-review-before-025b.md`](./pr-j2-manual-review-before-025b.md). JSONB hero alt already applied to 24 active rows; column sync after Step 2 + dry-run. **No Product Offer until price approved.** |
| 6 | Audit 025B preview | `pr-j2-journey-normalization-preview.md` approved |
| 7 | Run **025B** backfill (`pending/025b_…`) | active=24; inactive→archived; sitemap 24 |
| 8 | Deploy strict status queries | NULL/inactive not public |
| 9 | Run **025C** constraints (`pending/025c_…`) | no CHECK violations |
| 10 | Later: remove legacy JSONB fallbacks | separate PR |

Pending migrations live in `database/migrations/pending/` — **manual psql only**, never auto-run on deploy.

## Slug redirect note

- `next.config.ts` `permanent: true` → **HTTP 308**
- Journey detail `page.tsx` uses `permanentRedirect()` → 308
- Legacy trailing-hyphen slug must not return 200

## seo_complete vs published

- `isJourneyPublished()` → list / detail / sitemap / 200
- `evaluateJourneySeoCompleteness()` → admin quality only; **never** hides active journeys

## Migration split

Monolithic `025` removed. Use **025A → (deploy + flag) → 025B → 025C** only.
