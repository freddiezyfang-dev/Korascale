-- 迁移脚本：更新现有数据的分类名称
-- 执行日期：2024
-- 说明：将旧的分类名称更新为新的分类名称

-- 1. 更新 Day Tour → Explore Together
UPDATE journeys 
SET journey_type = 'Explore Together' 
WHERE journey_type = 'Day Tour';

-- 2. 更新 Short Trips → Deep Discovery
UPDATE journeys 
SET journey_type = 'Deep Discovery' 
WHERE journey_type = 'Short Trips';

-- 3. 更新 Premium → Signature Journeys
UPDATE journeys 
SET journey_type = 'Signature Journeys' 
WHERE journey_type = 'Premium';

-- 4. 验证更新结果
DO $$
DECLARE
  explore_together_count INTEGER;
  deep_discovery_count INTEGER;
  signature_journeys_count INTEGER;
  old_names_count INTEGER;
BEGIN
  -- 统计新分类名称的数量
  SELECT COUNT(*) INTO explore_together_count 
  FROM journeys 
  WHERE journey_type = 'Explore Together';
  
  SELECT COUNT(*) INTO deep_discovery_count 
  FROM journeys 
  WHERE journey_type = 'Deep Discovery';
  
  SELECT COUNT(*) INTO signature_journeys_count 
  FROM journeys 
  WHERE journey_type = 'Signature Journeys';
  
  -- 检查是否还有旧名称
  SELECT COUNT(*) INTO old_names_count 
  FROM journeys 
  WHERE journey_type IN ('Day Tour', 'Short Trips', 'Premium');
  
  -- 输出结果
  RAISE NOTICE '分类名称更新完成！';
  RAISE NOTICE 'Explore Together: % 条记录', explore_together_count;
  RAISE NOTICE 'Deep Discovery: % 条记录', deep_discovery_count;
  RAISE NOTICE 'Signature Journeys: % 条记录', signature_journeys_count;
  
  IF old_names_count > 0 THEN
    RAISE NOTICE '警告：仍有 % 条记录使用旧分类名称', old_names_count;
  ELSE
    RAISE NOTICE '✅ 所有记录已更新为新分类名称';
  END IF;
END $$;

-- 5. 显示更新后的分类分布
SELECT 
  journey_type,
  COUNT(*) as count
FROM journeys 
WHERE journey_type IS NOT NULL
GROUP BY journey_type
ORDER BY journey_type;


