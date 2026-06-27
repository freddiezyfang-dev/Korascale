-- PR-J2 Stage B Step 2: Data backfill ONLY (025B)
-- DO NOT EXECUTE until docs/audits/pr-j2-journey-normalization-preview.md is approved.
--
-- PREREQUISITE:
--   - 025A completed and compat code deployed
--   - Admin/API no longer writes `inactive` (writes `archived`)
--   - Manual review rows excluded (see MANUAL_REVIEW_IDS below)
--   - Hero alt / price semantics reviewed manually before seo_complete
--
-- EXECUTION ORDER: After 025A + compat deploy + preview approval
--
-- EXPECTED ROW COUNTS (verify in transaction before COMMIT):
--   - active: 24 (unchanged)
--   - inactive → archived: 59
--   - MANUAL_REVIEW skipped: 1 (e468b842 — path prefix + null type)
--   - trailing-hyphen slug updates: 4 (collision-checked)
--
-- ABORT CONDITIONS:
--   - active count != 24 after status backfill
--   - slug collision during trailing-hyphen normalization
--   - any MANUAL_REVIEW row modified
--   - row count != 83
--
-- ROLLBACK: 025b_journey_normalization_backfill.rollback.sql (best-effort; review before use)

BEGIN;

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  IF total_count <> 83 THEN
    RAISE EXCEPTION 'ABORT: expected 83 journeys, found %', total_count;
  END IF;
  IF active_count <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24 active before backfill, found %', active_count;
  END IF;
END $$;

-- 1. Status: inactive → archived (preserves 24 active)
UPDATE journeys
SET status = 'archived', updated_at = NOW()
WHERE status = 'inactive';

DO $$
DECLARE active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  IF active_count <> 24 THEN
    RAISE EXCEPTION 'ABORT: active count must remain 24, found %', active_count;
  END IF;
END $$;

-- 2. Journey type slug — known labels only (skip MANUAL_REVIEW)
UPDATE journeys SET journey_type_slug = 'explore-together', updated_at = NOW()
WHERE journey_type = 'Explore Together'
  AND (journey_type_slug IS NULL OR journey_type_slug = '')
  AND id <> 'e468b842-7c59-4258-8d56-8b585566be82';

UPDATE journeys SET journey_type_slug = 'deep-discovery', updated_at = NOW()
WHERE journey_type = 'Deep Discovery'
  AND (journey_type_slug IS NULL OR journey_type_slug = '')
  AND id <> 'e468b842-7c59-4258-8d56-8b585566be82';

UPDATE journeys SET journey_type_slug = 'signature-journeys', updated_at = NOW()
WHERE journey_type = 'Signature Journeys'
  AND (journey_type_slug IS NULL OR journey_type_slug = '');

UPDATE journeys SET journey_type_slug = 'group-tours', updated_at = NOW()
WHERE journey_type = 'Group Tours'
  AND (journey_type_slug IS NULL OR journey_type_slug = '');

-- 3. SEO columns — verbatim copy from JSONB/columns (no rewrite)
-- hero_image_alt requires manual editorial review — intentionally NOT backfilled here
UPDATE journeys
SET
  page_title = COALESCE(NULLIF(TRIM(page_title), ''), NULLIF(TRIM(data->>'pageTitle'), ''), NULLIF(TRIM(title), '')),
  meta_description = COALESCE(NULLIF(TRIM(meta_description), ''), NULLIF(TRIM(data->>'metaDescription'), ''), NULLIF(TRIM(short_description), '')),
  hero_image_url = COALESCE(NULLIF(TRIM(hero_image_url), ''), NULLIF(TRIM(data->>'heroImage'), ''), NULLIF(TRIM(image), '')),
  updated_at = NOW()
WHERE id <> 'e468b842-7c59-4258-8d56-8b585566be82';

-- 4. Price — copy legacy price column only
-- currency and price_basis intentionally remain NULL
-- price_on_request intentionally remains NULL until manual review
UPDATE journeys
SET
  price_from = COALESCE(price_from, NULLIF(price, 0)),
  updated_at = NOW()
WHERE id <> 'e468b842-7c59-4258-8d56-8b585566be82';

-- 5. Slug trailing-hyphen (collision-checked; skip MANUAL_REVIEW path-prefix row)
DO $$
DECLARE
  rec RECORD;
  new_slug TEXT;
BEGIN
  FOR rec IN
    SELECT id, slug
    FROM journeys
    WHERE slug ~ '-$'
      AND id <> 'e468b842-7c59-4258-8d56-8b585566be82'
  LOOP
    new_slug := regexp_replace(rec.slug, '-+$', '');
    IF new_slug = '' THEN
      RAISE EXCEPTION 'Cannot normalize empty slug for journey %', rec.id;
    END IF;
    IF EXISTS (SELECT 1 FROM journeys j WHERE j.slug = new_slug AND j.id <> rec.id) THEN
      RAISE EXCEPTION 'Slug collision: % → % (journey %)', rec.slug, new_slug, rec.id;
    END IF;
    UPDATE journeys SET slug = new_slug, updated_at = NOW() WHERE id = rec.id;
  END LOOP;
END $$;

-- seo_complete remains false until required fields are reviewed manually
-- (no automatic UPDATE in 025B — do not set seo_complete=true based on active status)

COMMIT;
