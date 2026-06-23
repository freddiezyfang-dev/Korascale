#!/usr/bin/env bash
# HTTP smoke test for PR-SEC-1 against a Vercel Preview deployment.
#
# Usage:
#   export PREVIEW_BASE_URL='https://your-project-xxx.vercel.app'
#   export ADMIN_EMAIL='admin@korascale.com'
#   export ADMIN_PASSWORD='your-preview-admin-password'   # or omit to be prompted
#   ./scripts/auth/preview-smoke.sh
#
# Cookie jar is stored under /tmp only. No article/journey writes are performed.

set -euo pipefail

PREVIEW_BASE_URL="${PREVIEW_BASE_URL:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@korascale.com}"
COOKIE_JAR="${COOKIE_JAR:-/tmp/korascale-preview-cookie.txt}"

if [[ -z "$PREVIEW_BASE_URL" ]]; then
  echo "ERROR: Set PREVIEW_BASE_URL (e.g. https://korascale-xxx.vercel.app)" >&2
  exit 1
fi

PREVIEW_BASE_URL="${PREVIEW_BASE_URL%/}"
ORIGIN="$PREVIEW_BASE_URL"

if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  read -rsp "Admin password for $ADMIN_EMAIL: " ADMIN_PASSWORD
  echo ""
fi

rm -f "$COOKIE_JAR"
PASS=0
FAIL=0

check() {
  local name="$1"
  local ok="$2"
  if [[ "$ok" == "1" ]]; then
    echo "PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $name"
    FAIL=$((FAIL + 1))
  fi
}

http_code() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

echo "=== Preview smoke: $PREVIEW_BASE_URL ==="
echo ""

echo "--- 1. Anonymous session ---"
BODY=$(curl -s "$PREVIEW_BASE_URL/api/auth/session")
CODE=$(http_code "$PREVIEW_BASE_URL/api/auth/session")
echo "HTTP $CODE"
echo "$BODY" | head -c 200
echo ""
check "anonymous session 200 + authenticated=false" "$([[ "$CODE" == "200" && "$BODY" == *'"authenticated":false'* ]] && echo 1 || echo 0)"
check "no token in body" "$([[ "$BODY" != *password_hash* && "$BODY" != *'"token"'* ]] && echo 1 || echo 0)"
echo ""

echo "--- 2. Wrong password ---"
RESP=$(curl -s -w "\n__HTTP__%{http_code}" -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$PREVIEW_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" -H "Origin: $ORIGIN" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrong-password-preview-smoke\"}")
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1 | sed 's/__HTTP__//')
echo "HTTP $CODE"
echo "$BODY"
check "invalid login INVALID_CREDENTIALS" "$([[ "$CODE" == "401" && "$BODY" == *INVALID_CREDENTIALS* ]] && echo 1 || echo 0)"
HDR=$(curl -s -D - -o /dev/null -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$PREVIEW_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" -H "Origin: $ORIGIN" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrong-password-preview-smoke-2\"}")
check "no session cookie on bad login" "$(echo "$HDR" | grep -qi 'set-cookie:.*admin_session' && echo 0 || echo 1)"
echo ""

echo "--- 3. Admin login ---"
HEADERS=$(curl -s -D /tmp/korascale-preview-login-headers.txt -o /tmp/korascale-preview-login-body.json \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$PREVIEW_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" -H "Origin: $ORIGIN" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
BODY=$(cat /tmp/korascale-preview-login-body.json)
CODE=$(grep -m1 '^HTTP/' /tmp/korascale-preview-login-headers.txt | awk '{print $2}')
echo "HTTP ${CODE:-unknown}"
echo "$BODY" | head -c 300
echo ""
SC=$(grep -i '^set-cookie:.*admin_session' /tmp/korascale-preview-login-headers.txt | head -1 | sed 's/admin_session=[^;]*/admin_session=[REDACTED]/')
echo "Set-Cookie attrs: $SC"
check "login success" "$([[ "${CODE:-}" == "200" && "$BODY" == *'"authenticated":true'* && "$BODY" == *'"isAdmin":true'* ]] && echo 1 || echo 0)"
check "HttpOnly cookie" "$(echo "$SC" | grep -qi HttpOnly && echo 1 || echo 0)"
check "SameSite=Lax" "$(echo "$SC" | grep -qi 'SameSite=lax' && echo 1 || echo 0)"
check "Path=/" "$(echo "$SC" | grep -qi 'Path=/' && echo 1 || echo 0)"
check "Secure on preview HTTPS" "$(echo "$SC" | grep -qi Secure && echo 1 || echo 0)"
check "no token in JSON" "$([[ "$BODY" != *password_hash* ]] && echo 1 || echo 0)"
echo ""

echo "--- 4. Session restore ---"
BODY=$(curl -s -b "$COOKIE_JAR" "$PREVIEW_BASE_URL/api/auth/session")
CODE=$(http_code -b "$COOKIE_JAR" "$PREVIEW_BASE_URL/api/auth/session")
echo "HTTP $CODE"
echo "$BODY"
check "session isAdmin=true" "$([[ "$BODY" == *'"isAdmin":true'* ]] && echo 1 || echo 0)"
echo ""

echo "--- 5. cleanup-db admin vs anonymous ---"
CODE_ADMIN=$(http_code -b "$COOKIE_JAR" "$PREVIEW_BASE_URL/api/admin/cleanup-db")
CODE_ANON=$(http_code "$PREVIEW_BASE_URL/api/admin/cleanup-db")
echo "Admin HTTP $CODE_ADMIN | Anonymous HTTP $CODE_ANON"
check "admin cleanup-db 200" "$([[ "$CODE_ADMIN" == "200" ]] && echo 1 || echo 0)"
check "anonymous cleanup-db 401" "$([[ "$CODE_ANON" == "401" ]] && echo 1 || echo 0)"
echo ""

echo "--- 6. Invalid Origin (POST articles, auth layer only) ---"
RESP=$(curl -s -w "\n__HTTP__%{http_code}" -b "$COOKIE_JAR" \
  -X POST "$PREVIEW_BASE_URL/api/articles" \
  -H "Content-Type: application/json" -H "Origin: https://invalid.example" \
  -d '{"title":"smoke","slug":"smoke-should-not-write"}')
BODY=$(echo "$RESP" | sed '$d')
CODE=$(echo "$RESP" | tail -1 | sed 's/__HTTP__//')
echo "HTTP $CODE"
echo "$BODY"
check "INVALID_ORIGIN 403" "$([[ "$CODE" == "403" && "$BODY" == *INVALID_ORIGIN* ]] && echo 1 || echo 0)"
echo ""

echo "--- 7. Public active articles GET ---"
CODE=$(http_code "$PREVIEW_BASE_URL/api/articles?fields=list")
echo "HTTP $CODE"
check "public articles list accessible" "$([[ "$CODE" == "200" ]] && echo 1 || echo 0)"
echo ""

echo "--- 8. Logout ---"
RESP=$(curl -s -w "\n__HTTP__%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$PREVIEW_BASE_URL/api/auth/logout" -H "Origin: $ORIGIN")
CODE=$(echo "$RESP" | tail -1 | sed 's/__HTTP__//')
echo "HTTP $CODE"
BODY=$(curl -s -b "$COOKIE_JAR" "$PREVIEW_BASE_URL/api/auth/session")
check "session false after logout" "$([[ "$BODY" == *'"authenticated":false'* ]] && echo 1 || echo 0)"
CODE_AFTER=$(http_code -b "$COOKIE_JAR" "$PREVIEW_BASE_URL/api/admin/cleanup-db")
check "cleanup-db 401 after logout" "$([[ "$CODE_AFTER" == "401" ]] && echo 1 || echo 0)"
echo ""

rm -f /tmp/korascale-preview-login-headers.txt /tmp/korascale-preview-login-body.json
unset ADMIN_PASSWORD

echo "=== Summary: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]]
