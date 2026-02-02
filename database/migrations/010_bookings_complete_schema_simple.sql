-- 完整的 bookings 表结构（简化版本，兼容所有 PostgreSQL 版本）
-- 请按顺序执行以下 SQL 语句

-- 步骤 1: 创建表（如果不存在）
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(100),
  journey_id VARCHAR(255) NOT NULL,
  journey_slug VARCHAR(255) NOT NULL,
  journey_title VARCHAR(500),
  selected_date DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 2,
  children INTEGER NOT NULL DEFAULT 0,
  final_price DECIMAL(10, 2) NOT NULL,
  special_requests TEXT,
  first_time_china VARCHAR(20),
  traveled_developing_regions VARCHAR(20),
  what_matters_most VARCHAR(50),
  departure_city VARCHAR(255),
  status VARCHAR(50) DEFAULT 'REQUESTED',
  submitted_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 步骤 2: 添加缺失的字段（如果表已存在但字段缺失）
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS first_time_china VARCHAR(20);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS traveled_developing_regions VARCHAR(20);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS what_matters_most VARCHAR(50);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS departure_city VARCHAR(255);

-- 步骤 3: 移除 arrival_city（如果存在）
ALTER TABLE bookings
  DROP COLUMN IF EXISTS arrival_city;

-- 步骤 4: 更新默认状态为 REQUESTED（可选，如果表已存在）
-- 如果表已存在且默认值是 PENDING，执行以下语句：
-- ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'REQUESTED';

-- 步骤 5: 创建索引
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_submitted_at ON bookings(submitted_at);
CREATE INDEX IF NOT EXISTS idx_bookings_journey_id ON bookings(journey_id);

-- 步骤 6: 创建或更新触发器（需要先确保 update_updated_at_column 函数存在）
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
