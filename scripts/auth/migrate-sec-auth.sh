#!/usr/bin/env bash
# Run PR-SEC-1 migrations (021, 022) against a non-production database.
#
# Usage (Preview Neon branch connection string via env, never commit):
#   export POSTGRES_URL='postgresql://...preview-branch...'
#   ./scripts/auth/migrate-sec-auth.sh
#
# Refuses production-like hosts unless ALLOW_PRODUCTION_MIGRATE=1.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -z "${POSTGRES_URL:-}" ]]; then
  echo "ERROR: POSTGRES_URL is required (Preview branch connection string)." >&2
  exit 1
fi

HOST="$(node -e "try{console.log(new URL(process.env.POSTGRES_URL).hostname)}catch{process.exit(1)}")"
echo "Target host: $HOST"

if [[ "${ALLOW_PRODUCTION_MIGRATE:-}" != "1" ]]; then
  if echo "$HOST" | grep -qiE 'prod|main'; then
    echo "ERROR: Host looks like production. Set ALLOW_PRODUCTION_MIGRATE=1 to override." >&2
    exit 1
  fi
fi

fingerprint() {
  node <<'NODE'
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  const articles = await pool.query('SELECT COUNT(*)::int n, MAX(updated_at) max_updated FROM articles');
  const users = await pool.query('SELECT COUNT(*)::int n FROM users');
  const sessions = await pool.query(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='admin_sessions') AS exists"
  );
  const attempts = await pool.query(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='admin_login_attempts') AS exists"
  );
  console.log(
    JSON.stringify(
      {
        articles: articles.rows[0],
        users: users.rows[0],
        admin_sessions_table: sessions.rows[0].exists,
        admin_login_attempts_table: attempts.rows[0].exists,
      },
      null,
      2
    )
  );
  await pool.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
NODE
}

echo "=== Before ==="
fingerprint

for file in 021_create_admin_sessions.sql 022_create_admin_login_attempts.sql; do
  echo ""
  echo "=== Running $file ==="
  node scripts/run-migration.js "$file"
done

echo ""
echo "=== After ==="
fingerprint

echo ""
echo "Done. Verify articles count and max_updated unchanged."
