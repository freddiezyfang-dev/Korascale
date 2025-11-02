-- 快速创建 journeys 表（最小化版本）
-- 如果只需要快速修复错误，可以先执行这个

-- 启用生成 UUID 所需扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 创建 journeys 表
CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基础字段
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  
  category VARCHAR(50),
  region VARCHAR(100),
  city VARCHAR(100),
  location VARCHAR(255),
  
  duration VARCHAR(50),
  difficulty VARCHAR(20),
  max_participants INTEGER DEFAULT 12,
  min_participants INTEGER DEFAULT 2,
  
  image VARCHAR(500),
  
  status VARCHAR(20) DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  rating DECIMAL(3, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- JSONB字段（存储复杂数据）
  data JSONB DEFAULT '{}'::jsonb,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_journeys_slug ON journeys(slug);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);
CREATE INDEX IF NOT EXISTS idx_journeys_category ON journeys(category);
CREATE INDEX IF NOT EXISTS idx_journeys_region ON journeys(region);
CREATE INDEX IF NOT EXISTS idx_journeys_featured ON journeys(featured);
CREATE INDEX IF NOT EXISTS idx_journeys_data ON journeys USING GIN(data);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_journeys_updated_at ON journeys;
CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 完成提示
SELECT 'journeys 表创建成功！' AS message;

