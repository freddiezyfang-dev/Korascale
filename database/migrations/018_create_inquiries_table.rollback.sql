-- Rollback: 018_create_inquiries_table.sql

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;

DROP INDEX IF EXISTS idx_inquiries_email;
DROP INDEX IF EXISTS idx_inquiries_created_at;
DROP INDEX IF EXISTS idx_inquiries_notification_status;
DROP INDEX IF EXISTS idx_inquiries_status;
DROP INDEX IF EXISTS idx_inquiries_source_type;
DROP INDEX IF EXISTS idx_inquiries_intent;
DROP INDEX IF EXISTS idx_inquiries_submission_id;

DROP TABLE IF EXISTS inquiries;
