-- 预订表：增加筛选问题字段，默认状态改为 REQUESTED（定制咨询模式）
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS first_time_china VARCHAR(20),
  ADD COLUMN IF NOT EXISTS traveled_developing_regions VARCHAR(20),
  ADD COLUMN IF NOT EXISTS what_matters_most VARCHAR(50),
  ADD COLUMN IF NOT EXISTS departure_city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS arrival_city VARCHAR(255);

-- 将新订单默认状态设为 REQUESTED（原 PENDING 仍可保留用于兼容）
COMMENT ON COLUMN bookings.status IS 'PENDING|REQUESTED|PROCESSED|CONFIRMED|CANCELLED';
