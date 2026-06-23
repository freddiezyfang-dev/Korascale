-- Article CTA configuration (JSONB). Formal migration; do not add at publish/runtime.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS cta_config JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN articles.cta_config IS 'Article CTA block configuration for inspiration pages';
