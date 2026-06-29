-- Rollback 025B2 — restore ONLY the approved 4 manifest slugs to oldSlug.
-- Does NOT modify manifest-external journeys.
-- Uses exact ID + new/old mapping from prJ2b2SlugManifest.ts.

BEGIN;

CREATE TEMP TABLE pr_j2b2_manifest (
  id uuid PRIMARY KEY,
  old_slug text NOT NULL,
  new_slug text NOT NULL
);

INSERT INTO pr_j2b2_manifest (id, old_slug, new_slug) VALUES
  ('4d3bbbb8-3907-459b-af10-181ace7af8ec'::uuid, 'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-', 'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour'),
  ('f699fa20-3732-4bd0-8379-974e9a35420c'::uuid, 'dali-cangshan-mountain-with-chongsheng-three-pagodas-day-tour-', 'dali-cangshan-mountain-with-chongsheng-three-pagodas-day-tour'),
  ('1be89fa2-9420-45b5-bc61-6b9f1c43a43b'::uuid, 'lugu-lake-with-mosuo-culture-experience-2-day-tour-', 'lugu-lake-with-mosuo-culture-experience-2-day-tour'),
  ('d8958be5-72fd-4dfe-acd9-dfad00b1f928'::uuid, 'urumqi-to-ili-grassland-nature-loop-tour-7-day-', 'urumqi-to-ili-grassland-nature-loop-tour-7-day');

CREATE TEMP TABLE pr_j2b2_external_slug_snapshot AS
  SELECT j.id, j.slug
  FROM journeys j
  WHERE j.id NOT IN (SELECT id FROM pr_j2b2_manifest);

DO $$
DECLARE
  manifest_count INTEGER;
  slug_mismatch INTEGER;
  old_slug_occupied INTEGER;
  updated_rows INTEGER;
  external_changed INTEGER;
BEGIN
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b2_manifest;
  IF manifest_count <> 4 THEN
    RAISE EXCEPTION 'ABORT rollback: manifest count must be 4';
  END IF;

  SELECT COUNT(*) INTO slug_mismatch
  FROM pr_j2b2_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE j.slug <> m.new_slug;
  IF slug_mismatch <> 0 THEN
    RAISE EXCEPTION 'ABORT rollback: % manifest rows not at newSlug', slug_mismatch;
  END IF;

  SELECT COUNT(*) INTO old_slug_occupied
  FROM pr_j2b2_manifest m
  JOIN journeys j ON j.slug = m.old_slug AND j.id <> m.id;
  IF old_slug_occupied <> 0 THEN
    RAISE EXCEPTION 'ABORT rollback: oldSlug occupied by non-manifest row';
  END IF;

  UPDATE journeys j
  SET slug = m.old_slug
  FROM pr_j2b2_manifest m
  WHERE j.id = m.id
    AND j.slug = m.new_slug;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 4 THEN
    RAISE EXCEPTION 'ABORT rollback: expected 4 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO external_changed
  FROM pr_j2b2_external_slug_snapshot s
  JOIN journeys j ON j.id = s.id
  WHERE j.slug IS DISTINCT FROM s.slug;
  IF external_changed <> 0 THEN
    RAISE EXCEPTION 'ABORT rollback: manifest-external slug changed';
  END IF;
END $$;

COMMIT;
