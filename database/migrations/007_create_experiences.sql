-- Journey Experiences 表（用于详情页「Amazing Experiences」）
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title VARCHAR(500) NOT NULL,
  location VARCHAR(255),           -- 如 "TOKYO, JAPAN"
  main_image VARCHAR(500),         -- 封面图
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',

  data JSONB DEFAULT '{}'::jsonb,  -- 可存 galleryImages 等

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
