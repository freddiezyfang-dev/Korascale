-- Neon Postgres 完整迁移脚本
-- 为 bookings 表添加所有必需字段

-- 步骤 1: 添加缺失字段（如果表已存在）
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS first_time_china VARCHAR(20);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS traveled_developing_regions VARCHAR(20);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS what_matters_most VARCHAR(50);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS departure_city VARCHAR(255);

-- 步骤 2: 移除 arrival_city（如果存在）
ALTER TABLE bookings
  DROP COLUMN IF EXISTS arrival_city;

-- 步骤 3: 更新默认状态为 REQUESTED（如果表已存在且默认值是 PENDING）
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'REQUESTED';

-- 步骤 4: 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_submitted_at ON bookings(submitted_at);
CREATE INDEX IF NOT EXISTS idx_bookings_journey_id ON bookings(journey_id);

-- 步骤 5: 创建或更新触发器（需要 update_updated_at_column 函数存在）
-- 如果函数不存在，请先执行 001_create_tables.sql 中的函数定义
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
