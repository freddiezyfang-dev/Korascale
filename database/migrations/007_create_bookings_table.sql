-- 预订表 (Bookings) - 用于“预订预览 → 提交请求”流程
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
  status VARCHAR(50) DEFAULT 'PENDING',
  submitted_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_submitted_at ON bookings(submitted_at);
CREATE INDEX IF NOT EXISTS idx_bookings_journey_id ON bookings(journey_id);

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
