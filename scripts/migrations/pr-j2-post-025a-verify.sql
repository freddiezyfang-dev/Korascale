-- PR-J2 post-025A verification (read-only)
-- Run after: psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f database/migrations/025a_journey_normalization_expand.sql
--
-- Expected:
--   - 13 expanded columns present, all nullable
--   - status counts unchanged: active=24, inactive=59 (025B not run yet)
--   - no row data backfilled by 025A

\echo '=== Expanded columns (expect 13 rows, is_nullable = YES) ==='
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'journeys'
  AND column_name IN (
    'page_title',
    'meta_description',
    'hero_image_url',
    'hero_image_alt',
    'journey_type_slug',
    'price_from',
    'currency',
    'price_basis',
    'price_on_request',
    'price_note',
    'price_valid_until',
    'seo_complete',
    'display_order'
  )
ORDER BY column_name;

\echo '=== Status inventory (expect active=24, inactive=59 before 025B) ==='
SELECT status, COUNT(*)
FROM journeys
GROUP BY status
ORDER BY status;

\echo '=== Row count guard ==='
SELECT COUNT(*) AS journey_total FROM journeys;

\echo '=== Sample: expanded columns should still be NULL pre-backfill / pre-dual-write ==='
SELECT
  COUNT(*) FILTER (WHERE page_title IS NOT NULL) AS page_title_set,
  COUNT(*) FILTER (WHERE meta_description IS NOT NULL) AS meta_description_set,
  COUNT(*) FILTER (WHERE hero_image_alt IS NOT NULL) AS hero_image_alt_set,
  COUNT(*) FILTER (WHERE journey_type_slug IS NOT NULL) AS journey_type_slug_set,
  COUNT(*) FILTER (WHERE seo_complete IS NOT NULL) AS seo_complete_set
FROM journeys;
