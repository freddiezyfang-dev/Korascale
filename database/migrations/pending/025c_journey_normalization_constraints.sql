-- PR-J2 Stage B Step 3: Constraints ONLY (025C)
-- DO NOT EXECUTE until strict status queries are deployed and verified.
--
-- PREREQUISITE:
--   - 025A + 025B completed
--   - All writers use archived (not inactive)
--   - Public queries use `status = 'active'` strict mode
--   - 24 active journeys verified on production
--
-- EXECUTION ORDER: Last step of PR-J2 data migration
--
-- EXPECTED ROW COUNT: 83 (no row changes)
--
-- ABORT CONDITIONS:
--   - Any row violates proposed CHECK constraints
--   - NULL status rows exist
--   - active count != 24
--
-- ROLLBACK: 025c_journey_normalization_constraints.rollback.sql

BEGIN;

DO $$
DECLARE
  illegal_status INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO illegal_status
  FROM journeys
  WHERE status IS NULL OR status NOT IN ('draft', 'active', 'archived');

  IF illegal_status > 0 THEN
    RAISE EXCEPTION 'ABORT: % rows with illegal status', illegal_status;
  END IF;

  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  IF active_count <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24 active, found %', active_count;
  END IF;
END $$;

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_status_check;
ALTER TABLE journeys ADD CONSTRAINT journeys_status_check
  CHECK (status IN ('draft', 'active', 'archived'));

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_journey_type_slug_check;
ALTER TABLE journeys ADD CONSTRAINT journeys_journey_type_slug_check
  CHECK (
    journey_type_slug IS NULL
    OR journey_type_slug IN ('explore-together', 'deep-discovery', 'signature-journeys', 'group-tours')
  );

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_currency_check;
ALTER TABLE journeys ADD CONSTRAINT journeys_currency_check
  CHECK (currency IS NULL OR currency IN ('USD', 'CNY', 'EUR'));

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_price_basis_check;
ALTER TABLE journeys ADD CONSTRAINT journeys_price_basis_check
  CHECK (price_basis IS NULL OR price_basis IN ('per_person', 'per_group'));

COMMIT;
