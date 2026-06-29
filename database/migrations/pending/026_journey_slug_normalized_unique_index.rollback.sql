-- PR-J3C / 026 rollback: drop journeys_slug_normalized_unique_idx ONLY
-- DOES NOT modify any journey row (no UPDATE / DELETE)

BEGIN;

DO $$
DECLARE
  target_index_exists BOOLEAN;
  index_is_unique BOOLEAN;
  index_def TEXT;
  expected_fragment TEXT := 'lower(btrim';
  fingerprint_before TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND indexname = 'journeys_slug_normalized_unique_idx'
  ) INTO target_index_exists;

  IF NOT target_index_exists THEN
    RAISE EXCEPTION 'ABORT 026 rollback: journeys_slug_normalized_unique_idx does not exist';
  END IF;

  SELECT indisunique INTO index_is_unique
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  WHERE c.relname = 'journeys_slug_normalized_unique_idx';

  IF NOT COALESCE(index_is_unique, FALSE) THEN
    RAISE EXCEPTION 'ABORT 026 rollback: target index is not UNIQUE';
  END IF;

  SELECT indexdef INTO index_def
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'journeys'
    AND indexname = 'journeys_slug_normalized_unique_idx';

  IF index_def IS NULL OR index_def !~* expected_fragment OR index_def !~* 'slug is not null' THEN
    RAISE EXCEPTION 'ABORT 026 rollback: unexpected index definition: %', index_def;
  END IF;

  SELECT md5(string_agg(id || '|' || COALESCE(slug, '') || '|' || status || '|' || COALESCE(updated_at::text, ''), ';' ORDER BY id))
  INTO fingerprint_before
  FROM journeys;
END $$;

DROP INDEX journeys_slug_normalized_unique_idx;

DO $$
DECLARE
  target_index_exists BOOLEAN;
  slug_key_exists BOOLEAN;
  total_count INTEGER;
  fingerprint_after TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND indexname = 'journeys_slug_normalized_unique_idx'
  ) INTO target_index_exists;

  IF target_index_exists THEN
    RAISE EXCEPTION 'ABORT 026 rollback post-check: target index still exists';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND indexname = 'journeys_slug_key'
  ) INTO slug_key_exists;

  IF NOT slug_key_exists THEN
    RAISE EXCEPTION 'ABORT 026 rollback post-check: journeys_slug_key must remain after rollback';
  END IF;

  SELECT COUNT(*) INTO total_count FROM journeys;
  IF total_count <> 83 THEN
    RAISE EXCEPTION 'ABORT 026 rollback post-check: row count changed to %', total_count;
  END IF;

  SELECT md5(string_agg(id || '|' || COALESCE(slug, '') || '|' || status || '|' || COALESCE(updated_at::text, ''), ';' ORDER BY id))
  INTO fingerprint_after
  FROM journeys;
END $$;

COMMIT;
