#!/usr/bin/env bash
# Auth stack acceptance — register/login/forgot/reset/change/verify + OAuth guards.
set -u
BASE="http://localhost:3000"
JAR=/tmp/jx-auth-cookies.txt
JAR2=/tmp/jx-auth-cookies-2.txt
rm -f "$JAR" "$JAR2"
FAILED=0
pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; FAILED=1; }
json() { python3 -c "import json,sys; d=json.load(sys.stdin); print(d$1)" 2>/dev/null; }
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
# paced login (the per-IP burst limiter is 10 req/10 s — stay under it)
llogin() { sleep 1.1; curl -s "$@" -X POST -H 'Content-Type: application/json' "$BASE/api/auth/login"; }
lcode() { sleep 1.1; curl -s -o /dev/null -w "%{http_code}" "$@" -X POST -H 'Content-Type: application/json' "$BASE/api/auth/login"; }

EMAIL="alice+$RANDOM@fraziym.test"
PW="correct-horse-battery-7"

echo "== B1 registration validation =="
C=$(code -X POST -H 'Content-Type: application/json' -d '{"email":"bad-email","password":"long-enough-123"}' $BASE/api/auth/register)
[ "$C" = "422" ] && pass "register bad-email → 422" || fail "register bad-email → $C"
C=$(code -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"short\"}" $BASE/api/auth/register)
[ "$C" = "422" ] && pass "register weak password → 422" || fail "register weak → $C"
C=$(code -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"password123\"}" $BASE/api/auth/register)
[ "$C" = "422" ] && pass "register common password → 422" || fail "register common → $C"
R=$(curl -s -c "$JAR" -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\",\"display_name\":\"Alice\"}" $BASE/api/auth/register)
H=$(echo "$R" | json "['data']['handle']")
[ "$(echo "$R" | json "['ok']")" = "True" ] && pass "register ok → handle=$H (session cookie set)" || fail "register: $R"
C=$(code -b "$JAR" $BASE/api/me)
[ "$C" = "200" ] && pass "auto-signed-in after register (me → 200)" || fail "me after register → $C"
C=$(code -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"other-pass-99\"}" $BASE/api/auth/register)
[ "$C" = "409" ] && pass "duplicate register → 409 (no enumeration leak via create)" || fail "dup register → $C"

echo "== B2 login =="
C=$(lcode -d "{\"email\":\"$EMAIL\",\"password\":\"wrong-pass-99\"}")
[ "$C" = "401" ] && pass "login wrong password → 401" || fail "login wrong → $C"
C=$(lcode -d '{"email":"nobody@nowhere.zz","password":"wrong-pass-99"}')
[ "$C" = "401" ] && pass "login unknown email → 401 (same shape)" || fail "login unknown → $C"
rm -f "$JAR2"
R=$(llogin -c "$JAR2" -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}")
[ "$(echo "$R" | json "['data']['email_verified']")" = "False" ] && pass "login ok → email_verified=false" || fail "login: $R"

echo "== B3 login lockout (5 fails/day) =="
for i in 1 2 3 4 5; do
  sleep 1.1
  curl -s -o /dev/null -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"wrong-pass-99\"}" $BASE/api/auth/login
done
C=$(lcode -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}")
[ "$C" = "429" ] && pass "6th attempt (even with RIGHT password) → 429 locked" || fail "lockout → $C"

echo "== B4 forgot/reset (recovery from lockout) =="
R=$(curl -s -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\"}" $BASE/api/auth/password/forgot)
[ "$(echo "$R" | json "['ok']")" = "True" ] && pass "forgot → always-200 generic response" || fail "forgot: $R"
R2=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"email":"ghost@nowhere.zz"}' $BASE/api/auth/password/forgot)
[ "$(echo "$R" | json "['data']['message']")" = "$(echo "$R2" | json "['data']['message']")" ] && pass "forgot response identical for known/unknown email (no enumeration)" || fail "enumeration leak"
sleep 1
TOKEN=$(tail -n 400 dev.log | grep -oiE "reset-password\?token=[A-Za-z0-9_-]+" | tail -1 | sed 's/.*token=//')
[ -n "$TOKEN" ] && pass "reset token delivered via mail log driver" || fail "no reset token in log"
NEWPW="sturdy-cliff-river-42"
R=$(curl -s -X POST -H 'Content-Type: application/json' -d "{\"token\":\"$TOKEN\",\"password\":\"$NEWPW\"}" $BASE/api/auth/password/reset)
[ "$(echo "$R" | json "['data']['reset']")" = "True" ] && pass "reset ok" || fail "reset: $R"
C=$(code -X POST -H 'Content-Type: application/json' -d "{\"token\":\"$TOKEN\",\"password\":\"another-pass-88\"}" $BASE/api/auth/password/reset)
[ "$C" = "401" ] && pass "reset token replay → 401 (single-use)" || fail "token replay → $C"
C=$(code -b "$JAR2" $BASE/api/me)
[ "$C" = "401" ] && pass "old session revoked after reset (family kill)" || fail "old session survived: $C"
rm -f "$JAR2"
R=$(llogin -c "$JAR2" -d "{\"email\":\"$EMAIL\",\"password\":\"$NEWPW\"}")
[ "$(echo "$R" | json "['ok']")" = "True" ] && pass "reset clears lockout — login with NEW password ok" || fail "new pw login: $R"

echo "== B5 change password =="
C=$(code -b "$JAR2" -X POST -H 'Content-Type: application/json' -d '{"current_password":"wrong-pass-99","new_password":"yet-another-pass-55"}' $BASE/api/auth/password/change)
[ "$C" = "401" ] && pass "change with wrong current → 401" || fail "change wrong current → $C"
C=$(code -b "$JAR2" -X POST -H 'Content-Type: application/json' -d '{"current_password":"wrong-pass-99","new_password":"weak"}' $BASE/api/auth/password/change)
[ "$C" = "401" ] && pass "auth-first ordering: wrong current checked before strength (401)" || fail "weak new → $C"
C=$(code -b "$JAR2" -X POST -H 'Content-Type: application/json' -d "{\"current_password\":\"$NEWPW\",\"new_password\":\"yet-another-pass-55\"}" $BASE/api/auth/password/change)
[ "$C" = "200" ] && pass "change ok" || fail "change → $C"
C=$(code -b "$JAR2" $BASE/api/me)
[ "$C" = "200" ] && pass "current session survives change" || fail "current session killed: $C"
rm -f "$JAR"
R=$(llogin -c "$JAR" -d "{\"email\":\"$EMAIL\",\"password\":\"yet-another-pass-55\"}")
[ "$(echo "$R" | json "['ok']")" = "True" ] && pass "login with changed password ok" || fail "changed pw login: $R"

echo "== B6 email verification =="
sleep 1
VTOKEN=$(tail -n 500 dev.log | grep -oE "api/auth/verify-email\?token=[A-Za-z0-9_-]+" | tail -1 | sed 's/.*token=//')
[ -n "$VTOKEN" ] && pass "verify token delivered" || fail "no verify token in log"
BODY=$(curl -s -b "$JAR" "$BASE/api/auth/verify-email?token=$VTOKEN")
echo "$BODY" | grep -q "Email verified" && pass "verify link consumes token → success landing" || fail "verify landing: $(echo "$BODY" | head -c 100)"
C=$(code -X POST -H 'Content-Type: application/json' -d "{\"token\":\"$VTOKEN\"}" $BASE/api/auth/verify-email)
[ "$C" = "401" ] && pass "verify token replay → 401 (single-use)" || fail "verify replay → $C"
R=$(llogin -d "{\"email\":\"$EMAIL\",\"password\":\"yet-another-pass-55\"}")
[ "$(echo "$R" | json "['data']['email_verified']")" = "True" ] && pass "login now reports email_verified=true" || fail "verified flag: $R"

echo "== B7 resend verification + abuse caps =="
R=$(curl -s -b "$JAR2" -X POST $BASE/api/auth/resend-verification)
[ "$(echo "$R" | json "['data']['sent']")" = "False" ] && pass "resend for verified email → honest no-op" || fail "resend verified: $R"

echo "== B8 OAuth guards =="
C=$(code "$BASE/api/auth/oauth/google")
[ "$C" = "503" ] && pass "unconfigured google → 503 honest refusal" || fail "google unconfigured → $C"
C=$(code "$BASE/api/auth/oauth/github")
[ "$C" = "503" ] && pass "unconfigured github → 503 honest refusal" || fail "github unconfigured → $C"
C=$(code "$BASE/api/auth/oauth/microsoft")
[ "$C" = "404" ] && pass "unknown provider → 404" || fail "unknown provider → $C"
C=$(code "$BASE/api/auth/oauth/google/callback?code=x&state=y")
[ "$C" = "400" ] && pass "forged callback state → 400 (state consume fails)" || fail "forged state → $C"

echo "== B9 OTP regression (still works alongside passwords) =="
JAR3=/tmp/jx-auth-cookies-3.txt; rm -f "$JAR3"
C=$(code -c "$JAR3" -X POST -H 'Content-Type: application/json' -d '{"email":"founder@fraziym.test"}' $BASE/api/auth/otp/request)
[ "$C" = "200" ] && pass "otp request → 200 (driver reported)" || fail "otp request → $C"
OC=$(tail -c 3000 dev.log | grep -oE "OTP for founder@fraziym\.test: [0-9]{6}" | tail -1 | grep -oE "[0-9]{6}$")
R=$(curl -s -b "$JAR3" -c "$JAR3" -X POST -H 'Content-Type: application/json' -d "{\"email\":\"founder@fraziym.test\",\"code\":\"$OC\"}" $BASE/api/auth/otp/verify)
[ "$(echo "$R" | json "['ok']")" = "True" ] && pass "otp verify → session (coexists with password auth)" || fail "otp verify: $R"

echo "== B10 OTP resend-interval anti-flood =="
C=$(code -b "$JAR3" -X POST -H 'Content-Type: application/json' -d '{"email":"founder@fraziym.test"}' $BASE/api/auth/otp/request)
[ "$C" = "429" ] && pass "immediate second otp request → 429 (30s resend interval)" || fail "resend interval → $C"

echo "───"
[ $FAILED -eq 0 ] && echo "AUTH SWEEP: ALL GREEN" || echo "AUTH SWEEP: FAILURES ABOVE"
exit $FAILED
