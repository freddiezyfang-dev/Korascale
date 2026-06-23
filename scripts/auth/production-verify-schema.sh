#!/usr/bin/env bash
# Post-migration schema verification for PR-SEC-1 (read-only).
#
# Usage:
#   export POSTGRES_URL='postgresql://...'
#   ./scripts/auth/production-verify-schema.sh

set -euo pipefail

if [[ -z "${POSTGRES_URL:-}" ]]; then
  echo "ERROR: POSTGRES_URL is required." >&2
  exit 1
fi

node <<'NODE'
const { Pool } = require('pg');

const REQUIRED = {
  admin_sessions: [
    'id',
    'user_id',
    'token_hash',
    'expires_at',
    'created_at',
    'last_used_at',
    'revoked_at',
  ],
  admin_login_attempts: [
    'identifier_hash',
    'ip_hash',
    'failed_count',
    'window_started_at',
    'blocked_until',
    'updated_at',
  ],
};

const FORBIDDEN = {
  admin_sessions: ['token', 'session_token', 'raw_token'],
  admin_login_attempts: ['email', 'ip', 'identifier', 'ip_address'],
};

async function columns(pool, table) {
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return rows.map((r) => r.column_name);
}

async function constraintExists(pool, table, nameFragment) {
  const { rows } = await pool.query(
    `SELECT conname FROM pg_constraint c
     JOIN pg_class t ON c.conrelid = t.oid
     WHERE t.relname = $1`,
    [table]
  );
  return rows.some((r) => r.conname.includes(nameFragment));
}

(async () => {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  const results = { ok: true, checks: [] };

  const add = (name, pass, detail) => {
    results.checks.push({ name, pass, detail });
    if (!pass) results.ok = false;
  };

  for (const table of Object.keys(REQUIRED)) {
    const cols = await columns(pool, table);
    add(`${table} exists`, cols.length > 0, cols.length ? 'present' : 'missing');

    for (const col of REQUIRED[table]) {
      add(`${table}.${col}`, cols.includes(col), cols.includes(col) ? 'ok' : 'missing');
    }

    for (const col of FORBIDDEN[table]) {
      add(`${table} no ${col}`, !cols.includes(col), cols.includes(col) ? 'forbidden column present' : 'ok');
    }
  }

  const sessionsFk = await pool.query(
    `SELECT 1 FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
     WHERE tc.table_name = 'admin_sessions'
       AND tc.constraint_type = 'FOREIGN KEY'
       AND kcu.column_name = 'user_id'`
  );
  add('admin_sessions user_id FK', sessionsFk.rowCount > 0, sessionsFk.rowCount > 0 ? 'ok' : 'missing');

  const tokenUnique = await constraintExists(pool, 'admin_sessions', 'token_hash');
  add('admin_sessions token_hash unique', tokenUnique, tokenUnique ? 'ok' : 'missing');

  const pk = await pool.query(
    `SELECT 1 FROM information_schema.table_constraints
     WHERE table_name = 'admin_login_attempts' AND constraint_type = 'PRIMARY KEY'`
  );
  add('admin_login_attempts primary key', pk.rowCount > 0, pk.rowCount > 0 ? 'ok' : 'missing');

  console.log(JSON.stringify(results, null, 2));
  await pool.end();
  process.exit(results.ok ? 0 : 1);
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
NODE
