-- PR-J2C2 / 025C1: Journey status constraints ONLY
-- DO NOT EXECUTE until Production preflight ready=true and separately authorized.
--
-- SCOPE:
--   - status NOT NULL
--   - journeys_status_check CHECK (draft, active, archived)
-- DOES NOT modify any journey row (no UPDATE / DELETE)
-- DOES NOT add journey_type_slug, currency, price_basis, or metadata constraints
--
-- ROLLBACK: 025c1_journey_status_constraints.rollback.sql

BEGIN;

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  draft_count INTEGER;
  inactive_count INTEGER;
  null_status INTEGER;
  illegal_status INTEGER;
  status_default TEXT;
  status_nullable TEXT;
  constraint_def TEXT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  IF total_count <> 83 THEN
    RAISE EXCEPTION 'ABORT 025C1: expected 83 rows, found %', total_count;
  END IF;

  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  IF active_count <> 24 THEN
    RAISE EXCEPTION 'ABORT 025C1: expected 24 active, found %', active_count;
  END IF;

  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  IF archived_count <> 59 THEN
    RAISE EXCEPTION 'ABORT 025C1: expected 59 archived, found %', archived_count;
  END IF;

  SELECT COUNT(*) INTO draft_count FROM journeys WHERE status = 'draft';
  IF draft_count <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C1: expected 0 draft, found %', draft_count;
  END IF;

  SELECT COUNT(*) INTO inactive_count FROM journeys WHERE status = 'inactive';
  IF inactive_count <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C1: expected 0 inactive, found %', inactive_count;
  END IF;

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

  SELECT column_default INTO status_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'journeys'
    AND column_name = 'status';

  IF status_default IS NULL OR status_default !~* 'draft' THEN
    RAISE EXCEPTION 'ABORT 025C1: status default must remain draft, found %', status_default;
  END IF;

  SELECT is_nullable INTO status_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'journeys'
    AND column_name = 'status';

  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'journeys'::regclass
    AND conname = 'journeys_status_check';

  IF constraint_def IS NOT NULL THEN
    IF constraint_def ~* 'draft' AND constraint_def ~* 'active' AND constraint_def ~* 'archived' AND constraint_def ~* 'status' THEN
      IF status_nullable = 'NO' THEN
        RAISE EXCEPTION '025C1_ALREADY_APPLIED: journeys_status_check and NOT NULL already in place';
      END IF;
      RAISE EXCEPTION 'ABORT 025C1: journeys_status_check exists but status is still nullable';
    ELSE
      RAISE EXCEPTION 'ABORT 025C1: journeys_status_check exists with unexpected definition: %', constraint_def;
    END IF;
  END IF;

  IF status_nullable = 'NO' THEN
    RAISE EXCEPTION 'ABORT 025C1: status is NOT NULL but journeys_status_check is missing';
  END IF;
END $$;

ALTER TABLE journeys ALTER COLUMN status SET NOT NULL;

ALTER TABLE journeys ADD CONSTRAINT journeys_status_check
  CHECK (status IN ('draft', 'active', 'archived'));

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  draft_count INTEGER;
  status_nullable TEXT;
  constraint_def TEXT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  SELECT COUNT(*) INTO draft_count FROM journeys WHERE status = 'draft';

  IF total_count <> 83 OR active_count <> 24 OR archived_count <> 59 OR draft_count <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C1 post-check: row counts changed (total %, active %, archived %, draft %)',
      total_count, active_count, archived_count, draft_count;
  END IF;

  SELECT is_nullable INTO status_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'journeys'
    AND column_name = 'status';

  IF status_nullable <> 'NO' THEN
    RAISE EXCEPTION 'ABORT 025C1 post-check: status.is_nullable is %', status_nullable;
  END IF;

  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'journeys'::regclass
    AND conname = 'journeys_status_check';

  IF constraint_def IS NULL
    OR NOT (constraint_def ~* 'draft' AND constraint_def ~* 'active' AND constraint_def ~* 'archived' AND constraint_def ~* 'status')
  THEN
    RAISE EXCEPTION 'ABORT 025C1 post-check: journeys_status_check missing or invalid: %', constraint_def;
  END IF;
END $$;

COMMIT;
