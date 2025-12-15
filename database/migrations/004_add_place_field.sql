-- 迁移脚本：添加 place 字段到 journeys 表
-- 执行日期：2024
-- 说明：为 journeys 表添加 place 字段（具体地点）

-- 1. 添加 place 字段
ALTER TABLE journeys 
ADD COLUMN IF NOT EXISTS place VARCHAR(255);

-- 2. 添加注释说明
COMMENT ON COLUMN journeys.place IS '具体地点：Tibetan Plateau & Kham Region, Yunnan–Guizhou Highlands, 等';

-- 3. 创建索引以提高查询性能（可选）
CREATE INDEX IF NOT EXISTS idx_journeys_place ON journeys(place);

-- 4. 更新全文搜索向量函数，包含 place
CREATE OR REPLACE FUNCTION journeys_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    to_tsvector('english', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.description, '') || ' ' || 
      COALESCE(NEW.short_description, '') || ' ' ||
      COALESCE(NEW.category, '') || ' ' ||
      COALESCE(NEW.journey_type, '') || ' ' ||
      COALESCE(NEW.region, '') || ' ' ||
      COALESCE(NEW.place, '') || ' ' ||
      COALESCE(NEW.city, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 重新创建触发器（如果已存在会自动替换）
DROP TRIGGER IF EXISTS update_journeys_search_vector ON journeys;
CREATE TRIGGER update_journeys_search_vector
  BEFORE INSERT OR UPDATE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION journeys_search_vector_update();

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE 'place 字段添加完成！';
  RAISE NOTICE '索引已创建';
  RAISE NOTICE '全文搜索已更新';
END $$;

