#!/usr/bin/env bash
# Read-only Production database preflight (PR-SEC-1).
#
# Usage:
#   export POSTGRES_URL='postgresql://...production-neon...'
#   ./scripts/auth/production-preflight.sh
#
# Prints counts and table presence only. Never outputs passwords or hashes.

set -euo pipefail

if [[ -z "${POSTGRES_URL:-}" ]]; then
  echo "ERROR: Set POSTGRES_URL to the Production Neon pooled connection string." >&2
  exit 1
fi

HOST="$(node -e "try{console.log(new URL(process.env.POSTGRES_URL).hostname)}catch{process.exit(1)}")"
echo "Target host (sanitized): $HOST"
echo ""

node <<'NODE'
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  const articles = await pool.query(
    'SELECT COUNT(*)::int AS n, MAX(updated_at) AS max_updated FROM articles'
  );
  const users = await pool.query('SELECT COUNT(*)::int AS n FROM users');
  const adminUsers = await pool.query(
    "SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'"
  );

  const tableCheck = async (name) => {
    const { rows } = await pool.query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1
       ) AS exists`,
      [name]
    );
    return rows[0].exists;
  };

  const sessionsExists = await tableCheck('admin_sessions');
  const attemptsExists = await tableCheck('admin_login_attempts');

  let sessionColumns = [];
  if (sessionsExists) {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'admin_sessions'
       ORDER BY ordinal_position`
    );
    sessionColumns = rows.map((r) => r.column_name);
  }

  let attemptColumns = [];
  if (attemptsExists) {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'admin_login_attempts'
       ORDER BY ordinal_position`
    );
    attemptColumns = rows.map((r) => r.column_name);
  }

  console.log(
    JSON.stringify(
      {
        articles: articles.rows[0],
        users: users.rows[0],
        admin_users: adminUsers.rows[0],
        admin_sessions_table_exists: sessionsExists,
        admin_login_attempts_table_exists: attemptsExists,
        admin_sessions_columns: sessionColumns,
        admin_login_attempts_columns: attemptColumns,
      },
      null,
      2
    )
  );

  await pool.end();
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
NODE
