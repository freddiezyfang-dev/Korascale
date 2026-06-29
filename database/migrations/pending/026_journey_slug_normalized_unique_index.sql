-- PR-J3C / 026: Journey normalized slug unique expression index ONLY
-- DO NOT EXECUTE until Production preflight ready=true and separately authorized.
--
-- SCOPE:
--   CREATE UNIQUE INDEX journeys_slug_normalized_unique_idx
--   ON journeys (LOWER(BTRIM(slug)))
--   WHERE slug IS NOT NULL AND BTRIM(slug) <> ''
--
-- DOES NOT modify any journey row (no UPDATE / DELETE)
-- DOES NOT add slug NOT NULL or canonical-format CHECK
--
-- ROLLBACK: 026_journey_slug_normalized_unique_index.rollback.sql

BEGIN;

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  draft_count INTEGER;
  normalized_dup_count INTEGER;
  active_missing_slug INTEGER;
  active_invalid_canonical INTEGER;
  target_index_exists BOOLEAN;
  target_index_def TEXT;
  expected_index_def TEXT := 'CREATE UNIQUE INDEX journeys_slug_normalized_unique_idx ON public.journeys USING btree (lower(btrim((slug)::text))) WHERE ((slug IS NOT NULL) AND (btrim((slug)::text) <> ''''::text))';
  fingerprint_before TEXT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  IF total_count <> 83 THEN
    RAISE EXCEPTION 'ABORT 026: expected 83 rows, found %', total_count;
  END IF;

  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  IF active_count <> 24 THEN
    RAISE EXCEPTION 'ABORT 026: expected 24 active, found %', active_count;
  END IF;

  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  IF archived_count <> 59 THEN
    RAISE EXCEPTION 'ABORT 026: expected 59 archived, found %', archived_count;
  END IF;

  SELECT COUNT(*) INTO draft_count FROM journeys WHERE status = 'draft';
  IF draft_count <> 0 THEN
    RAISE EXCEPTION 'ABORT 026: expected 0 draft, found %', draft_count;
  END IF;

  SELECT COUNT(*) INTO normalized_dup_count
  FROM (
    SELECT LOWER(BTRIM(slug)) AS normalized_slug
    FROM journeys
    WHERE slug IS NOT NULL
      AND BTRIM(slug) <> ''
    GROUP BY LOWER(BTRIM(slug))
    HAVING COUNT(*) > 1
  ) dup;
  IF normalized_dup_count <> 0 THEN
    RAISE EXCEPTION 'ABORT 026: % normalized duplicate slug groups', normalized_dup_count;
  END IF;

  SELECT COUNT(*) INTO active_missing_slug
  FROM journeys
  WHERE status = 'active'
    AND (slug IS NULL OR BTRIM(slug) = '');
  IF active_missing_slug <> 0 THEN
    RAISE EXCEPTION 'ABORT 026: % active journeys missing slug', active_missing_slug;
  END IF;

  SELECT COUNT(*) INTO active_invalid_canonical
  FROM journeys
  WHERE status = 'active'
    AND slug IS NOT NULL
    AND BTRIM(slug) <> ''
    AND (
      slug <> LOWER(BTRIM(slug))
      OR slug ~ '--'
      OR slug ~ '^-'
      OR slug ~ '-$'
      OR slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    );
  IF active_invalid_canonical <> 0 THEN
    RAISE EXCEPTION 'ABORT 026: % active journeys with non-canonical slug', active_invalid_canonical;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND indexname = 'journeys_slug_normalized_unique_idx'
  ) INTO target_index_exists;

  IF target_index_exists THEN
    SELECT indexdef INTO target_index_def
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND indexname = 'journeys_slug_normalized_unique_idx';

    IF lower(replace(target_index_def, ' ', '')) = lower(replace(expected_index_def, ' ', '')) THEN
      RAISE EXCEPTION 'J3C_ALREADY_APPLIED: journeys_slug_normalized_unique_idx already exists with expected definition';
    END IF;

    RAISE EXCEPTION 'ABORT 026: journeys_slug_normalized_unique_idx exists with unexpected definition: %', target_index_def;
  END IF;

  -- Plain UNIQUE(slug) may coexist; 026 adds normalized expression uniqueness.
  -- journeys_slug_key is an allowed existing constraint and must not cause abort.
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND indexname = 'journeys_slug_key'
  ) THEN
    RAISE WARNING '026 prep note: journeys_slug_key not found; Production baseline expects it';
  END IF;

  SELECT md5(string_agg(id || '|' || COALESCE(slug, '') || '|' || status || '|' || COALESCE(updated_at::text, ''), ';' ORDER BY id))
  INTO fingerprint_before
  FROM journeys;
END $$;

CREATE UNIQUE INDEX journeys_slug_normalized_unique_idx
ON journeys (LOWER(BTRIM(slug)))
WHERE slug IS NOT NULL
  AND BTRIM(slug) <> '';

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  draft_count INTEGER;
  target_index_exists BOOLEAN;
  index_is_unique BOOLEAN;
  index_def TEXT;
  fingerprint_after TEXT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  SELECT COUNT(*) INTO draft_count FROM journeys WHERE status = 'draft';

  IF total_count <> 83 OR active_count <> 24 OR archived_count <> 59 OR draft_count <> 0 THEN
    RAISE EXCEPTION 'ABORT 026 post-check: row counts changed (total %, active %, archived %, draft %)',
      total_count, active_count, archived_count, draft_count;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'journeys'
      AND indexname = 'journeys_slug_normalized_unique_idx'
  ) INTO target_index_exists;

  IF NOT target_index_exists THEN
    RAISE EXCEPTION 'ABORT 026 post-check: target index missing after CREATE';
  END IF;

  SELECT indisunique INTO index_is_unique
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  WHERE c.relname = 'journeys_slug_normalized_unique_idx';

  IF NOT COALESCE(index_is_unique, FALSE) THEN
    RAISE EXCEPTION 'ABORT 026 post-check: target index is not UNIQUE';
  END IF;

  SELECT indexdef INTO index_def
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'journeys'
    AND indexname = 'journeys_slug_normalized_unique_idx';

  IF index_def IS NULL
    OR index_def !~* 'lower\s*\(\s*btrim'
    OR index_def !~* 'slug is not null'
    OR index_def !~* 'btrim.*<>'
  THEN
    RAISE EXCEPTION 'ABORT 026 post-check: unexpected index definition: %', index_def;
  END IF;

  SELECT md5(string_agg(id || '|' || COALESCE(slug, '') || '|' || status || '|' || COALESCE(updated_at::text, ''), ';' ORDER BY id))
  INTO fingerprint_after
  FROM journeys;
END $$;

COMMIT;
