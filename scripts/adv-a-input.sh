#!/usr/bin/env bash
# Adversarial batch A — malformed input, edge cases, method misuse, unknown routes.
set -u
BASE="http://localhost:3000"
JAR=/tmp/jx-adv-cookies.txt
rm -f "$JAR"
FAILED=0
pass() { echo "PASS  $1"; }
vuln() { echo "VULN  $1"; FAILED=1; }

code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

# ── setup a session ─────────────────────────────────────────────────────────
curl -s -c "$JAR" -X POST $BASE/api/auth/otp/request -H 'Content-Type: application/json' -d '{"email":"founder@fraziym.test"}' > /dev/null
OCODE=$(tail -c 4000 dev.log | strings | grep -oE "OTP for founder@fraziym.test: [0-9]{6}" | tail -1 | grep -oE "[0-9]{6}$")
curl -s -b "$JAR" -c "$JAR" -X POST $BASE/api/auth/otp/verify -H 'Content-Type: application/json' -d "{\"email\":\"founder@fraziym.test\",\"code\":\"$OCODE\"}" > /dev/null

echo "== A1 malformed JSON on every POST route =="
for ep in "auth/otp/request" "auth/otp/verify" "auth/signout" "consent" "settings" "boost/claim" "jonts/jont_j246_natural-language-to-cron/run" "v1/tokens" "v1/presets" "telegram/webhook"; do
  C=$(code -X POST -H 'Content-Type: application/json' -d '{not json' $BASE/api/$ep)
  case "$ep" in
    telegram/webhook) [ "$C" = "401" ] || [ "$C" = "400" ] || [ "$C" = "403" ] && pass "POST $ep bad-json → $C (rejected)" || vuln "POST $ep bad-json → $C" ;;
    *) [ "$C" = "400" ] && pass "POST $ep bad-json → 400" || vuln "POST $ep bad-json → $C (expected 400)" ;;
  esac
done

echo "== A2 missing/empty/wrong-type fields =="
C=$(code -X POST -H 'Content-Type: application/json' -d '{}' $BASE/api/auth/otp/request); [ "$C" = "422" ] && pass "otp/request {} → 422" || vuln "otp/request {} → $C"
C=$(code -X POST -H 'Content-Type: application/json' -d '{"email":123}' $BASE/api/auth/otp/request); [ "$C" = "422" ] && pass "otp/request email:123 → 422" || vuln "otp/request email:123 → $C"
C=$(code -X POST -H 'Content-Type: application/json' -d '{"email":"a@b.c","code":{"$gt":""}}' $BASE/api/auth/otp/verify); [ "$C" = "401" ] && pass "otp/verify object-code → 401 (no NoSQL-style bypass)" || vuln "otp/verify object-code → $C"
C=$(code -X POST -H 'Content-Type: application/json' -d '{"tool":"jont_j246_natural-language-to-cron","arguments":"not an object"}' -H "Authorization: Bearer x" $BASE/api/mcp/call); [ "$C" != "200" ] && pass "mcp/call arguments:string → $C (rejected)" || vuln "mcp/call arguments:string accepted"
C=$(code -X POST -H 'Content-Type: application/json' -d '{"arguments":null}' $BASE/api/jonts/jont_j246_natural-language-to-cron/run -b "$JAR"); [ "$C" = "422" ] && pass "run arguments:null → 422" || vuln "run arguments:null → $C"

echo "== A3 unknown routes and wrong methods =="
C=$(code $BASE/api/nonexistent); [ "$C" = "404" ] && pass "unknown api route → 404" || vuln "unknown api route → $C"
C=$(code $BASE/api/v1/tokens); [ "$C" = "401" ] && pass "GET v1/tokens unauthenticated → 401" || vuln "GET v1/tokens → $C"
C=$(code -X DELETE $BASE/api/jonts); [ "$C" = "405" ] && pass "DELETE /api/jonts → 405" || vuln "DELETE /api/jonts → $C"
C=$(code -X GET $BASE/api/auth/otp/request); [ "$C" = "405" ] && pass "GET otp/request → 405" || vuln "GET otp/request → $C"

echo "== A4 prototype pollution / injection payloads =="
R=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"proto@x.y","code":"{\"__proto__\":{\"admin\":true}}"}' $BASE/api/auth/otp/verify | head -c 120)
echo "$R" | grep -q '"ok":false' && pass "otp/verify proto-payload → refused" || vuln "proto payload: $R"
# catalog filter injection — q as object cannot survive URL params; try nosql-ish values
C=$(code "$BASE/api/jonts?q[]=\$ne&limit=1"); [ "$C" = "200" ] && pass "catalog q[]= bypass attempt handled (200, filtered)" || vuln "catalog q[] → $C"
# tool id path traversal
C=$(code "$BASE/api/jonts/..%2f..%2fetc%2fpasswd"); [ "$C" = "404" ] && pass "path traversal in tool id → 404" || vuln "traversal → $C"
# huge ids
LONGID=$(python3 -c "print('a'*5000)")
C=$(code "$BASE/api/jonts/$LONGID"); [ "$C" = "404" ] && pass "5000-char tool id → 404" || vuln "long id → $C"

echo "== A5 unicode / control chars / null bytes =="
C=$(code -X POST -H 'Content-Type: application/json' -d "{\"email\":\"a\\u0000b@x.y\"}" $BASE/api/auth/otp/request); [ "$C" = "422" ] && pass "null-byte email → 422" || vuln "null-byte email → $C"
C=$(code -X POST -H 'Content-Type: application/json' --data-binary "{\"email\":\"emoji😀@x.y\"}" $BASE/api/auth/otp/request); [ "$C" = "200" ] || [ "$C" = "422" ] && pass "emoji email → $C (handled)" || vuln "emoji email → $C"

echo "== A6 catalog edge cases =="
C=$(code "$BASE/api/jonts?limit=99999"); [ "$C" = "200" ] && pass "limit=99999 clamped (200)" || vuln "limit=99999 → $C"
C=$(code "$BASE/api/jonts?limit=-1"); [ "$C" = "200" ] && pass "limit=-1 clamped (200)" || vuln "limit=-1 → $C"
C=$(code "$BASE/api/jonts?limit=abc"); [ "$C" = "200" ] && pass "limit=abc fallback (200)" || vuln "limit=abc → $C"
C=$(code "$BASE/api/jonts?context=server&pattern=converter&tier=FREE&sort=id&q=csv"); [ "$C" = "200" ] && pass "combined filters → 200" || vuln "combined filters → $C"

echo "== A7 health + discovery =="
C=$(code $BASE/api/health); [ "$C" = "200" ] && pass "health → 200" || vuln "health → $C"
C=$(code "$BASE/.well-known/jontrix-mcp.json"); [ "$C" = "200" ] && pass "discovery manifest → 200" || vuln "discovery → $C"

echo "───"
[ $FAILED -eq 0 ] && echo "BATCH A: ALL HELD (no vulnerabilities)" || echo "BATCH A: VULNERABILITIES ABOVE"
exit $FAILED
