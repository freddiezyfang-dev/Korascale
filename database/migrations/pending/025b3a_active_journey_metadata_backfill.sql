-- PR-J2B3A: Active Journey metadata & taxonomy backfill ONLY (24 active)
-- DO NOT EXECUTE until docs/audits/pr-j2b3a-active-preview.csv is approved.
--
-- SCOPE: page_title, meta_description, hero_image_url, journey_type_slug for active manifest only
-- DOES NOT modify: status, slug, title, short_description, JSONB, hero_image_alt, price, seo_complete
-- updated_at: maintained by update_journeys_updated_at trigger (001_create_tables.sql)
--
-- ROLLBACK: 025b3a_active_journey_metadata_backfill.rollback.sql

BEGIN;

CREATE TEMP TABLE pr_j2b3a_manifest (
  id uuid PRIMARY KEY,
  expected_slug text NOT NULL,
  page_title_proposed text NOT NULL,
  meta_description_proposed text NOT NULL,
  hero_image_url_proposed text NOT NULL,
  journey_type_slug_proposed text NOT NULL
);

INSERT INTO pr_j2b3a_manifest (id, expected_slug, page_title_proposed, meta_description_proposed, hero_image_url_proposed, journey_type_slug_proposed) VALUES
  ('37f6a3ae-f758-4449-83f5-e036c83f189d'::uuid, 'badaling-great-wall-day-tour', 'Badaling Great Wall Day Tour', 'Beijing begins, Beijing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771747900791-%E4%B8%BB%E5%9B%BE-%E5%85%AB%E8%BE%BE%E5%B2%AD%E9%95%BF%E5%9F%8E-%E6%A8%AA%E5%9B%BE-I5XJSRFtV6au0gTCTXw6TWd7UoT4fh.jpg', 'explore-together'),
  ('3468ea14-5f5e-40f6-9234-0fedf137189e'::uuid, 'beijing-city-imperial-grandeur-urban-chic-1-day-tour', 'Beijing City Imperial Grandeur & Urban Chic 1-Day Tour', 'Navigating the Monumental Scale of Dynastic History and the Avant-Garde Ambition of a Modern Metropolis.', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771749910450-%E4%B8%BB%E5%9B%BE-%E6%95%85%E5%AE%AB-%E6%A8%AA%E5%9B%BE-v6JynohkI6UiYbNv4kXh63fUsV6p7N.jpeg', 'explore-together'),
  ('8f3cdc36-f243-45da-b3b5-ecfba83929a6'::uuid, 'beijing-cultural-highlights-and-iconic-sights-5-multi-days-tour', 'Beijing Cultural Highlights, and Iconic Sights  5 Multi-Days Tour', 'Beijing begins, Beijing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1766842579054-%E4%B8%BB%E5%9B%BE-%E6%A8%AA%E5%9B%BE-hjLT44tBhGSiUk0G8wk7chpW0Yu8Iy.jpeg', 'deep-discovery'),
  ('d5e5c0e9-6549-497a-97a3-4843621da5dc'::uuid, 'beijing-to-mutianyu-great-wall-day-tour', 'Beijing to Mutianyu Great Wall Day Tour', 'Beijing begins, Beijing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771688549942-%E4%B8%BB%E5%9B%BE-%E6%85%95%E7%94%B0%E5%B3%AA%E9%95%BF%E5%9F%8E-%E6%A8%AA%E5%9B%BE-fwCKaJ5Q0zNkoOew79SY9tN8SXCMSe.jpg', 'explore-together'),
  ('4d3bbbb8-3907-459b-af10-181ace7af8ec'::uuid, 'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour', 'Beijing to Shanxi Ancient Architecture with Black Myth: Wukong Inspirations  6-Day Tour', 'Beijing begins, Xi’an ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1766845845305-D1-%E5%A4%A7%E5%90%8C%E5%8F%A4%E5%9F%8E-%E7%AB%96%E5%9B%BE-CvfB9ls8Q7HhZavjCmqai1HKdlUgqN.jpeg', 'deep-discovery'),
  ('12da1d30-0d8d-49df-b350-fe6880c56ab8'::uuid, 'chaoshan-region-cultural-heritage-6-day-tour', 'Chaoshan Region Cultural Heritage 6-Day  Tour', 'Chaozhou begins, Jieyang ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767327974888-%E4%B8%BB%E5%9B%BE-%E6%BD%AE%E6%B1%95-%E6%A8%AA%E5%9B%BE-7jm5TXOGouZn5XH3Bz7nlBoG5zBjVF.jpeg', 'deep-discovery'),
  ('535ac95b-f891-4e1c-916f-57028d7cb9e0'::uuid, 'chengdu-chongqing-double-cities-6-day-tour', 'Chengdu & Chongqing Double Cities 6-Day  Tour', 'Chengdu begins, Chongqing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767711463448-%E4%B8%BB%E5%9B%BE%E2%80%94%E6%88%90%E9%83%BD%E2%80%94%E6%A8%AA%E5%9B%BE-04q2MMWKiamDwGcgjVXGn3ZSuZYpTS.png', 'deep-discovery'),
  ('d48f2466-e466-4801-886c-cd28c6cc97c6'::uuid, 'chongqing-highlights-magic-cityscape-day-tour', 'Chongqing Highlights & Magic Cityscape Day Tour | Korascale Travel', 'Chongqing begins, Chongqing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771754676598-%E4%B8%BB%E5%9B%BE-%E9%87%8D%E5%BA%86%E5%B8%82%E5%8C%BA-%E6%A8%AA%E5%9B%BE-RG3wOzUWFTX4jHSQYUlZmKppYZJZk3.jpeg', 'explore-together'),
  ('9b0aefcc-3604-4d5c-bcc2-0b8ee80bb621'::uuid, 'grand-china-highlands-nature-18-day-journey', 'Grand China Highlands & Nature 18-Day Journey', 'Shanghai begins · Lijiang · Shangri-La · Lhasa · Everest · Shigatse · Beijing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1769923887089-%E4%B8%BB%E5%9B%BE-%E5%B8%83%E8%BE%BE%E6%8B%89%E5%AE%AB-%E6%A8%AA%E5%9B%BE-nUl8p9O9Z5vEKsSj7GdfgyRSebzbRu.jpeg', 'deep-discovery'),
  ('eb9647df-6b38-46be-9920-9b80f27a9d2e'::uuid, 'grand-china-highlights-16-day-multi-city-journey', 'Grand China Highlights 16-Day Multi-City Journey', 'Beijing begins · Xi’an · Chengdu · Chongqing · Guilin · Shanghai ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1769921047051-%E4%B8%BB%E5%9B%BE-%E6%A1%82%E6%9E%97%E5%B1%B1%E6%B0%B4-%E6%A8%AA%E5%9B%BE-6aJddp5N5BEhJi8dKhKOYiIG2vEqPw.jpg', 'deep-discovery'),
  ('4a22ea8c-15a2-4b39-b1d2-c7b3d3e32fd7'::uuid, 'guangzhou-chaoshan-xiamen-cultural-loop-8-day-tour', 'Guangzhou, Chaoshan & Xiamen  Cultural Loop 8-Day Tour', 'Guangzhou begins, Xiamen ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767336091625-%E4%B8%BB%E5%9B%BE-%E9%BC%93%E6%B5%AA%E5%B1%BF-%E6%A8%AA%E5%9B%BE-BYoPelIP7Z05GUaamn23ttGm6vw8O0.jpeg', 'deep-discovery'),
  ('d2be5f8a-75a3-453a-88e6-a13c8baa70d4'::uuid, 'guilin-to-yangshuo-classic-7-day-tour', 'Guilin to Yangshuo  Classic 7-Day Tour', 'Guilin begins, Guilin ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767280379682-%E4%B8%BB%E5%9B%BE-%E6%A1%82%E6%9E%97%E5%B1%B1%E6%B0%B4-%E6%A8%AA%E5%9B%BE-cWIzMKou5RqE2x2ZWYvmqGdEZE6S1g.jpg', 'deep-discovery'),
  ('fe99d869-cb67-4ba7-8791-ecdfa38c2701'::uuid, 'huangshan-to-huizhou-ancient-villages-6-day-tour', 'Huangshan to Huizhou Ancient Villages 6-Day Tour', 'Huangshan begins, Huangshan ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767340686645-%E4%B8%BB%E5%9B%BE-%E8%BF%8E%E5%AE%A2%E6%9D%BE-%E6%A8%AA%E5%9B%BE-4FOkmcw5y1HwAvY72Ou2giwRIEIiE4.jpg', 'deep-discovery'),
  ('aa64bf32-d48f-4d5a-8bb7-e0e85353de5c'::uuid, 'jiuzhaigou-cultural-adventure-4-day-tour', 'Jiuzhaigou Cultural & Adventure 4-Day Tour', 'Chengdu begins, Chengdu ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767714076358-%E4%B8%BB%E5%9B%BE-%E4%B9%9D%E5%AF%A8%E6%B2%9F-%E6%A8%AA%E5%9B%BE-z8k3mNCllKHJa6CARBGLsPC7wPmzDb.jpeg', 'deep-discovery'),
  ('062f363b-eabb-493c-a15b-fe769db12ac5'::uuid, 'jiuzhaigou-huanglong-by-high-speed-rail-3-day-tour', 'Jiuzhaigou & Huanglong by High-Speed Rail 3-Day Tour | Korascale Travel', 'Chengdu begins, Chengdu ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771753923521-%E4%B8%BB%E5%9B%BE-%E4%B9%9D%E5%AF%A8%E6%B2%9F-%E6%A8%AA%E5%9B%BE-RBIWFJFZDyD8TzHhytYjCAmfndXhda.jpeg', 'explore-together'),
  ('28ae5874-2c8f-4f88-895e-09cb45c36872'::uuid, 'leshan-buddha-emei-mountain-2-day-tour', 'Leshan Buddha & Emei Mountain 2-Day Tour | Korascale Travel', 'Chengdu begins, Chengdu ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771753037248-%E4%B8%BB%E5%9B%BE-%E5%B3%A8%E7%9C%89%E5%B1%B1-%E6%A8%AA%E5%9B%BE-hLbMBhKWnUFPqpWmBSKQwBxKwyW5n2.png', 'explore-together'),
  ('43afa024-0a6b-42a4-ab24-b582778ad587'::uuid, 'lhasa-holy-lakes-classic-tibet-8-day-tour', 'Lhasa & Holy Lakes  Classic Tibet 8-Day Tour', 'Lhasa begins, Lhasa ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1768222356636-%E4%B8%BB%E5%9B%BE-%E5%B7%B4%E6%9D%BE%E6%8E%AA-%E6%A8%AA%E5%9B%BE-serMl9dPsgjQRaFlaSJXlkvu4oHyjL.jpeg', 'deep-discovery'),
  ('645c7b01-6a18-4246-91b7-69f1311e9ebc'::uuid, 'shanghai-suzhou-classic-dual-city-7-day-tour', 'Shanghai & Suzhou Classic Dual-City 7-Day  Tour', 'Shanghai begins, Shanghai ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767455968109-%E4%B8%BB%E5%9B%BE-%E8%8B%8F%E5%B7%9E-%E6%A8%AA%E5%9B%BE-BaUlNeqFN1L39nd7jshRCvpf2vdRix.jpeg', 'deep-discovery'),
  ('743d03b7-82a9-4d72-9715-10ee9df9f231'::uuid, 'siguniang-mountain-2-day-tour', 'Siguniang Mountain 2-Day Tour | Korascale Travel', 'Chengdu begins, Chengdu ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1765962302332-%E5%9B%9B%E5%A7%91%E5%A8%98%E5%B1%B1%E5%8F%8C%E6%A1%A5%E6%B2%9F%E5%9B%9B%E5%A7%91%E5%A8%9C%E6%8E%AA2-DnmiqcpIYffSIvp9ALSTlj06LneFtk.png', 'explore-together'),
  ('bfd44a68-c631-4e23-950f-f93a7e9231b5'::uuid, 'xian-culture-mount-hua-in-depth-4-day-tour', 'Xi''an Culture & Mount Hua  In-Depth 4-Day Tour', 'Xi''an begins, Xi''an ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1766931010118-%E4%B8%BB%E5%9B%BE-%E8%A5%BF%E5%AE%89%E5%9F%8E%E5%A2%99-%E6%A8%AA%E5%9B%BE-NlSHPTNxeOYztmbhrzWZCqvHwWKO6I.jpg', 'deep-discovery'),
  ('06f935af-8ca1-45e0-bdc3-053b94907cf2'::uuid, 'xian-terracotta-warriors-tang-paradise-night-tour', 'Xi''an Terracotta Warriors & Tang Paradise Night Tour', 'Uncovering the Subterranean Scale of Ancient Empires and the Radiant Spectacle of China’s Cultural Renaissance.', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771751385210-%E4%B8%BB%E5%9B%BE-%E5%85%B5%E9%A9%AC%E4%BF%91-%E6%A8%AA%E5%9B%BE-nsKYkQSn2Pko5A3csi3FSClT5Rr5vh.jpeg', 'explore-together'),
  ('1211dc54-4653-4bb1-a925-75fa38477919'::uuid, 'xining-to-lhasa-mount-everest-tibet-grand-10-day-tour', 'Xining to Lhasa & Mount Everest  Tibet Grand 10-Day Tour', 'Xining begins, Lhasa ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767931763849-%E4%B8%BB%E5%9B%BE-%E9%9D%92%E8%97%8F%E9%93%81%E8%B7%AF-%E6%A8%AA%E5%9B%BE-KOj3Ae3UB0Luayq8Br88l9P5DGvD6r.jpeg', 'deep-discovery'),
  ('ef87b1c3-d52a-4e8e-ade7-950e1bceadb3'::uuid, 'yunnan-kunming-dali-lijiang-shangri-la-9-day-tour', 'Yunnan Kunming, Dali, Lijiang & Shangri-La 9-Day  Tour', 'Kunming begins, Shangri-La ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1768228201513-%E4%B8%BB%E5%9B%BE-%E5%A4%A7%E7%BB%8F%E5%B9%A1-%E6%A8%AA%E5%9B%BE-mRCBTRF3GbHKUl5euE15JCuIJdIECU.jpeg', 'deep-discovery'),
  ('08579f34-894b-4278-9608-a96f54d2b591'::uuid, 'zhangjiajie-fenghuang-classic-7-day-dual-destination-tour', 'Zhangjiajie & Fenghuang Classic 7-Day Dual-Destination Tour', 'Zhangjiajie begins, Zhangjiajie ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767679604101-%E4%B8%BB%E5%9B%BE-%E6%AD%A6%E9%99%B5%E6%BA%90-%E6%A8%AA%E5%9B%BE-oFGPNkojecNVIpFNd7mnzy8MzDGUay.jpeg', 'deep-discovery');

CREATE TEMP TABLE pr_j2b3a_snapshot AS
  SELECT j.id, j.slug, j.status, j.title, j.short_description, j.data,
         j.page_title, j.meta_description, j.hero_image_url, j.hero_image_alt, j.journey_type_slug,
         j.price_from, j.seo_complete
  FROM journeys j
  WHERE j.id IN (SELECT id FROM pr_j2b3a_manifest);

CREATE TEMP TABLE pr_j2b3a_external_slug_snapshot AS
  SELECT j.id, j.slug FROM journeys j
  WHERE j.id NOT IN (SELECT id FROM pr_j2b3a_manifest);

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  manifest_count INTEGER;
  manifest_missing INTEGER;
  status_mismatch INTEGER;
  slug_mismatch INTEGER;
  empty_proposed INTEGER;
  column_conflict INTEGER;
  hero_alt_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b3a_manifest;

  IF total_count <> 83 THEN RAISE EXCEPTION 'ABORT: expected 83 journeys, found %', total_count; END IF;
  IF active_count <> 24 THEN RAISE EXCEPTION 'ABORT: expected 24 active, found %', active_count; END IF;
  IF archived_count <> 59 THEN RAISE EXCEPTION 'ABORT: expected 59 archived, found %', archived_count; END IF;
  IF manifest_count <> 24 THEN RAISE EXCEPTION 'ABORT: expected manifest count 24, found %', manifest_count; END IF;

  SELECT COUNT(*) INTO manifest_missing
  FROM pr_j2b3a_manifest m LEFT JOIN journeys j ON j.id = m.id WHERE j.id IS NULL;
  IF manifest_missing <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest IDs missing', manifest_missing; END IF;

  SELECT COUNT(*) INTO status_mismatch
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id WHERE j.status <> 'active';
  IF status_mismatch <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows not active', status_mismatch; END IF;

  SELECT COUNT(*) INTO slug_mismatch
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id WHERE j.slug <> m.expected_slug;
  IF slug_mismatch <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest slug mismatch', slug_mismatch; END IF;

  SELECT COUNT(*) INTO empty_proposed
  FROM pr_j2b3a_manifest m
  WHERE BTRIM(m.page_title_proposed) = ''
     OR BTRIM(m.meta_description_proposed) = ''
     OR BTRIM(m.hero_image_url_proposed) = ''
     OR BTRIM(m.journey_type_slug_proposed) = '';
  IF empty_proposed <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows have empty proposed values', empty_proposed; END IF;

  SELECT COUNT(*) INTO column_conflict
  FROM pr_j2b3a_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE (BTRIM(COALESCE(j.page_title, '')) <> '' AND BTRIM(j.page_title) <> m.page_title_proposed)
     OR (BTRIM(COALESCE(j.meta_description, '')) <> '' AND BTRIM(j.meta_description) <> m.meta_description_proposed)
     OR (BTRIM(COALESCE(j.hero_image_url, '')) <> '' AND BTRIM(j.hero_image_url) <> m.hero_image_url_proposed)
     OR (BTRIM(COALESCE(j.journey_type_slug, '')) <> '' AND BTRIM(j.journey_type_slug) <> m.journey_type_slug_proposed);
  IF column_conflict <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows have column conflicts', column_conflict; END IF;

  SELECT COUNT(*) INTO hero_alt_missing
  FROM pr_j2b3a_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.hero_image_alt, '')) = '';
  IF hero_alt_missing <> 0 THEN RAISE EXCEPTION 'ABORT: % active manifest rows missing hero_image_alt', hero_alt_missing; END IF;
END $$;

DO $$
DECLARE
  updated_rows INTEGER;
  empty_after INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  slug_changed INTEGER;
  non_target_changed INTEGER;
  page_title_filled INTEGER;
  meta_description_filled INTEGER;
  hero_image_url_filled INTEGER;
  journey_type_slug_filled INTEGER;
  hero_image_alt_filled INTEGER;
BEGIN
  UPDATE journeys j
  SET
    page_title = CASE WHEN BTRIM(COALESCE(j.page_title, '')) = '' THEN m.page_title_proposed ELSE j.page_title END,
    meta_description = CASE WHEN BTRIM(COALESCE(j.meta_description, '')) = '' THEN m.meta_description_proposed ELSE j.meta_description END,
    hero_image_url = CASE WHEN BTRIM(COALESCE(j.hero_image_url, '')) = '' THEN m.hero_image_url_proposed ELSE j.hero_image_url END,
    journey_type_slug = CASE WHEN BTRIM(COALESCE(j.journey_type_slug, '')) = '' THEN m.journey_type_slug_proposed ELSE j.journey_type_slug END
  FROM pr_j2b3a_manifest m
  WHERE j.id = m.id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO empty_after
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.page_title, '')) = ''
     OR BTRIM(COALESCE(j.meta_description, '')) = ''
     OR BTRIM(COALESCE(j.hero_image_url, '')) = ''
     OR BTRIM(COALESCE(j.journey_type_slug, '')) = '';
  IF empty_after <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows still have empty normalized columns', empty_after; END IF;

  SELECT COUNT(*) INTO page_title_filled
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.page_title, '')) <> '';
  SELECT COUNT(*) INTO meta_description_filled
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.meta_description, '')) <> '';
  SELECT COUNT(*) INTO hero_image_url_filled
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.hero_image_url, '')) <> '';
  SELECT COUNT(*) INTO journey_type_slug_filled
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.journey_type_slug, '')) <> '';
  SELECT COUNT(*) INTO hero_image_alt_filled
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.hero_image_alt, '')) <> '';
  IF page_title_filled <> 24 OR meta_description_filled <> 24 OR hero_image_url_filled <> 24
     OR journey_type_slug_filled <> 24 OR hero_image_alt_filled <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24/24 filled metadata columns after update';
  END IF;

  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  IF active_count <> 24 OR archived_count <> 59 THEN
    RAISE EXCEPTION 'ABORT: status counts changed after metadata update';
  END IF;

  SELECT COUNT(*) INTO slug_changed
  FROM pr_j2b3a_external_slug_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.slug IS DISTINCT FROM s.slug;
  IF slug_changed <> 0 THEN RAISE EXCEPTION 'ABORT: manifest-external slug changed'; END IF;

  SELECT COUNT(*) INTO non_target_changed
  FROM pr_j2b3a_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.status IS DISTINCT FROM s.status
     OR j.slug IS DISTINCT FROM s.slug
     OR j.title IS DISTINCT FROM s.title
     OR j.short_description IS DISTINCT FROM s.short_description
     OR j.data IS DISTINCT FROM s.data
     OR j.hero_image_alt IS DISTINCT FROM s.hero_image_alt
     OR j.price_from IS DISTINCT FROM s.price_from
     OR j.seo_complete IS DISTINCT FROM s.seo_complete;
  IF non_target_changed <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows changed non-target fields', non_target_changed;
  END IF;
END $$;

COMMIT;
