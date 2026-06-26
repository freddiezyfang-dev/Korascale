-- PR-J2 Stage B Step 1: Schema expansion ONLY (025A)
--
-- PREREQUISITE:
--   - Application on main/PR-J2 branch with compat read/write code deployed.
--   - No pending locks on `journeys` table.
--   - Backup or snapshot available.
--
-- EXECUTION ORDER:
--   1. Run this file (025A)
--   2. Deploy compat read/write code (dual-write + legacy fallbacks)
--   3. Manual hero alt / price review
--   4. Run 025B backfill (after preview approval)
--   5. Deploy strict status queries
--   6. Run 025C constraints
--
-- EXPECTED ROW COUNT: 83 journeys (unchanged — no UPDATE in this file)
--
-- ABORT CONDITIONS:
--   - journeys row count != 83 (adjust expected count if inventory changed)
--   - Any ALTER fails due to existing conflicting column type
--   - Production app cannot start after deploy (rollback 025A)
--
-- ROLLBACK: database/migrations/025a_journey_normalization_expand.rollback.sql
--   Drops new nullable columns only. Safe if 025B has NOT run.
--
-- DO NOT RUN 025B or 025C in the same transaction.

BEGIN;

-- Verify expected inventory before DDL (read-only guard)
DO $$
DECLARE
  journey_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO journey_count FROM journeys;
  IF journey_count <> 83 THEN
    RAISE EXCEPTION 'ABORT: expected 83 journeys, found %', journey_count;
  END IF;
END $$;

-- Nullable structured columns — no row updates, no defaults that guess business state
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS page_title VARCHAR(255);
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS hero_image_url VARCHAR(500);
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS hero_image_alt VARCHAR(500);
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS journey_type_slug VARCHAR(50);
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS currency CHAR(3);
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS price_basis VARCHAR(20);
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS price_from DECIMAL(10, 2);
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS price_on_request BOOLEAN;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS price_note TEXT;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS price_valid_until DATE;
-- Admin quality marker only — NOT used for list/detail/sitemap inclusion
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS seo_complete BOOLEAN;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS display_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_journeys_journey_type_slug ON journeys(journey_type_slug);
CREATE INDEX IF NOT EXISTS idx_journeys_seo_complete ON journeys(seo_complete);

COMMIT;
