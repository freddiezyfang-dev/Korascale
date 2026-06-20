-- 询盘表 (Inquiries) - 统一 inquiry 后台基础设施
-- 独立于 bookings，不迁移历史 bookings 数据

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id VARCHAR(32) NOT NULL UNIQUE,

  intent VARCHAR(50) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  source_page TEXT,
  source_slug VARCHAR(255),
  source_context JSONB NOT NULL DEFAULT '{}'::jsonb,

  channel VARCHAR(20) NOT NULL DEFAULT 'form',

  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT,

  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  status VARCHAR(50) NOT NULL DEFAULT 'NEW',

  notification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  notification_provider_id VARCHAR(255),
  notification_error VARCHAR(500),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_submission_id ON inquiries(submission_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_intent ON inquiries(intent);
CREATE INDEX IF NOT EXISTS idx_inquiries_source_type ON inquiries(source_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_notification_status ON inquiries(notification_status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
