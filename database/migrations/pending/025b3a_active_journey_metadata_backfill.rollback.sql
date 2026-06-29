-- Rollback 025B3A — restore ONLY the 24 active manifest normalized column values.
-- Does NOT modify manifest-external journeys.

BEGIN;

CREATE TEMP TABLE pr_j2b3a_rollback (
  id uuid PRIMARY KEY,
  old_page_title text,
  old_meta_description text,
  old_hero_image_url text,
  old_journey_type_slug text
);

INSERT INTO pr_j2b3a_rollback (id, old_page_title, old_meta_description, old_hero_image_url, old_journey_type_slug) VALUES
  ('37f6a3ae-f758-4449-83f5-e036c83f189d'::uuid, NULL, NULL, NULL, NULL),
  ('3468ea14-5f5e-40f6-9234-0fedf137189e'::uuid, NULL, NULL, NULL, NULL),
  ('8f3cdc36-f243-45da-b3b5-ecfba83929a6'::uuid, NULL, NULL, NULL, NULL),
  ('d5e5c0e9-6549-497a-97a3-4843621da5dc'::uuid, NULL, NULL, NULL, NULL),
  ('4d3bbbb8-3907-459b-af10-181ace7af8ec'::uuid, NULL, NULL, NULL, NULL),
  ('12da1d30-0d8d-49df-b350-fe6880c56ab8'::uuid, NULL, NULL, NULL, NULL),
  ('535ac95b-f891-4e1c-916f-57028d7cb9e0'::uuid, NULL, NULL, NULL, NULL),
  ('d48f2466-e466-4801-886c-cd28c6cc97c6'::uuid, NULL, NULL, NULL, NULL),
  ('9b0aefcc-3604-4d5c-bcc2-0b8ee80bb621'::uuid, NULL, NULL, NULL, NULL),
  ('eb9647df-6b38-46be-9920-9b80f27a9d2e'::uuid, NULL, NULL, NULL, NULL),
  ('4a22ea8c-15a2-4b39-b1d2-c7b3d3e32fd7'::uuid, NULL, NULL, NULL, NULL),
  ('d2be5f8a-75a3-453a-88e6-a13c8baa70d4'::uuid, NULL, NULL, NULL, NULL),
  ('fe99d869-cb67-4ba7-8791-ecdfa38c2701'::uuid, NULL, NULL, NULL, NULL),
  ('aa64bf32-d48f-4d5a-8bb7-e0e85353de5c'::uuid, NULL, NULL, NULL, NULL),
  ('062f363b-eabb-493c-a15b-fe769db12ac5'::uuid, NULL, NULL, NULL, NULL),
  ('28ae5874-2c8f-4f88-895e-09cb45c36872'::uuid, NULL, NULL, NULL, NULL),
  ('43afa024-0a6b-42a4-ab24-b582778ad587'::uuid, NULL, NULL, NULL, NULL),
  ('645c7b01-6a18-4246-91b7-69f1311e9ebc'::uuid, NULL, NULL, NULL, NULL),
  ('743d03b7-82a9-4d72-9715-10ee9df9f231'::uuid, NULL, NULL, NULL, NULL),
  ('bfd44a68-c631-4e23-950f-f93a7e9231b5'::uuid, NULL, NULL, NULL, NULL),
  ('06f935af-8ca1-45e0-bdc3-053b94907cf2'::uuid, NULL, NULL, NULL, NULL),
  ('1211dc54-4653-4bb1-a925-75fa38477919'::uuid, NULL, NULL, NULL, NULL),
  ('ef87b1c3-d52a-4e8e-ade7-950e1bceadb3'::uuid, NULL, NULL, NULL, NULL),
  ('08579f34-894b-4278-9608-a96f54d2b591'::uuid, NULL, NULL, NULL, NULL);

CREATE TEMP TABLE pr_j2b3a_b3a_values (
  id uuid PRIMARY KEY,
  page_title text NOT NULL,
  meta_description text NOT NULL,
  hero_image_url text NOT NULL,
  journey_type_slug text NOT NULL
);

INSERT INTO pr_j2b3a_b3a_values (id, page_title, meta_description, hero_image_url, journey_type_slug) VALUES
  ('37f6a3ae-f758-4449-83f5-e036c83f189d'::uuid, 'Badaling Great Wall Day Tour', 'Beijing begins, Beijing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771747900791-%E4%B8%BB%E5%9B%BE-%E5%85%AB%E8%BE%BE%E5%B2%AD%E9%95%BF%E5%9F%8E-%E6%A8%AA%E5%9B%BE-I5XJSRFtV6au0gTCTXw6TWd7UoT4fh.jpg', 'explore-together'),
  ('3468ea14-5f5e-40f6-9234-0fedf137189e'::uuid, 'Beijing City Imperial Grandeur & Urban Chic 1-Day Tour', 'Navigating the Monumental Scale of Dynastic History and the Avant-Garde Ambition of a Modern Metropolis.', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771749910450-%E4%B8%BB%E5%9B%BE-%E6%95%85%E5%AE%AB-%E6%A8%AA%E5%9B%BE-v6JynohkI6UiYbNv4kXh63fUsV6p7N.jpeg', 'explore-together'),
  ('8f3cdc36-f243-45da-b3b5-ecfba83929a6'::uuid, 'Beijing Cultural Highlights, and Iconic Sights  5 Multi-Days Tour', 'Beijing begins, Beijing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1766842579054-%E4%B8%BB%E5%9B%BE-%E6%A8%AA%E5%9B%BE-hjLT44tBhGSiUk0G8wk7chpW0Yu8Iy.jpeg', 'deep-discovery'),
  ('d5e5c0e9-6549-497a-97a3-4843621da5dc'::uuid, 'Beijing to Mutianyu Great Wall Day Tour', 'Beijing begins, Beijing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771688549942-%E4%B8%BB%E5%9B%BE-%E6%85%95%E7%94%B0%E5%B3%AA%E9%95%BF%E5%9F%8E-%E6%A8%AA%E5%9B%BE-fwCKaJ5Q0zNkoOew79SY9tN8SXCMSe.jpg', 'explore-together'),
  ('4d3bbbb8-3907-459b-af10-181ace7af8ec'::uuid, 'Beijing to Shanxi Ancient Architecture with Black Myth: Wukong Inspirations  6-Day Tour', 'Beijing begins, Xi’an ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1766845845305-D1-%E5%A4%A7%E5%90%8C%E5%8F%A4%E5%9F%8E-%E7%AB%96%E5%9B%BE-CvfB9ls8Q7HhZavjCmqai1HKdlUgqN.jpeg', 'deep-discovery'),
  ('12da1d30-0d8d-49df-b350-fe6880c56ab8'::uuid, 'Chaoshan Region Cultural Heritage 6-Day  Tour', 'Chaozhou begins, Jieyang ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767327974888-%E4%B8%BB%E5%9B%BE-%E6%BD%AE%E6%B1%95-%E6%A8%AA%E5%9B%BE-7jm5TXOGouZn5XH3Bz7nlBoG5zBjVF.jpeg', 'deep-discovery'),
  ('535ac95b-f891-4e1c-916f-57028d7cb9e0'::uuid, 'Chengdu & Chongqing Double Cities 6-Day  Tour', 'Chengdu begins, Chongqing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767711463448-%E4%B8%BB%E5%9B%BE%E2%80%94%E6%88%90%E9%83%BD%E2%80%94%E6%A8%AA%E5%9B%BE-04q2MMWKiamDwGcgjVXGn3ZSuZYpTS.png', 'deep-discovery'),
  ('d48f2466-e466-4801-886c-cd28c6cc97c6'::uuid, 'Chongqing Highlights & Magic Cityscape Day Tour | Korascale Travel', 'Chongqing begins, Chongqing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771754676598-%E4%B8%BB%E5%9B%BE-%E9%87%8D%E5%BA%86%E5%B8%82%E5%8C%BA-%E6%A8%AA%E5%9B%BE-RG3wOzUWFTX4jHSQYUlZmKppYZJZk3.jpeg', 'explore-together'),
  ('9b0aefcc-3604-4d5c-bcc2-0b8ee80bb621'::uuid, 'Grand China Highlands & Nature 18-Day Journey', 'Shanghai begins · Lijiang · Shangri-La · Lhasa · Everest · Shigatse · Beijing ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1769923887089-%E4%B8%BB%E5%9B%BE-%E5%B8%83%E8%BE%BE%E6%8B%89%E5%AE%AB-%E6%A8%AA%E5%9B%BE-nUl8p9O9Z5vEKsSj7GdfgyRSebzbRu.jpeg', 'deep-discovery'),
  ('eb9647df-6b38-46be-9920-9b80f27a9d2e'::uuid, 'Grand China Highlights 16-Day Multi-City Journey', 'Beijing begins · Xi’an · Chengdu · Chongqing · Guilin · Shanghai ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1769921047051-%E4%B8%BB%E5%9B%BE-%E6%A1%82%E6%9E%97%E5%B1%B1%E6%B0%B4-%E6%A8%AA%E5%9B%BE-6aJddp5N5BEhJi8dKhKOYiIG2vEqPw.jpg', 'deep-discovery'),
  ('4a22ea8c-15a2-4b39-b1d2-c7b3d3e32fd7'::uuid, 'Guangzhou, Chaoshan & Xiamen  Cultural Loop 8-Day Tour', 'Guangzhou begins, Xiamen ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767336091625-%E4%B8%BB%E5%9B%BE-%E9%BC%93%E6%B5%AA%E5%B1%BF-%E6%A8%AA%E5%9B%BE-BYoPelIP7Z05GUaamn23ttGm6vw8O0.jpeg', 'deep-discovery'),
  ('d2be5f8a-75a3-453a-88e6-a13c8baa70d4'::uuid, 'Guilin to Yangshuo  Classic 7-Day Tour', 'Guilin begins, Guilin ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767280379682-%E4%B8%BB%E5%9B%BE-%E6%A1%82%E6%9E%97%E5%B1%B1%E6%B0%B4-%E6%A8%AA%E5%9B%BE-cWIzMKou5RqE2x2ZWYvmqGdEZE6S1g.jpg', 'deep-discovery'),
  ('fe99d869-cb67-4ba7-8791-ecdfa38c2701'::uuid, 'Huangshan to Huizhou Ancient Villages 6-Day Tour', 'Huangshan begins, Huangshan ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767340686645-%E4%B8%BB%E5%9B%BE-%E8%BF%8E%E5%AE%A2%E6%9D%BE-%E6%A8%AA%E5%9B%BE-4FOkmcw5y1HwAvY72Ou2giwRIEIiE4.jpg', 'deep-discovery'),
  ('aa64bf32-d48f-4d5a-8bb7-e0e85353de5c'::uuid, 'Jiuzhaigou Cultural & Adventure 4-Day Tour', 'Chengdu begins, Chengdu ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767714076358-%E4%B8%BB%E5%9B%BE-%E4%B9%9D%E5%AF%A8%E6%B2%9F-%E6%A8%AA%E5%9B%BE-z8k3mNCllKHJa6CARBGLsPC7wPmzDb.jpeg', 'deep-discovery'),
  ('062f363b-eabb-493c-a15b-fe769db12ac5'::uuid, 'Jiuzhaigou & Huanglong by High-Speed Rail 3-Day Tour | Korascale Travel', 'Chengdu begins, Chengdu ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771753923521-%E4%B8%BB%E5%9B%BE-%E4%B9%9D%E5%AF%A8%E6%B2%9F-%E6%A8%AA%E5%9B%BE-RBIWFJFZDyD8TzHhytYjCAmfndXhda.jpeg', 'explore-together'),
  ('28ae5874-2c8f-4f88-895e-09cb45c36872'::uuid, 'Leshan Buddha & Emei Mountain 2-Day Tour | Korascale Travel', 'Chengdu begins, Chengdu ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771753037248-%E4%B8%BB%E5%9B%BE-%E5%B3%A8%E7%9C%89%E5%B1%B1-%E6%A8%AA%E5%9B%BE-hLbMBhKWnUFPqpWmBSKQwBxKwyW5n2.png', 'explore-together'),
  ('43afa024-0a6b-42a4-ab24-b582778ad587'::uuid, 'Lhasa & Holy Lakes  Classic Tibet 8-Day Tour', 'Lhasa begins, Lhasa ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1768222356636-%E4%B8%BB%E5%9B%BE-%E5%B7%B4%E6%9D%BE%E6%8E%AA-%E6%A8%AA%E5%9B%BE-serMl9dPsgjQRaFlaSJXlkvu4oHyjL.jpeg', 'deep-discovery'),
  ('645c7b01-6a18-4246-91b7-69f1311e9ebc'::uuid, 'Shanghai & Suzhou Classic Dual-City 7-Day  Tour', 'Shanghai begins, Shanghai ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767455968109-%E4%B8%BB%E5%9B%BE-%E8%8B%8F%E5%B7%9E-%E6%A8%AA%E5%9B%BE-BaUlNeqFN1L39nd7jshRCvpf2vdRix.jpeg', 'deep-discovery'),
  ('743d03b7-82a9-4d72-9715-10ee9df9f231'::uuid, 'Siguniang Mountain 2-Day Tour | Korascale Travel', 'Chengdu begins, Chengdu ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1765962302332-%E5%9B%9B%E5%A7%91%E5%A8%98%E5%B1%B1%E5%8F%8C%E6%A1%A5%E6%B2%9F%E5%9B%9B%E5%A7%91%E5%A8%9C%E6%8E%AA2-DnmiqcpIYffSIvp9ALSTlj06LneFtk.png', 'explore-together'),
  ('bfd44a68-c631-4e23-950f-f93a7e9231b5'::uuid, 'Xi''an Culture & Mount Hua  In-Depth 4-Day Tour', 'Xi''an begins, Xi''an ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1766931010118-%E4%B8%BB%E5%9B%BE-%E8%A5%BF%E5%AE%89%E5%9F%8E%E5%A2%99-%E6%A8%AA%E5%9B%BE-NlSHPTNxeOYztmbhrzWZCqvHwWKO6I.jpg', 'deep-discovery'),
  ('06f935af-8ca1-45e0-bdc3-053b94907cf2'::uuid, 'Xi''an Terracotta Warriors & Tang Paradise Night Tour', 'Uncovering the Subterranean Scale of Ancient Empires and the Radiant Spectacle of China’s Cultural Renaissance.', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1771751385210-%E4%B8%BB%E5%9B%BE-%E5%85%B5%E9%A9%AC%E4%BF%91-%E6%A8%AA%E5%9B%BE-nsKYkQSn2Pko5A3csi3FSClT5Rr5vh.jpeg', 'explore-together'),
  ('1211dc54-4653-4bb1-a925-75fa38477919'::uuid, 'Xining to Lhasa & Mount Everest  Tibet Grand 10-Day Tour', 'Xining begins, Lhasa ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767931763849-%E4%B8%BB%E5%9B%BE-%E9%9D%92%E8%97%8F%E9%93%81%E8%B7%AF-%E6%A8%AA%E5%9B%BE-KOj3Ae3UB0Luayq8Br88l9P5DGvD6r.jpeg', 'deep-discovery'),
  ('ef87b1c3-d52a-4e8e-ade7-950e1bceadb3'::uuid, 'Yunnan Kunming, Dali, Lijiang & Shangri-La 9-Day  Tour', 'Kunming begins, Shangri-La ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1768228201513-%E4%B8%BB%E5%9B%BE-%E5%A4%A7%E7%BB%8F%E5%B9%A1-%E6%A8%AA%E5%9B%BE-mRCBTRF3GbHKUl5euE15JCuIJdIECU.jpeg', 'deep-discovery'),
  ('08579f34-894b-4278-9608-a96f54d2b591'::uuid, 'Zhangjiajie & Fenghuang Classic 7-Day Dual-Destination Tour', 'Zhangjiajie begins, Zhangjiajie ends', 'https://kbnup6n3k5ja0hg2.public.blob.vercel-storage.com/journeys/1767679604101-%E4%B8%BB%E5%9B%BE-%E6%AD%A6%E9%99%B5%E6%BA%90-%E6%A8%AA%E5%9B%BE-oFGPNkojecNVIpFNd7mnzy8MzDGUay.jpeg', 'deep-discovery');

CREATE TEMP TABLE pr_j2b3a_external_slug_snapshot AS
  SELECT j.id, j.slug FROM journeys j
  WHERE j.id NOT IN (SELECT id FROM pr_j2b3a_rollback);

DO $$
DECLARE
  manifest_count INTEGER;
  value_mismatch INTEGER;
  updated_rows INTEGER;
  external_changed INTEGER;
BEGIN
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b3a_rollback;
  IF manifest_count <> 24 THEN RAISE EXCEPTION 'ABORT rollback: manifest count must be 24'; END IF;

  SELECT COUNT(*) INTO value_mismatch
  FROM pr_j2b3a_b3a_values b
  JOIN journeys j ON j.id = b.id
  WHERE j.page_title IS DISTINCT FROM b.page_title
     OR j.meta_description IS DISTINCT FROM b.meta_description
     OR j.hero_image_url IS DISTINCT FROM b.hero_image_url
     OR j.journey_type_slug IS DISTINCT FROM b.journey_type_slug;
  IF value_mismatch <> 0 THEN
    RAISE EXCEPTION 'ABORT rollback: % manifest rows differ from B3A values (admin may have edited)', value_mismatch;
  END IF;

  UPDATE journeys j
  SET
    page_title = r.old_page_title,
    meta_description = r.old_meta_description,
    hero_image_url = r.old_hero_image_url,
    journey_type_slug = r.old_journey_type_slug
  FROM pr_j2b3a_rollback r
  WHERE j.id = r.id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 24 THEN
    RAISE EXCEPTION 'ABORT rollback: expected 24 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO external_changed
  FROM pr_j2b3a_external_slug_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.slug IS DISTINCT FROM s.slug;
  IF external_changed <> 0 THEN RAISE EXCEPTION 'ABORT rollback: manifest-external slug changed'; END IF;
END $$;

COMMIT;
