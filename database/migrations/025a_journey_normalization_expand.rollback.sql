-- Rollback 025A — drops expanded columns only.
-- LIMITATION: Cannot restore column data after 025B backfill; run only before 025B.
-- PREREQUISITE: Application code must tolerate missing columns (legacy JSONB-only reads).

BEGIN;

DROP INDEX IF EXISTS idx_journeys_seo_complete;
DROP INDEX IF EXISTS idx_journeys_journey_type_slug;

ALTER TABLE journeys DROP COLUMN IF EXISTS display_order;
ALTER TABLE journeys DROP COLUMN IF EXISTS seo_complete;
ALTER TABLE journeys DROP COLUMN IF EXISTS price_valid_until;
ALTER TABLE journeys DROP COLUMN IF EXISTS price_note;
ALTER TABLE journeys DROP COLUMN IF EXISTS price_on_request;
ALTER TABLE journeys DROP COLUMN IF EXISTS price_from;
ALTER TABLE journeys DROP COLUMN IF EXISTS price_basis;
ALTER TABLE journeys DROP COLUMN IF EXISTS currency;
ALTER TABLE journeys DROP COLUMN IF EXISTS journey_type_slug;
ALTER TABLE journeys DROP COLUMN IF EXISTS hero_image_alt;
ALTER TABLE journeys DROP COLUMN IF EXISTS hero_image_url;
ALTER TABLE journeys DROP COLUMN IF EXISTS meta_description;
ALTER TABLE journeys DROP COLUMN IF EXISTS page_title;

COMMIT;
