-- ============================================================
-- 在 Neon SQL Editor 中创建 journey_hotels 表
-- 使用方式：复制本文件全部内容 → Neon Console → SQL Editor → 粘贴 → Run
-- ============================================================

-- 1. 确保有 UUID 生成函数（Neon 一般已有，没有则启用扩展）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. 若项目里还没有“更新时间”触发器函数，先创建（已有则跳过）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建 journey_hotels 表
CREATE TABLE IF NOT EXISTS journey_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  image VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active',
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_journey_hotels_status ON journey_hotels(status);
CREATE INDEX IF NOT EXISTS idx_journey_hotels_data ON journey_hotels USING GIN(data);

-- 5. 创建触发器：每次 UPDATE 时自动更新 updated_at
DROP TRIGGER IF EXISTS update_journey_hotels_updated_at ON journey_hotels;
CREATE TRIGGER update_journey_hotels_updated_at
  BEFORE UPDATE ON journey_hotels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 执行完成后可在此库中查询：SELECT * FROM journey_hotels;
