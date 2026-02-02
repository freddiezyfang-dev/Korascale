-- Neon Postgres 兼容版本
-- 为 bookings 表添加缺失字段

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

-- 步骤 3: 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_submitted_at ON bookings(submitted_at);
CREATE INDEX IF NOT EXISTS idx_bookings_journey_id ON bookings(journey_id);
