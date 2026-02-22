/* 复制整段到 Neon SQL Editor 一次性执行：创建 experiences 表 + journey_experiences 关联表 */

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500),
  location VARCHAR(255),
  main_image VARCHAR(500),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiences_status ON experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_data ON experiences USING GIN(data);

DROP TRIGGER IF EXISTS update_experiences_updated_at ON experiences;
CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS journey_experiences (
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (journey_id, experience_id)
);

CREATE INDEX IF NOT EXISTS idx_journey_experiences_journey_id ON journey_experiences(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_experiences_experience_id ON journey_experiences(experience_id);

SELECT 'experiences and journey_experiences created' AS message;
