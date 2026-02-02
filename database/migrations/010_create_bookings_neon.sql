-- Neon Postgres: 创建完整的 bookings 表（包含所有字段）
-- 如果表已存在，此脚本会安全跳过

-- 创建 bookings 表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_submitted_at ON bookings(submitted_at);
CREATE INDEX IF NOT EXISTS idx_bookings_journey_id ON bookings(journey_id);

-- 创建触发器（需要 update_updated_at_column 函数存在）
-- 如果函数不存在，请先执行 001_create_tables.sql 中的函数定义
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
