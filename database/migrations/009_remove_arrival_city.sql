-- 移除 arrival_city 字段（如果存在）
-- 因为预订流程已改为仅使用 departure_city
ALTER TABLE bookings
  DROP COLUMN IF EXISTS arrival_city;
