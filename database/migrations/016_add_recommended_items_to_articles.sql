-- Add recommended_items column to articles table
-- This column stores JSONB array of recommended items (Journeys and Articles)

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS recommended_items JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_recommended_items ON articles USING GIN (recommended_items);

-- Comment on column
COMMENT ON COLUMN articles.recommended_items IS 'Array of recommended items (Journeys and Articles) for the "Recommend For You" section. Format: [{"type": "journey", "id": "uuid"}, {"type": "article", "id": "uuid"}]';
