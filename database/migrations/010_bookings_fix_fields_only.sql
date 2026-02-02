-- 仅添加缺失字段（最简化版本）
-- 如果 bookings 表已存在，执行以下语句添加缺失字段

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS first_time_china VARCHAR(20);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS traveled_developing_regions VARCHAR(20);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS what_matters_most VARCHAR(50);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS departure_city VARCHAR(255);

-- 移除 arrival_city（如果存在）
ALTER TABLE bookings
  DROP COLUMN IF EXISTS arrival_city;
