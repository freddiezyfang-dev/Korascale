-- PR-J2B4: Active Journey price_from backfill ONLY (24 active)
-- DO NOT EXECUTE until docs/audits/pr-j2b4-active-preview.csv is approved.
--
-- SCOPE: price_from for active manifest only (COALESCE from legacy price column)
-- DOES NOT modify: currency, price_basis, price_on_request, metadata, status, slug, JSONB
-- updated_at: maintained by update_journeys_updated_at trigger (001_create_tables.sql)
--
-- ROLLBACK: 025b4_active_journey_price_backfill.rollback.sql

BEGIN;

CREATE TEMP TABLE pr_j2b4_manifest (
  id uuid PRIMARY KEY,
  expected_slug text NOT NULL,
  price_from_proposed numeric NOT NULL
);

INSERT INTO pr_j2b4_manifest (id, expected_slug, price_from_proposed) VALUES
  ('37f6a3ae-f758-4449-83f5-e036c83f189d'::uuid, "badaling-great-wall-day-tour", 217),
  ('3468ea14-5f5e-40f6-9234-0fedf137189e'::uuid, "beijing-city-imperial-grandeur-urban-chic-1-day-tour", 192),
  ('8f3cdc36-f243-45da-b3b5-ecfba83929a6'::uuid, "beijing-cultural-highlights-and-iconic-sights-5-multi-days-tour", 1269),
  ('d5e5c0e9-6549-497a-97a3-4843621da5dc'::uuid, "beijing-to-mutianyu-great-wall-day-tour", 217),
  ('4d3bbbb8-3907-459b-af10-181ace7af8ec'::uuid, "beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour", 1938),
  ('12da1d30-0d8d-49df-b350-fe6880c56ab8'::uuid, "chaoshan-region-cultural-heritage-6-day-tour", 1000),
  ('535ac95b-f891-4e1c-916f-57028d7cb9e0'::uuid, "chengdu-chongqing-double-cities-6-day-tour", 1324),
  ('d48f2466-e466-4801-886c-cd28c6cc97c6'::uuid, "chongqing-highlights-magic-cityscape-day-tour", 203),
  ('9b0aefcc-3604-4d5c-bcc2-0b8ee80bb621'::uuid, "grand-china-highlands-nature-18-day-journey", 7914),
  ('eb9647df-6b38-46be-9920-9b80f27a9d2e'::uuid, "grand-china-highlights-16-day-multi-city-journey", 5648),
  ('4a22ea8c-15a2-4b39-b1d2-c7b3d3e32fd7'::uuid, "guangzhou-chaoshan-xiamen-cultural-loop-8-day-tour", 1000),
  ('d2be5f8a-75a3-453a-88e6-a13c8baa70d4'::uuid, "guilin-to-yangshuo-classic-7-day-tour", 1709),
  ('fe99d869-cb67-4ba7-8791-ecdfa38c2701'::uuid, "huangshan-to-huizhou-ancient-villages-6-day-tour", 1367),
  ('aa64bf32-d48f-4d5a-8bb7-e0e85353de5c'::uuid, "jiuzhaigou-cultural-adventure-4-day-tour", 1593),
  ('062f363b-eabb-493c-a15b-fe769db12ac5'::uuid, "jiuzhaigou-huanglong-by-high-speed-rail-3-day-tour", 786),
  ('28ae5874-2c8f-4f88-895e-09cb45c36872'::uuid, "leshan-buddha-emei-mountain-2-day-tour", 456),
  ('43afa024-0a6b-42a4-ab24-b582778ad587'::uuid, "lhasa-holy-lakes-classic-tibet-8-day-tour", 2828),
  ('645c7b01-6a18-4246-91b7-69f1311e9ebc'::uuid, "shanghai-suzhou-classic-dual-city-7-day-tour", 1873),
  ('743d03b7-82a9-4d72-9715-10ee9df9f231'::uuid, "siguniang-mountain-2-day-tour", 540),
  ('bfd44a68-c631-4e23-950f-f93a7e9231b5'::uuid, "xian-culture-mount-hua-in-depth-4-day-tour", 1231),
  ('06f935af-8ca1-45e0-bdc3-053b94907cf2'::uuid, "xian-terracotta-warriors-tang-paradise-night-tour", 186),
  ('1211dc54-4653-4bb1-a925-75fa38477919'::uuid, "xining-to-lhasa-mount-everest-tibet-grand-10-day-tour", 3137),
  ('ef87b1c3-d52a-4e8e-ade7-950e1bceadb3'::uuid, "yunnan-kunming-dali-lijiang-shangri-la-9-day-tour", 2866),
  ('08579f34-894b-4278-9608-a96f54d2b591'::uuid, "zhangjiajie-fenghuang-classic-7-day-dual-destination-tour", 1827);

CREATE TEMP TABLE pr_j2b4_snapshot AS
  SELECT j.id, j.slug, j.status, j.title, j.short_description, j.data,
         j.page_title, j.meta_description, j.hero_image_url, j.hero_image_alt, j.journey_type_slug,
         j.price, j.price_from, j.currency, j.price_basis, j.price_on_request, j.seo_complete
  FROM journeys j
  WHERE j.id IN (SELECT id FROM pr_j2b4_manifest);

CREATE TEMP TABLE pr_j2b4_external_slug_snapshot AS
  SELECT j.id, j.slug FROM journeys j
  WHERE j.id NOT IN (SELECT id FROM pr_j2b4_manifest);

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  manifest_count INTEGER;
  manifest_missing INTEGER;
  status_mismatch INTEGER;
  slug_mismatch INTEGER;
  invalid_proposed INTEGER;
  column_conflict INTEGER;
  legacy_price_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b4_manifest;

  IF total_count <> 83 THEN RAISE EXCEPTION 'ABORT: expected 83 journeys, found %', total_count; END IF;
  IF active_count <> 24 THEN RAISE EXCEPTION 'ABORT: expected 24 active, found %', active_count; END IF;
  IF archived_count <> 59 THEN RAISE EXCEPTION 'ABORT: expected 59 archived, found %', archived_count; END IF;
  IF manifest_count <> 24 THEN RAISE EXCEPTION 'ABORT: expected manifest count 24, found %', manifest_count; END IF;

  SELECT COUNT(*) INTO manifest_missing
  FROM pr_j2b4_manifest m LEFT JOIN journeys j ON j.id = m.id WHERE j.id IS NULL;
  IF manifest_missing <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest IDs missing', manifest_missing; END IF;

  SELECT COUNT(*) INTO status_mismatch
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id WHERE j.status <> 'active';
  IF status_mismatch <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows not active', status_mismatch; END IF;

  SELECT COUNT(*) INTO slug_mismatch
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id WHERE j.slug <> m.expected_slug;
  IF slug_mismatch <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest slug mismatch', slug_mismatch; END IF;

  SELECT COUNT(*) INTO invalid_proposed
  FROM pr_j2b4_manifest m WHERE m.price_from_proposed IS NULL OR m.price_from_proposed <= 0;
  IF invalid_proposed <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows have invalid proposed price_from', invalid_proposed; END IF;

  SELECT COUNT(*) INTO column_conflict
  FROM pr_j2b4_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE j.price_from IS NOT NULL AND j.price_from > 0 AND j.price_from IS DISTINCT FROM m.price_from_proposed;
  IF column_conflict <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows have price_from conflicts', column_conflict; END IF;

  SELECT COUNT(*) INTO legacy_price_missing
  FROM pr_j2b4_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE j.price IS NULL OR j.price <= 0;
  IF legacy_price_missing <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows missing legacy price', legacy_price_missing; END IF;
END $$;

DO $$
DECLARE
  updated_rows INTEGER;
  empty_after INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  slug_changed INTEGER;
  non_target_changed INTEGER;
  price_from_filled INTEGER;
BEGIN
  UPDATE journeys j
  SET
    price_from = CASE
      WHEN j.price_from IS NULL OR j.price_from = 0 THEN m.price_from_proposed
      ELSE j.price_from
    END
  FROM pr_j2b4_manifest m
  WHERE j.id = m.id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO empty_after
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id
  WHERE j.price_from IS NULL OR j.price_from <= 0;
  IF empty_after <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows still have empty price_from', empty_after; END IF;

  SELECT COUNT(*) INTO price_from_filled
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id
  WHERE j.price_from IS NOT NULL AND j.price_from > 0;
  IF price_from_filled <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24/24 filled price_from after update';
  END IF;

  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  IF active_count <> 24 OR archived_count <> 59 THEN
    RAISE EXCEPTION 'ABORT: status counts changed after price update';
  END IF;

  SELECT COUNT(*) INTO slug_changed
  FROM pr_j2b4_external_slug_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.slug IS DISTINCT FROM s.slug;
  IF slug_changed <> 0 THEN RAISE EXCEPTION 'ABORT: manifest-external slug changed'; END IF;

  SELECT COUNT(*) INTO non_target_changed
  FROM pr_j2b4_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.status IS DISTINCT FROM s.status
     OR j.slug IS DISTINCT FROM s.slug
     OR j.title IS DISTINCT FROM s.title
     OR j.short_description IS DISTINCT FROM s.short_description
     OR j.data IS DISTINCT FROM s.data
     OR j.page_title IS DISTINCT FROM s.page_title
     OR j.meta_description IS DISTINCT FROM s.meta_description
     OR j.hero_image_url IS DISTINCT FROM s.hero_image_url
     OR j.hero_image_alt IS DISTINCT FROM s.hero_image_alt
     OR j.journey_type_slug IS DISTINCT FROM s.journey_type_slug
     OR j.currency IS DISTINCT FROM s.currency
     OR j.price_basis IS DISTINCT FROM s.price_basis
     OR j.price_on_request IS DISTINCT FROM s.price_on_request
     OR j.seo_complete IS DISTINCT FROM s.seo_complete
     OR j.price IS DISTINCT FROM s.price;
  IF non_target_changed <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows changed non-target fields', non_target_changed;
  END IF;
END $$;

COMMIT;
