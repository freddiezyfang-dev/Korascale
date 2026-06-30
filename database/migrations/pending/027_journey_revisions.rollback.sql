-- PR-J5A rollback: remove journey_revisions objects only when safe.

DO $$
DECLARE
  row_count BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'journey_revisions'
  ) THEN
    RAISE NOTICE 'journey_revisions table does not exist — nothing to rollback';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO row_count FROM journey_revisions;

  IF row_count > 0 THEN
    RAISE EXCEPTION 'Abort rollback: journey_revisions contains % row(s). Manual review required.', row_count;
  END IF;

  DROP TRIGGER IF EXISTS update_journey_revisions_updated_at ON journey_revisions;
  DROP TABLE IF EXISTS journey_revisions;
END
$$;
