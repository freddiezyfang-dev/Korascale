#!/usr/bin/env bash
# Production HTTP smoke test for PR-SEC-1 at https://www.korascale.com
#
# Usage:
#   export ADMIN_EMAIL='admin@korascale.com'
#   export ADMIN_PASSWORD='...'   # or omit for hidden prompt
#   ./scripts/auth/production-smoke.sh
#
# Cookie jar: /tmp/korascale-production-cookie.txt (never in repo).
# Does not create, modify, or delete articles.

set -euo pipefail

PROD_BASE_URL="${PROD_BASE_URL:-https://www.korascale.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@korascale.com}"
COOKIE_JAR="${COOKIE_JAR:-/tmp/korascale-production-cookie.txt}"
ORIGIN="$PROD_BASE_URL"

if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  read -rsp "Production admin password for $ADMIN_EMAIL: " ADMIN_PASSWORD
  echo ""
fi

rm -f "$COOKIE_JAR"
PASS=0
FAIL=0

check() {
  if [[ "$2" == "1" ]]; then
    echo "PASS: $1"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $1"
    FAIL=$((FAIL + 1))
  fi
}

http_code() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

echo "=== Production smoke: $PROD_BASE_URL ==="
echo ""

echo "--- 1. Anonymous session ---"
BODY=$(curl -s "$PROD_BASE_URL/api/auth/session")
CODE=$(http_code "$PROD_BASE_URL/api/auth/session")
check "session 200 + unauthenticated" "$([[ "$CODE" == "200" && "$BODY" == *'"authenticated":false'* ]] && echo 1 || echo 0)"

echo "--- 2. Wrong password ---"
RESP=$(curl -s -w "\n__HTTP__%{http_code}" -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$PROD_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" -H "Origin: $ORIGIN" \
  -d '{"email":"'"$ADMIN_EMAIL"'","password":"wrong-production-smoke-password"}')
CODE=$(echo "$RESP" | tail -1 | sed 's/__HTTP__//')
BODY=$(echo "$RESP" | sed '$d')
check "401 INVALID_CREDENTIALS" "$([[ "$CODE" == "401" && "$BODY" == *INVALID_CREDENTIALS* ]] && echo 1 || echo 0)"

echo "--- 3. Admin login ---"
HEADERS=$(curl -s -D /tmp/korascale-prod-login-headers.txt -o /tmp/korascale-prod-login-body.json \
  -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$PROD_BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" -H "Origin: $ORIGIN" \
  -d '{"email":"'"$ADMIN_EMAIL"'","password":"'"$ADMIN_PASSWORD"'"}')
BODY=$(cat /tmp/korascale-prod-login-body.json)
CODE=$(grep -m1 '^HTTP/' /tmp/korascale-prod-login-headers.txt | awk '{print $2}')
SC=$(grep -i '^set-cookie:.*admin_session' /tmp/korascale-prod-login-headers.txt | head -1 | sed 's/admin_session=[^;]*/admin_session=[REDACTED]/')
echo "Set-Cookie attrs: $SC"
check "login 200" "$([[ "${CODE:-}" == "200" && "$BODY" == *'"isAdmin":true'* ]] && echo 1 || echo 0)"
check "HttpOnly" "$(echo "$SC" | grep -qi HttpOnly && echo 1 || echo 0)"
check "Secure" "$(echo "$SC" | grep -qi Secure && echo 1 || echo 0)"
check "SameSite=Lax" "$(echo "$SC" | grep -qi 'SameSite=lax' && echo 1 || echo 0)"
check "Path=/" "$(echo "$SC" | grep -qi 'Path=/' && echo 1 || echo 0)"
check "no token in body" "$([[ "$BODY" != *token* && "$BODY" != *password_hash* ]] && echo 1 || echo 0)"

echo "--- 4. Session restore ---"
BODY=$(curl -s -b "$COOKIE_JAR" "$PROD_BASE_URL/api/auth/session")
check "session isAdmin=true" "$([[ "$BODY" == *'"isAdmin":true'* ]] && echo 1 || echo 0)"

echo "--- 5. cleanup-db admin vs anonymous ---"
CA=$(http_code -b "$COOKIE_JAR" "$PROD_BASE_URL/api/admin/cleanup-db")
CN=$(http_code "$PROD_BASE_URL/api/admin/cleanup-db")
check "admin cleanup-db 200" "$([[ "$CA" == "200" ]] && echo 1 || echo 0)"
check "anonymous cleanup-db 401" "$([[ "$CN" == "401" ]] && echo 1 || echo 0)"

echo "--- 6. Invalid Origin ---"
RESP=$(curl -s -w "\n__HTTP__%{http_code}" -b "$COOKIE_JAR" \
  -X POST "$PROD_BASE_URL/api/articles" \
  -H "Content-Type: application/json" -H "Origin: https://invalid.example" \
  -d '{"title":"smoke","slug":"smoke-no-write"}')
CODE=$(echo "$RESP" | tail -1 | sed 's/__HTTP__//')
BODY=$(echo "$RESP" | sed '$d')
check "403 INVALID_ORIGIN" "$([[ "$CODE" == "403" && "$BODY" == *INVALID_ORIGIN* ]] && echo 1 || echo 0)"

echo "--- 7. Public articles list ---"
CODE=$(http_code "$PROD_BASE_URL/api/articles?fields=list")
check "public articles 200" "$([[ "$CODE" == "200" ]] && echo 1 || echo 0)"

echo "--- 8. Logout ---"
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$PROD_BASE_URL/api/auth/logout" -H "Origin: $ORIGIN" >/dev/null
BODY=$(curl -s -b "$COOKIE_JAR" "$PROD_BASE_URL/api/auth/session")
CODE=$(http_code -b "$COOKIE_JAR" "$PROD_BASE_URL/api/admin/cleanup-db")
check "logout session false" "$([[ "$BODY" == *'"authenticated":false'* ]] && echo 1 || echo 0)"
check "cleanup-db 401 after logout" "$([[ "$CODE" == "401" ]] && echo 1 || echo 0)"

rm -f /tmp/korascale-prod-login-headers.txt /tmp/korascale-prod-login-body.json
unset ADMIN_PASSWORD

echo ""
echo "=== Summary: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]]
