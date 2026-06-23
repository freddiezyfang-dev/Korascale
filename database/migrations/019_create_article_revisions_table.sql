-- 文章 SEO 修订版本表 (Article Revisions)
-- Codex 提交的待审核修订，不直接修改 articles 正式记录

CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  source_slug VARCHAR(255) NOT NULL,
  source_snapshot JSONB NOT NULL,
  proposed_content JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  CONSTRAINT article_revisions_status_check
    CHECK (status IN ('pending', 'published', 'rejected', 'superseded')),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_article_revisions_article_id ON article_revisions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_revisions_status ON article_revisions(status);
CREATE INDEX IF NOT EXISTS idx_article_revisions_source_slug ON article_revisions(source_slug);
CREATE INDEX IF NOT EXISTS idx_article_revisions_article_pending
  ON article_revisions(article_id)
  WHERE status = 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_article_revisions_updated_at'
      AND tgrelid = 'article_revisions'::regclass
  ) THEN
    CREATE TRIGGER update_article_revisions_updated_at
      BEFORE UPDATE ON article_revisions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

COMMENT ON TABLE article_revisions IS 'SEO/Codex proposed article revisions awaiting admin review';
COMMENT ON COLUMN article_revisions.source_snapshot IS 'Snapshot of editable article fields at revision creation time';
COMMENT ON COLUMN article_revisions.proposed_content IS 'Proposed editable article fields only';
