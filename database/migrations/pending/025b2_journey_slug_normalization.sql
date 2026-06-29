-- PR-J2B2: Slug normalization ONLY (4 trailing-hyphen journeys)
-- DO NOT EXECUTE until docs/audits/pr-j2b2-slug-preview.csv is approved.
--
-- SCOPE: slug column ONLY for approved manifest (see prJ2b2SlugManifest.ts)
-- DOES NOT modify: status, title, JSONB, metadata, taxonomy, price, seo_complete
-- updated_at: maintained by update_journeys_updated_at trigger (001_create_tables.sql)
--
-- ROLLBACK: 025b2_journey_slug_normalization.rollback.sql

BEGIN;

CREATE TEMP TABLE pr_j2b2_manifest (
  id uuid PRIMARY KEY,
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  expected_status text NOT NULL
);

INSERT INTO pr_j2b2_manifest (id, old_slug, new_slug, expected_status) VALUES
  ('4d3bbbb8-3907-459b-af10-181ace7af8ec'::uuid, 'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-', 'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour', 'active'),
  ('f699fa20-3732-4bd0-8379-974e9a35420c'::uuid, 'dali-cangshan-mountain-with-chongsheng-three-pagodas-day-tour-', 'dali-cangshan-mountain-with-chongsheng-three-pagodas-day-tour', 'archived'),
  ('1be89fa2-9420-45b5-bc61-6b9f1c43a43b'::uuid, 'lugu-lake-with-mosuo-culture-experience-2-day-tour-', 'lugu-lake-with-mosuo-culture-experience-2-day-tour', 'archived'),
  ('d8958be5-72fd-4dfe-acd9-dfad00b1f928'::uuid, 'urumqi-to-ili-grassland-nature-loop-tour-7-day-', 'urumqi-to-ili-grassland-nature-loop-tour-7-day', 'archived');

CREATE TEMP TABLE pr_j2b2_snapshot AS
  SELECT j.id, j.slug, j.status, j.title, j.journey_type, j.journey_type_slug,
         j.page_title, j.meta_description, j.price_from, j.seo_complete
  FROM journeys j
  WHERE j.id IN (SELECT id FROM pr_j2b2_manifest);

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  manifest_count INTEGER;
  manifest_missing INTEGER;
  slug_mismatch INTEGER;
  status_mismatch INTEGER;
  new_slug_collision INTEGER;
  active_manifest INTEGER;
  archived_manifest INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b2_manifest;

  IF total_count <> 83 THEN
    RAISE EXCEPTION 'ABORT: expected 83 journeys, found %', total_count;
  END IF;
  IF active_count <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24 active, found %', active_count;
  END IF;
  IF archived_count <> 59 THEN
    RAISE EXCEPTION 'ABORT: expected 59 archived, found %', archived_count;
  END IF;
  IF manifest_count <> 4 THEN
    RAISE EXCEPTION 'ABORT: expected manifest count 4, found %', manifest_count;
  END IF;

  SELECT COUNT(*) INTO manifest_missing
  FROM pr_j2b2_manifest m
  LEFT JOIN journeys j ON j.id = m.id
  WHERE j.id IS NULL;
  IF manifest_missing <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest IDs missing', manifest_missing;
  END IF;

  SELECT COUNT(*) INTO slug_mismatch
  FROM pr_j2b2_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE j.slug <> m.old_slug;
  IF slug_mismatch <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows slug mismatch', slug_mismatch;
  END IF;

  SELECT COUNT(*) INTO status_mismatch
  FROM pr_j2b2_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE j.status <> m.expected_status;
  IF status_mismatch <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows status mismatch', status_mismatch;
  END IF;

  SELECT COUNT(*) INTO new_slug_collision
  FROM pr_j2b2_manifest m
  JOIN journeys j ON j.slug = m.new_slug AND j.id <> m.id;
  IF new_slug_collision <> 0 THEN
    RAISE EXCEPTION 'ABORT: % newSlug collisions detected', new_slug_collision;
  END IF;

  SELECT COUNT(*) INTO active_manifest
  FROM pr_j2b2_manifest WHERE expected_status = 'active';
  SELECT COUNT(*) INTO archived_manifest
  FROM pr_j2b2_manifest WHERE expected_status = 'archived';
  IF active_manifest <> 1 OR archived_manifest <> 3 THEN
    RAISE EXCEPTION 'ABORT: expected 1 active + 3 archived in manifest';
  END IF;
END $$;

DO $$
DECLARE
  updated_rows INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  total_count INTEGER;
  slug_mismatch INTEGER;
  new_slug_collision INTEGER;
  non_slug_changed INTEGER;
BEGIN
  UPDATE journeys j
  SET slug = m.new_slug
  FROM pr_j2b2_manifest m
  WHERE j.id = m.id
    AND j.slug = m.old_slug;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 4 THEN
    RAISE EXCEPTION 'ABORT: expected 4 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO slug_mismatch
  FROM pr_j2b2_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE j.slug <> m.new_slug;
  IF slug_mismatch <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows not at newSlug after update', slug_mismatch;
  END IF;

  SELECT COUNT(*) INTO new_slug_collision
  FROM (
    SELECT slug FROM journeys GROUP BY slug HAVING COUNT(*) > 1
  ) dups;
  IF new_slug_collision <> 0 THEN
    RAISE EXCEPTION 'ABORT: slug collision after update';
  END IF;

  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  IF total_count <> 83 OR active_count <> 24 OR archived_count <> 59 THEN
    RAISE EXCEPTION 'ABORT: status counts changed after slug update';
  END IF;

  SELECT COUNT(*) INTO non_slug_changed
  FROM pr_j2b2_snapshot s
  JOIN journeys j ON j.id = s.id
  WHERE j.status IS DISTINCT FROM s.status
     OR j.title IS DISTINCT FROM s.title
     OR j.journey_type IS DISTINCT FROM s.journey_type
     OR j.journey_type_slug IS DISTINCT FROM s.journey_type_slug
     OR j.page_title IS DISTINCT FROM s.page_title
     OR j.meta_description IS DISTINCT FROM s.meta_description
     OR j.price_from IS DISTINCT FROM s.price_from
     OR j.seo_complete IS DISTINCT FROM s.seo_complete;
  IF non_slug_changed <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows changed non-slug fields', non_slug_changed;
  END IF;
END $$;

COMMIT;
