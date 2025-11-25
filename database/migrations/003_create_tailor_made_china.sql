-- 迁移脚本：创建 Tailor-Made China 定制服务表
-- 执行日期：2024
-- 说明：为全流程定制业务创建定制服务表

-- 1. 创建定制服务请求表
CREATE TABLE IF NOT EXISTS tailor_made_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 客户信息
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_country VARCHAR(100),
  
  -- 旅行需求
  travel_dates JSONB, -- { start_date, end_date, flexible: boolean }
  number_of_travelers INTEGER DEFAULT 2,
  traveler_details JSONB DEFAULT '[]'::jsonb, -- [{ name, age, special_needs }]
  
  -- 旅行偏好
  preferred_destinations TEXT[], -- 目的地数组
  interests TEXT[], -- 兴趣标签数组
  budget_range VARCHAR(50), -- 预算范围
  accommodation_preference VARCHAR(100), -- 住宿偏好
  transportation_preference VARCHAR(100), -- 交通偏好
  
  -- 特殊需求
  special_requirements TEXT, -- 特殊要求
  dietary_restrictions TEXT, -- 饮食限制
  accessibility_needs TEXT, -- 无障碍需求
  
  -- 定制内容详情
  itinerary_preferences JSONB DEFAULT '{}'::jsonb, -- 行程偏好
  experience_preferences JSONB DEFAULT '{}'::jsonb, -- 体验偏好
  accommodation_preferences JSONB DEFAULT '{}'::jsonb, -- 住宿偏好
  
  -- 状态跟踪
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, quoted, confirmed, completed, cancelled
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- 分配的顾问ID
  
  -- 报价信息
  quote_amount DECIMAL(10, 2),
  quote_currency VARCHAR(10) DEFAULT 'USD',
  quote_valid_until TIMESTAMP,
  quote_details JSONB DEFAULT '{}'::jsonb, -- 报价详情
  
  -- 沟通记录
  communication_log JSONB DEFAULT '[]'::jsonb, -- [{ date, type, content, user_id }]
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP, -- 提交时间
  confirmed_at TIMESTAMP, -- 确认时间
  completed_at TIMESTAMP -- 完成时间
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_tailor_made_status ON tailor_made_requests(status);
CREATE INDEX IF NOT EXISTS idx_tailor_made_customer_email ON tailor_made_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_tailor_made_created_at ON tailor_made_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_tailor_made_assigned_to ON tailor_made_requests(assigned_to);

-- 3. 创建更新时间触发器
DROP TRIGGER IF EXISTS update_tailor_made_updated_at ON tailor_made_requests;
CREATE TRIGGER update_tailor_made_updated_at
  BEFORE UPDATE ON tailor_made_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 创建定制服务配置表（存储定制服务的配置和模板）
CREATE TABLE IF NOT EXISTS tailor_made_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 配置类型
  config_type VARCHAR(50) NOT NULL, -- template, pricing, workflow
  config_key VARCHAR(100) NOT NULL,
  config_value JSONB NOT NULL,
  
  -- 元数据
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(config_type, config_key)
);

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_tailor_made_configs_type ON tailor_made_configs(config_type);
CREATE INDEX IF NOT EXISTS idx_tailor_made_configs_active ON tailor_made_configs(is_active);

-- 6. 创建更新时间触发器
DROP TRIGGER IF EXISTS update_tailor_made_configs_updated_at ON tailor_made_configs;
CREATE TRIGGER update_tailor_made_configs_updated_at
  BEFORE UPDATE ON tailor_made_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 插入默认配置模板
INSERT INTO tailor_made_configs (config_type, config_key, config_value, description) VALUES
  ('template', 'default_workflow', '{"stages": ["inquiry", "consultation", "proposal", "revision", "confirmation", "execution"]}', '默认工作流程'),
  ('pricing', 'base_rates', '{"consultation": 0, "proposal": 0, "service_fee_percentage": 10}', '基础定价'),
  ('workflow', 'status_transitions', '{"pending": ["in_progress"], "in_progress": ["quoted", "cancelled"], "quoted": ["confirmed", "cancelled"], "confirmed": ["completed", "cancelled"]}', '状态转换规则')
ON CONFLICT (config_type, config_key) DO NOTHING;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE 'Tailor-Made China 表创建完成！';
  RAISE NOTICE '定制服务请求表已创建';
  RAISE NOTICE '配置表已创建';
END $$;

