-- Rollback 025B1 — restore ONLY the approved 59 manifest IDs to inactive.
-- Does NOT touch archived rows created after 025B1 by normal business writes.
-- Does NOT require global archived=0 or total=83.
-- Does NOT modify slug, title, JSONB, or other columns.
--
-- PREREQUISITE: 025B1 completed for manifest IDs (all 59 currently archived).

BEGIN;

CREATE TEMP TABLE pr_j2b1_manifest (id uuid PRIMARY KEY);
INSERT INTO pr_j2b1_manifest (id) VALUES
  ('e468b842-7c59-4258-8d56-8b585566be82'::uuid),
  ('68262f66-90f9-4f2f-822e-51865bde7967'::uuid),
  ('3ec32480-b591-470f-bd10-9714c84588ef'::uuid),
  ('f0f123a2-0413-4050-99d8-46f2b0cd8ec9'::uuid),
  ('77f512fd-41df-4eee-8d35-4c33623aa637'::uuid),
  ('64ad1143-2c99-4444-a735-195b5c2da099'::uuid),
  ('6cbaf3e2-63ef-4d78-b1cb-1ed4ef635d13'::uuid),
  ('ce8fcb42-c0a8-4925-b4e0-540cac40b7e1'::uuid),
  ('1a95095c-9f0d-4b6d-a30e-8084a7277304'::uuid),
  ('fd6b7c12-c11d-4ae4-9a84-d451bc2fe372'::uuid),
  ('f699fa20-3732-4bd0-8379-974e9a35420c'::uuid),
  ('87788afb-8344-4dbe-92e9-4ad41f660cd5'::uuid),
  ('fd744425-8680-496a-aa47-74a07ff0f5e3'::uuid),
  ('1efb5a6e-8b7e-43ca-9dde-9e6587bee8ba'::uuid),
  ('490aea2d-6cff-47f4-a9fa-5131ff160d06'::uuid),
  ('2351fc82-887f-4b37-bad7-2c466764e0e0'::uuid),
  ('1654f129-046a-4daf-b595-a2fd00f13cc3'::uuid),
  ('cf231b9a-9022-477f-a583-04e5711a659c'::uuid),
  ('a1d410d7-a3c1-4333-bc5f-52befea2acd2'::uuid),
  ('6c8279a0-ecad-4b80-9ad0-069b104c407d'::uuid),
  ('9c0864b9-a79d-46c4-800c-ddc4dbab54d5'::uuid),
  ('7e8e641d-4446-490c-9b94-ce19c8a94912'::uuid),
  ('24ded7e2-c63c-4625-b5f9-5f383583633f'::uuid),
  ('591a7e54-4cce-4bc2-940a-338b38b79e2d'::uuid),
  ('20cb64d6-c2e1-4197-8e78-08e6236d5706'::uuid),
  ('a624b439-0fed-495c-bebc-4bd9823a47ff'::uuid),
  ('68b2dbbd-ed87-4cd4-b420-6e282aa2afe6'::uuid),
  ('c1599bf8-9d1a-4494-8401-8c7eff563838'::uuid),
  ('0f9d936a-6cd6-443d-a7c8-b2d317a75d6c'::uuid),
  ('0389826c-8d82-4c3b-b612-2b44c0b2f781'::uuid),
  ('b4c761e4-b3b1-4568-b173-3ff9ece44388'::uuid),
  ('1be89fa2-9420-45b5-bc61-6b9f1c43a43b'::uuid),
  ('033eb46d-8326-4d1d-8d89-a0d690bc59e9'::uuid),
  ('22567336-9280-46a9-9309-73f1dc45bf01'::uuid),
  ('ba5e65c7-23b9-4be6-87fb-886a09de2947'::uuid),
  ('fda690c8-6884-4006-a982-305d20426d00'::uuid),
  ('1f4c1481-bb45-4ac7-acd0-4aba2550cea1'::uuid),
  ('7b370612-01bb-4812-89c9-0c25a3bb9f70'::uuid),
  ('926c8370-1bea-4470-bdb7-f882ff318cc7'::uuid),
  ('991d0029-2312-4301-bb1e-51aa586c122c'::uuid),
  ('d3485450-4186-468d-803d-f6e87fc48cf5'::uuid),
  ('5d2baed2-a662-4fe5-8b49-8d8ee0f16483'::uuid),
  ('8d704e28-7e8c-4134-aa7e-4fe1ab76ce71'::uuid),
  ('5cfec52f-1a4f-40a5-af90-29c471461d7a'::uuid),
  ('d8958be5-72fd-4dfe-acd9-dfad00b1f928'::uuid),
  ('9cef0680-e565-4507-bf70-24ae7ff50952'::uuid),
  ('b782a27c-e4c1-4e1b-9a4f-7d01cf71e385'::uuid),
  ('6ab8d247-4eae-47dc-b344-17ed2352dd1c'::uuid),
  ('ae4e5fd0-f467-4be2-858c-2ee30242b554'::uuid),
  ('bbec6b13-4f66-443b-bfde-b36172660e0d'::uuid),
  ('2952bb01-6cb2-452e-b1c9-ee25c19b2dcb'::uuid),
  ('8a6bf407-eb4e-4864-8e1d-091ab007ef59'::uuid),
  ('140ce811-9a74-432d-be97-8f7353093a34'::uuid),
  ('9d4bfc58-201f-40aa-9d95-9101ad4c2f08'::uuid),
  ('dabc4159-c42e-438e-a1eb-6abd957c9104'::uuid),
  ('ff1ed0c8-1ea1-4ca7-9de2-707844381a68'::uuid),
  ('1625c038-3464-4a7a-b5d9-c345f195dd74'::uuid),
  ('ff987022-70a1-48c7-bed4-3dd33be5f105'::uuid),
  ('31f789ed-e6c2-4acb-a7d3-0fd07937acba'::uuid);

CREATE TEMP TABLE pr_j2b1_active_snapshot AS
  SELECT id FROM journeys WHERE status = 'active' ORDER BY id;

CREATE TEMP TABLE pr_j2b1_non_manifest_archived_before AS
  SELECT j.id
  FROM journeys j
  WHERE j.status = 'archived'
    AND j.id NOT IN (SELECT id FROM pr_j2b1_manifest)
  ORDER BY j.id;

DO $$
DECLARE
  manifest_count INTEGER;
  manifest_missing INTEGER;
  manifest_not_archived INTEGER;
  manifest_active INTEGER;
  non_manifest_archived_before INTEGER;
  non_manifest_archived_before_checksum TEXT;
  non_manifest_archived_after INTEGER;
  non_manifest_archived_after_checksum TEXT;
  active_before_checksum TEXT;
  active_after_checksum TEXT;
  updated_rows INTEGER;
  manifest_inactive_after INTEGER;
BEGIN
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b1_manifest;
  IF manifest_count <> 59 THEN
    RAISE EXCEPTION 'ABORT rollback: manifest count must be 59, found %', manifest_count;
  END IF;

  SELECT COUNT(*) INTO manifest_missing
  FROM pr_j2b1_manifest m
  LEFT JOIN journeys j ON j.id = m.id
  WHERE j.id IS NULL;

  IF manifest_missing <> 0 THEN
    RAISE EXCEPTION 'ABORT rollback: % manifest IDs missing from journeys', manifest_missing;
  END IF;

  SELECT COUNT(*) INTO manifest_not_archived
  FROM journeys j
  INNER JOIN pr_j2b1_manifest m ON j.id = m.id
  WHERE j.status <> 'archived';

  IF manifest_not_archived <> 0 THEN
    RAISE EXCEPTION 'ABORT rollback: % manifest IDs are not archived', manifest_not_archived;
  END IF;

  SELECT COUNT(*) INTO manifest_active
  FROM journeys j
  INNER JOIN pr_j2b1_manifest m ON j.id = m.id
  WHERE j.status = 'active';

  IF manifest_active <> 0 THEN
    RAISE EXCEPTION 'ABORT rollback: manifest contains % active journeys', manifest_active;
  END IF;

  SELECT COUNT(*) INTO non_manifest_archived_before
  FROM pr_j2b1_non_manifest_archived_before;

  SELECT COALESCE(string_agg(id::text, ',' ORDER BY id), '')
    INTO non_manifest_archived_before_checksum
  FROM pr_j2b1_non_manifest_archived_before;

  SELECT COALESCE(string_agg(id::text, ',' ORDER BY id), '')
    INTO active_before_checksum
  FROM pr_j2b1_active_snapshot;

  UPDATE journeys j
  SET status = 'inactive'
  FROM pr_j2b1_manifest m
  WHERE j.id = m.id
    AND j.status = 'archived';

  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows <> 59 THEN
    RAISE EXCEPTION 'ABORT rollback: expected 59 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO manifest_inactive_after
  FROM journeys j
  INNER JOIN pr_j2b1_manifest m ON j.id = m.id
  WHERE j.status = 'inactive';

  IF manifest_inactive_after <> 59 THEN
    RAISE EXCEPTION 'ABORT rollback: expected 59 manifest rows inactive, found %', manifest_inactive_after;
  END IF;

  SELECT COUNT(*) INTO non_manifest_archived_after
  FROM journeys j
  WHERE j.status = 'archived'
    AND j.id NOT IN (SELECT id FROM pr_j2b1_manifest);

  IF non_manifest_archived_after <> non_manifest_archived_before THEN
    RAISE EXCEPTION 'ABORT rollback: non-manifest archived count changed (% -> %)',
      non_manifest_archived_before, non_manifest_archived_after;
  END IF;

  SELECT COALESCE(string_agg(j.id::text, ',' ORDER BY j.id), '')
    INTO non_manifest_archived_after_checksum
  FROM journeys j
  WHERE j.status = 'archived'
    AND j.id NOT IN (SELECT id FROM pr_j2b1_manifest);

  IF non_manifest_archived_after_checksum IS DISTINCT FROM non_manifest_archived_before_checksum THEN
    RAISE EXCEPTION 'ABORT rollback: non-manifest archived ID set changed';
  END IF;

  SELECT COALESCE(string_agg(j.id::text, ',' ORDER BY j.id), '')
    INTO active_after_checksum
  FROM journeys j
  WHERE j.status = 'active';

  IF active_after_checksum IS DISTINCT FROM active_before_checksum THEN
    RAISE EXCEPTION 'ABORT rollback: active journey ID set changed';
  END IF;
END $$;

COMMIT;
