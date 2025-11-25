-- 迁移脚本：添加 journey_type 字段到 journeys 表
-- 执行日期：2024
-- 说明：为 journeys 表添加版面分类字段（Explore Together, Deep Discovery, Signature Journeys）

-- 1. 添加 journey_type 字段
ALTER TABLE journeys 
ADD COLUMN IF NOT EXISTS journey_type VARCHAR(50);

-- 2. 添加注释说明
COMMENT ON COLUMN journeys.journey_type IS '版面分类：Explore Together（一起探索）, Deep Discovery（深度发现）, Signature Journeys（标志性旅程）';

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_journeys_journey_type ON journeys(journey_type);

-- 4. 更新全文搜索向量函数，包含 journey_type
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

-- 6. 可选：为现有数据设置默认值（根据 duration 自动分类）
-- 注意：这个更新是可选的，你可以手动在后台设置每个 journey 的分类
DO $$
BEGIN
  -- 根据 duration 自动分类（可选）
  -- Explore Together: 1 Day
  UPDATE journeys 
  SET journey_type = 'Explore Together' 
  WHERE journey_type IS NULL 
    AND (duration ILIKE '%1 day%' OR duration ILIKE '%1-day%' OR duration = '1 Day');
  
  -- Deep Discovery: 2-4 Days
  UPDATE journeys 
  SET journey_type = 'Deep Discovery' 
  WHERE journey_type IS NULL 
    AND (
      duration ILIKE '%2%' OR 
      duration ILIKE '%3%' OR 
      duration ILIKE '%4%' OR
      duration ILIKE '%2 day%' OR
      duration ILIKE '%3 day%' OR
      duration ILIKE '%4 day%'
    );
  
  -- Signature Journeys: 5+ Days 或价格较高的（可选，根据实际需求调整）
  -- 这里暂时不自动设置，建议手动在后台设置
END $$;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE 'journey_type 字段添加完成！';
  RAISE NOTICE '索引已创建';
  RAISE NOTICE '全文搜索已更新';
END $$;

