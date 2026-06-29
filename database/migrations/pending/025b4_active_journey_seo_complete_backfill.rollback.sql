-- Rollback 025B4 — restore ONLY the 24 active manifest seo_complete values to NULL.
-- Does NOT modify manifest-external journeys.

BEGIN;

CREATE TEMP TABLE pr_j2b4_rollback (
  id uuid PRIMARY KEY,
  old_seo_complete boolean
);

INSERT INTO pr_j2b4_rollback (id, old_seo_complete) VALUES
  ('37f6a3ae-f758-4449-83f5-e036c83f189d'::uuid, NULL),
  ('3468ea14-5f5e-40f6-9234-0fedf137189e'::uuid, NULL),
  ('8f3cdc36-f243-45da-b3b5-ecfba83929a6'::uuid, NULL),
  ('d5e5c0e9-6549-497a-97a3-4843621da5dc'::uuid, NULL),
  ('4d3bbbb8-3907-459b-af10-181ace7af8ec'::uuid, NULL),
  ('12da1d30-0d8d-49df-b350-fe6880c56ab8'::uuid, NULL),
  ('535ac95b-f891-4e1c-916f-57028d7cb9e0'::uuid, NULL),
  ('d48f2466-e466-4801-886c-cd28c6cc97c6'::uuid, NULL),
  ('9b0aefcc-3604-4d5c-bcc2-0b8ee80bb621'::uuid, NULL),
  ('eb9647df-6b38-46be-9920-9b80f27a9d2e'::uuid, NULL),
  ('4a22ea8c-15a2-4b39-b1d2-c7b3d3e32fd7'::uuid, NULL),
  ('d2be5f8a-75a3-453a-88e6-a13c8baa70d4'::uuid, NULL),
  ('fe99d869-cb67-4ba7-8791-ecdfa38c2701'::uuid, NULL),
  ('aa64bf32-d48f-4d5a-8bb7-e0e85353de5c'::uuid, NULL),
  ('062f363b-eabb-493c-a15b-fe769db12ac5'::uuid, NULL),
  ('28ae5874-2c8f-4f88-895e-09cb45c36872'::uuid, NULL),
  ('43afa024-0a6b-42a4-ab24-b582778ad587'::uuid, NULL),
  ('645c7b01-6a18-4246-91b7-69f1311e9ebc'::uuid, NULL),
  ('743d03b7-82a9-4d72-9715-10ee9df9f231'::uuid, NULL),
  ('bfd44a68-c631-4e23-950f-f93a7e9231b5'::uuid, NULL),
  ('06f935af-8ca1-45e0-bdc3-053b94907cf2'::uuid, NULL),
  ('1211dc54-4653-4bb1-a925-75fa38477919'::uuid, NULL),
  ('ef87b1c3-d52a-4e8e-ade7-950e1bceadb3'::uuid, NULL),
  ('08579f34-894b-4278-9608-a96f54d2b591'::uuid, NULL);

CREATE TEMP TABLE pr_j2b4_external_slug_snapshot AS
  SELECT j.id, j.slug FROM journeys j
  WHERE j.id NOT IN (SELECT id FROM pr_j2b4_rollback);

DO $$
DECLARE
  manifest_count INTEGER;
  admin_edit_count INTEGER;
  updated_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b4_rollback;
  IF manifest_count <> 24 THEN RAISE EXCEPTION 'ABORT: rollback manifest count %', manifest_count; END IF;

  SELECT COUNT(*) INTO admin_edit_count
  FROM pr_j2b4_rollback r
  JOIN journeys j ON j.id = r.id
  WHERE j.seo_complete IS DISTINCT FROM TRUE;
  IF admin_edit_count <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows changed since B4 — rollback refused', admin_edit_count;
  END IF;

  UPDATE journeys j
  SET seo_complete = r.old_seo_complete
  FROM pr_j2b4_rollback r
  WHERE j.id = r.id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 24 THEN RAISE EXCEPTION 'ABORT: expected 24 rollback rows, found %', updated_rows; END IF;
END $$;

COMMIT;
