-- 检查迁移状态的完整查询脚本
-- 在 Vercel SQL Editor 中执行此脚本

-- 1. 检查 journey_type 字段是否存在
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'journeys' 
  AND column_name = 'journey_type';

-- 2. 检查索引是否存在
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'journeys' 
  AND indexname = 'idx_journeys_journey_type';

-- 3. 检查 journeys 表的所有列（查看完整表结构）
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'journeys'
ORDER BY ordinal_position;

-- 4. 查看现有数据的 journey_type 分布
SELECT 
  journey_type, 
  COUNT(*) as count
FROM journeys 
GROUP BY journey_type
ORDER BY journey_type;


