-- Rollback 025C1 — drop journeys_status_check and NOT NULL only.
-- Does NOT modify any journey row (no UPDATE / DELETE).

BEGIN;

DO $$
DECLARE
  constraint_def TEXT;
  status_nullable TEXT;
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  draft_count INTEGER;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'journeys'::regclass
    AND conname = 'journeys_status_check';

  IF constraint_def IS NULL THEN
    RAISE EXCEPTION 'ABORT 025C1 rollback: journeys_status_check does not exist';
  END IF;

  IF NOT (constraint_def ~* 'draft' AND constraint_def ~* 'active' AND constraint_def ~* 'archived' AND constraint_def ~* 'status') THEN
    RAISE EXCEPTION 'ABORT 025C1 rollback: journeys_status_check definition mismatch: %', constraint_def;
  END IF;

  SELECT is_nullable INTO status_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'journeys'
    AND column_name = 'status';

  IF status_nullable <> 'NO' THEN
    RAISE EXCEPTION 'ABORT 025C1 rollback: status column is not NOT NULL (is_nullable=%)', status_nullable;
  END IF;

  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  SELECT COUNT(*) INTO draft_count FROM journeys WHERE status = 'draft';

  IF total_count <> 83 OR active_count <> 24 OR archived_count <> 59 OR draft_count <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C1 rollback pre-check: unexpected status counts';
  END IF;
END $$;

ALTER TABLE journeys DROP CONSTRAINT journeys_status_check;
ALTER TABLE journeys ALTER COLUMN status DROP NOT NULL;

DO $$
DECLARE
  constraint_def TEXT;
  status_nullable TEXT;
  status_default TEXT;
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  draft_count INTEGER;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'journeys'::regclass
    AND conname = 'journeys_status_check';

  IF constraint_def IS NOT NULL THEN
    RAISE EXCEPTION 'ABORT 025C1 rollback post-check: journeys_status_check still exists';
  END IF;

  SELECT is_nullable, column_default INTO status_nullable, status_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'journeys'
    AND column_name = 'status';

  IF status_nullable <> 'YES' THEN
    RAISE EXCEPTION 'ABORT 025C1 rollback post-check: status.is_nullable is %', status_nullable;
  END IF;

  IF status_default IS NULL OR status_default !~* 'draft' THEN
    RAISE EXCEPTION 'ABORT 025C1 rollback post-check: status default must remain draft, found %', status_default;
  END IF;

  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  SELECT COUNT(*) INTO draft_count FROM journeys WHERE status = 'draft';

  IF total_count <> 83 OR active_count <> 24 OR archived_count <> 59 OR draft_count <> 0 THEN
    RAISE EXCEPTION 'ABORT 025C1 rollback post-check: row counts changed';
  END IF;
END $$;

COMMIT;
