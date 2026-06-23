-- Optimistic-lock timestamp captured when a revision is submitted (articles.updated_at at submit time).

ALTER TABLE article_revisions
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMP NULL;

COMMENT ON COLUMN article_revisions.source_updated_at IS 'articles.updated_at at revision submit time; used for publish conflict detection';
