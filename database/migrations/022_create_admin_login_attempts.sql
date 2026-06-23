-- Rate limiting for admin login attempts (hashed identifier + IP only)

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  identifier_hash VARCHAR(64) NOT NULL,
  ip_hash VARCHAR(64) NOT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (identifier_hash, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_blocked_until
  ON admin_login_attempts(blocked_until)
  WHERE blocked_until IS NOT NULL;

COMMENT ON TABLE admin_login_attempts IS 'Hashed admin login failure counters; no plaintext email or IP stored';
COMMENT ON COLUMN admin_login_attempts.identifier_hash IS 'SHA-256 of pepper + normalized email';
COMMENT ON COLUMN admin_login_attempts.ip_hash IS 'SHA-256 of pepper + client IP';
