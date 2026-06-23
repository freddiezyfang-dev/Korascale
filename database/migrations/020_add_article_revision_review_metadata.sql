-- Persist Codex revision review metadata separately from publishable content

ALTER TABLE article_revisions
  ADD COLUMN IF NOT EXISTS review_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN article_revisions.review_metadata IS
  'Admin review metadata: changeSummary and factCheckItems. Not merged into proposed_content or articles.';
