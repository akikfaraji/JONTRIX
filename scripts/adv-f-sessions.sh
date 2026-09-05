#!/usr/bin/env bash
# Adversarial batch F — session management + account deletion.
# Covers: list/revoke, revoke-others, IDOR on foreign session ids,
# cookie death after self-revoke, deletion proof (password + confirm),
# post-deletion login death and data anonymization. Run against dev server.
set -u
BASE="${1:-http://localhost:3000}"
PASS=0; FAIL=0
ck() { # ck <name> <expected> <actual>
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  PASS  $1";
  else FAIL=$((FAIL+1)); echo "  FAIL  $1 (want $2 got $3)"; fi
}
jqget() { python3 -c "import json,sys;d=json.load(sys.stdin);print(eval(sys.argv[1]))" "$1" 2>/dev/null; }

STAMP="$(date +%s)-$RANDOM"

# ── setup: two users, two devices for user A ────────────────────────────────
EA="sessf.a.${STAMP}@test.local"; EB="sessf.b.${STAMP}@test.local"; PW="correct-horse-battery-9"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/register" -H 'content-type: application/json' \
  -d "{\"email\":\"$EA\",\"password\":\"$PW\"}")
ck "register A" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/register" -H 'content-type: application/json' \
  -d "{\"email\":\"$EB\",\"password\":\"$PW\"}")
ck "register B" "200" "$code"

curl -s -c /tmp/fa1.jar -X POST "$BASE/api/auth/login" -H 'content-type: application/json' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) Firefox/128.0' -H 'x-forwarded-for: 10.9.0.1' \
  -d "{\"email\":\"$EA\",\"password\":\"$PW\"}" > /dev/null
curl -s -c /tmp/fa2.jar -X POST "$BASE/api/auth/login" -H 'content-type: application/json' \
  -H 'user-agent: Chrome/126.0' -H 'x-forwarded-for: 10.9.0.2' \
  -d "{\"email\":\"$EA\",\"password\":\"$PW\"}" > /dev/null
curl -s -c /tmp/fb.jar -X POST "$BASE/api/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"$EB\",\"password\":\"$PW\"}" > /dev/null

# ── list sessions ────────────────────────────────────────────────────────────
# register auto-signs-in (session 1), then two logins (sessions 2, 3)
n=$(curl -s -b /tmp/fa1.jar "$BASE/api/auth/sessions" | jqget "len(d['data']['sessions'])")
ck "A sees 3 sessions (register+2 logins)" "3" "$n"
cur=$(curl -s -b /tmp/fa1.jar "$BASE/api/auth/sessions" | jqget "sum(1 for s in d['data']['sessions'] if s['current'])")
ck "exactly 1 marked current" "1" "$cur"
ua=$(curl -s -b /tmp/fa1.jar "$BASE/api/auth/sessions" | jqget "d['data']['sessions'][0]['user_agent'][:7]")
ck "newest session first (Chrome)" "Chrome/" "$ua"

S2=$(curl -s -b /tmp/fa2.jar "$BASE/api/auth/sessions" | jqget "[s['id'] for s in d['data']['sessions'] if s['current']][0]")

# ── auth required ────────────────────────────────────────────────────────────
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/sessions")
ck "sessions without cookie → 401" "401" "$code"

# ── IDOR: B tries to revoke A's session ─────────────────────────────────────
res=$(curl -s -b /tmp/fb.jar -X DELETE "$BASE/api/auth/sessions?id=$S2" -o /dev/null -w "%{http_code}")
ck "foreign session id → 404 (no leak)" "404" "$res"
alive=$(curl -s -b /tmp/fa2.jar -o /dev/null -w "%{http_code}" "$BASE/api/auth/sessions")
ck "A2 session still alive after IDOR attempt" "200" "$alive"

# bogus id → same 404
code=$(curl -s -b /tmp/fa1.jar -X DELETE "$BASE/api/auth/sessions?id=nonexistent000" -o /dev/null -w "%{http_code}")
ck "bogus id → 404" "404" "$code"
code=$(curl -s -b /tmp/fa1.jar -X DELETE "$BASE/api/auth/sessions" -o /dev/null -w "%{http_code}")
ck "missing id → 422" "422" "$code"

# ── revoke-others from A1 (kills register-session + A2) ──────────────────────
cnt=$(curl -s -b /tmp/fa1.jar -X POST "$BASE/api/auth/sessions/revoke-others" | jqget "d['data']['revoked']")
ck "revoke-others count" "2" "$cnt"
dead=$(curl -s -b /tmp/fa2.jar -o /dev/null -w "%{http_code}" "$BASE/api/auth/sessions")
ck "A2 cookie dead after revoke-others" "401" "$dead"
alive=$(curl -s -b /tmp/fa1.jar -o /dev/null -w "%{http_code}" "$BASE/api/auth/sessions")
ck "A1 survives revoke-others" "200" "$alive"

# revoked session's refresh cannot resurrect (replay guard fires)
curl -s -b /tmp/fa2.jar -o /dev/null "$BASE/api/auth/sessions"
curl -s -b /tmp/fa2.jar -o /dev/null "$BASE/api/auth/sessions"
code=$(curl -s -b /tmp/fa2.jar -o /dev/null -w "%{http_code}" "$BASE/api/auth/sessions")
ck "A2 stays dead (no refresh zombie)" "401" "$code"

# ── self-revoke kills the cookie ─────────────────────────────────────────────
S1=$(curl -s -b /tmp/fa1.jar "$BASE/api/auth/sessions" | jqget "[s['id'] for s in d['data']['sessions'] if s['current']][0]")
cur=$(curl -s -b /tmp/fa1.jar -X DELETE "$BASE/api/auth/sessions?id=$S1" | jqget "d['data']['current']")
ck "self-revoke reports current" "True" "$cur"
dead=$(curl -s -b /tmp/fa1.jar -o /dev/null -w "%{http_code}" "$BASE/api/auth/sessions")
ck "A1 cookie dead after self-revoke" "401" "$dead"

# ── account deletion ─────────────────────────────────────────────────────────
EC="del.c.${STAMP}@test.local"
curl -s -c /tmp/fc.jar -X POST "$BASE/api/auth/register" -H 'content-type: application/json' \
  -d "{\"email\":\"$EC\",\"password\":\"$PW\"}" > /dev/null

code=$(curl -s -b /tmp/fc.jar -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/account/delete" \
  -H 'content-type: application/json' -d '{"password":"wrong-password-1"}')
ck "delete with wrong password → 401" "401" "$code"

code=$(curl -s -b /tmp/fc.jar -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/account/delete" \
  -H 'content-type: application/json' -d '{}')
ck "delete without password → 422" "422" "$code"

ok=$(curl -s -b /tmp/fc.jar -X POST "$BASE/api/auth/account/delete" \
  -H 'content-type: application/json' -d "{\"password\":\"$PW\"}" | jqget "d['data']['deleted']")
ck "delete with right password" "True" "$ok"

code=$(curl -s -b /tmp/fc.jar -o /dev/null -w "%{http_code}" "$BASE/api/auth/sessions")
ck "cookie dead after deletion" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" -H 'content-type: application/json' \
  -d "{\"email\":\"$EC\",\"password\":\"$PW\"}")
ck "login after deletion → 401" "401" "$code"

# anonymization: the raw email is gone from the users table
anon=$(npx tsx scripts/adv-f-anon-check.ts "$EC" 2>/dev/null | tail -1)
ck "email anonymized in db" "ANONYMIZED" "$anon"

# OAuth-only deletion path: confirm:DELETE
ED="del.d.${STAMP}@test.local"
curl -s -c /tmp/fd.jar -X POST "$BASE/api/auth/otp/request" -H 'content-type: application/json' -d "{\"email\":\"$ED\"}" > /dev/null
ODC=$(rg -o "OTP for $ED: ([0-9]{6})" -r '$1' dev.log | tail -1)
curl -s -c /tmp/fd.jar -X POST "$BASE/api/auth/otp/verify" -H 'content-type: application/json' \
  -d "{\"email\":\"$ED\",\"code\":\"$ODC\"}" > /dev/null
code=$(curl -s -b /tmp/fd.jar -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/account/delete" \
  -H 'content-type: application/json' -d '{"confirm":"nope"}')
ck "OTP-only delete, bad confirm → 422" "422" "$code"
ok=$(curl -s -b /tmp/fd.jar -X POST "$BASE/api/auth/account/delete" \
  -H 'content-type: application/json' -d '{"confirm":"DELETE"}' | jqget "d['data']['deleted']")
ck "OTP-only delete with DELETE" "True" "$ok"

# ── health + headers ──────────────────────────────────────────────────────────
h=$(curl -s "$BASE/api/health" | jqget "d['ok']")
ck "health ok" "True" "$h"
v=$(curl -s "$BASE/api/health" | jqget "d['version']")
ck "health carries version" "V00.00.000-beta-01" "$v"
csp=$(curl -sI "$BASE/api/health" | rg -i "content-security-policy" | head -1 | cut -c1-10)
[ -n "$csp" ] && r="PRESENT" || r="MISSING"
ck "CSP header present" "PRESENT" "$r"
xff=$(curl -sI "$BASE/api/health" | rg -i "x-frame-options" | head -1 | cut -c1-6)
[ -n "$xff" ] && r="PRESENT" || r="MISSING"
ck "X-Frame-Options present" "PRESENT" "$r"

rm -f /tmp/fa1.jar /tmp/fa2.jar /tmp/fb.jar /tmp/fc.jar /tmp/fd.jar
echo "───"
echo "BATCH F: $PASS PASS, $FAIL FAIL"
[ "$FAIL" = "0" ]
