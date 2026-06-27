-- Rollback 025B — best-effort; review row-level impact before running.
-- LIMITATION: Cannot restore original inactive label for all rows without backup.
-- Slug trailing-hyphen reversions require manual mapping.

BEGIN;

-- Restore archived → inactive (legacy vocabulary)
UPDATE journeys SET status = 'inactive', updated_at = NOW() WHERE status = 'archived';

-- Clear backfilled columns (data remains in JSONB)
UPDATE journeys SET
  page_title = NULL,
  meta_description = NULL,
  hero_image_url = NULL,
  hero_image_alt = NULL,
  journey_type_slug = NULL,
  currency = NULL,
  price_basis = NULL,
  price_from = NULL,
  price_on_request = NULL,
  price_note = NULL,
  seo_complete = NULL,
  updated_at = NOW();

COMMIT;
