-- PR-J2 Step 3: dual-write verification (run AFTER admin save on a draft/inactive test row)
-- Replace :journey_id with the UUID you edited in Admin.
--
-- Expected when JOURNEY_NORMALIZATION_COLUMNS=1:
--   - JSONB fields and expanded columns match for page title, meta description, hero alt, journey type
--   - status written as archived if you saved inactive input (not new inactive rows in DB vocabulary)

-- \set journey_id 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

SELECT
  id,
  slug,
  status,
  journey_type,
  journey_type_slug,
  page_title,
  meta_description,
  hero_image_url,
  hero_image_alt,
  data->>'pageTitle'       AS jsonb_page_title,
  data->>'metaDescription' AS jsonb_meta_description,
  data->>'heroAlt'         AS jsonb_hero_alt,
  data->>'heroImageAlt'    AS jsonb_hero_image_alt,
  data->>'journeyType'     AS jsonb_journey_type,
  updated_at
FROM journeys
WHERE id = :'journey_id';

\echo '=== Consistency checks (should return 0 rows if dual-write is correct) ==='
SELECT id, slug, 'page_title mismatch' AS issue
FROM journeys
WHERE id = :'journey_id'
  AND page_title IS DISTINCT FROM NULLIF(TRIM(data->>'pageTitle'), '')

UNION ALL

SELECT id, slug, 'meta_description mismatch'
FROM journeys
WHERE id = :'journey_id'
  AND meta_description IS DISTINCT FROM NULLIF(TRIM(data->>'metaDescription'), '')

UNION ALL

SELECT id, slug, 'hero_image_alt mismatch'
FROM journeys
WHERE id = :'journey_id'
  AND hero_image_alt IS DISTINCT FROM COALESCE(
    NULLIF(TRIM(data->>'heroAlt'), ''),
    NULLIF(TRIM(data->>'heroImageAlt'), '')
  );
