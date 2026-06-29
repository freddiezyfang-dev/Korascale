-- PR-J2C1 / 025C1: Journey status constraints ONLY
-- DO NOT EXECUTE until PR-J2C1 strict public queries are deployed and verified.
--
-- SCOPE: status NOT NULL + CHECK (draft, active, archived)
-- DOES NOT modify any journey row data
--
-- PREREQUISITE:
--   - NULL status count = 0
--   - inactive status count = 0
--   - Public queries use status = 'active' strict mode
--
-- ROLLBACK: 025c1_journey_status_constraints.rollback.sql

BEGIN;

DO $$
DECLARE
  null_status INTEGER;
  illegal_status INTEGER;
  inactive_count INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_status FROM journeys WHERE status IS NULL;
  IF null_status <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C1: % rows with NULL status', null_status;
  END IF;

  SELECT COUNT(*) INTO illegal_status
  FROM journeys
  WHERE status NOT IN ('draft', 'active', 'archived');
  IF illegal_status <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C1: % rows with illegal status', illegal_status;
  END IF;

  SELECT COUNT(*) INTO inactive_count FROM journeys WHERE status = 'inactive';
  IF inactive_count <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C1: % rows still inactive', inactive_count;
  END IF;

  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  IF active_count <> 24 THEN
    RAISE EXCEPTION 'ABORT 025C1: expected 24 active, found %', active_count;
  END IF;
END $$;

ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_status_check;
ALTER TABLE journeys ALTER COLUMN status SET NOT NULL;
ALTER TABLE journeys ADD CONSTRAINT journeys_status_check
  CHECK (status IN ('draft', 'active', 'archived'));

COMMIT;
