-- 创建 Extensions 和 Hotels 表
-- 用于 Journey 的扩展项目和酒店管理

-- 启用生成 UUID 所需扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Extensions 表（扩展项目）
CREATE TABLE IF NOT EXISTS extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基础字段
  title VARCHAR(255) NOT NULL,
  description TEXT,
  days VARCHAR(50), -- 如 "+4 DAYS"
  image VARCHAR(500),
  
  -- 坐标信息（用于地图显示）
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  
  -- 链接（可选）
  link VARCHAR(500),
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',
  
  -- JSONB字段（存储额外数据）
  data JSONB DEFAULT '{}'::jsonb,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_extensions_status ON extensions(status);
CREATE INDEX IF NOT EXISTS idx_extensions_data ON extensions USING GIN(data);

-- 2. Journey Hotels 表（Journey 关联的酒店）
-- 注意：这个表存储的是 Journey 专用的酒店信息，与 accommodations 表不同
CREATE TABLE IF NOT EXISTS journey_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基础字段
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255), -- 地点描述
  image VARCHAR(500), -- 竖版图片
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',
  
  -- JSONB字段（存储额外数据）
  data JSONB DEFAULT '{}'::jsonb,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_journey_hotels_status ON journey_hotels(status);
CREATE INDEX IF NOT EXISTS idx_journey_hotels_data ON journey_hotels USING GIN(data);

-- 3. 在 journeys 表的 data JSONB 字段中添加 extensions 和 hotels 数组字段
-- 注意：由于使用 JSONB，我们不需要修改表结构，只需要在应用层处理
-- 但为了清晰，我们可以添加注释说明

COMMENT ON COLUMN journeys.data IS 'JSONB字段，可包含 extensions 和 hotels 数组（存储ID）';

-- 4. 创建更新时间触发器
DROP TRIGGER IF EXISTS update_extensions_updated_at ON extensions;
CREATE TRIGGER update_extensions_updated_at
  BEFORE UPDATE ON extensions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journey_hotels_updated_at ON journey_hotels;
CREATE TRIGGER update_journey_hotels_updated_at
  BEFORE UPDATE ON journey_hotels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
