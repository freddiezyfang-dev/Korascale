#!/usr/bin/env bash
# Run PR-SEC-1 migrations 021 + 022 on Production Neon (explicit confirmation required).
#
# Usage:
#   export POSTGRES_URL='postgresql://...production-neon...'
#   ./scripts/auth/production-migrate.sh
#
# Does NOT use generic migration runners. Runs only 021 and 022 in order.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -z "${POSTGRES_URL:-}" ]]; then
  echo "ERROR: POSTGRES_URL is required." >&2
  exit 1
fi

HOST="$(node -e "try{console.log(new URL(process.env.POSTGRES_URL).hostname)}catch{process.exit(1)}")"
echo "Target host: $HOST"
echo ""
echo "This will run ONLY:"
echo "  - database/migrations/021_create_admin_sessions.sql"
echo "  - database/migrations/022_create_admin_login_attempts.sql"
echo ""
read -r -p "Type production to continue: " CONFIRM
if [[ "$CONFIRM" != "production" ]]; then
  echo "Aborted."
  exit 1
fi

export ALLOW_PRODUCTION_MIGRATE=1
exec "$ROOT/scripts/auth/migrate-sec-auth.sh"
