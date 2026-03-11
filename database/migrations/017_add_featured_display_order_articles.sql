-- 首页 Content Section：精选文章与展示位序号
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured) WHERE is_featured = true;

COMMENT ON COLUMN articles.is_featured IS '首页精选：true 时在首页 Bento 展示';
COMMENT ON COLUMN articles.display_order IS '首页展示位 1–5，按此排序';
