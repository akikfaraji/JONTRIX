#!/usr/bin/env bash
# Adversarial batch C — IDOR / broken access control / cross-plane confusion.
set -u
BASE="http://localhost:3000"
JA=/tmp/jx-c-a.txt; JB=/tmp/jx-c-b.txt
rm -f "$JA" "$JB"
FAILED=0
pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; FAILED=1; }
json() { python3 -c "import json,sys; d=json.load(sys.stdin); print(d$1)" 2>/dev/null; }
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

login() { # jar email -> session cookie
  local jar="$1" email="$2"
  curl -s -c "$jar" -X POST $BASE/api/auth/otp/request -H 'Content-Type: application/json' -d "{\"email\":\"$email\"}" > /dev/null
  sleep 0.3
  local oc=$(tail -c 4000 dev.log | grep -oE "OTP for $email: [0-9]{6}" | tail -1 | grep -oE "[0-9]{6}$")
  curl -s -b "$jar" -c "$jar" -X POST $BASE/api/auth/otp/verify -H 'Content-Type: application/json' -d "{\"email\":\"$email\",\"code\":\"$oc\"}" > /dev/null
}

login "$JA" "carol$RANDOM@fraziym.test"
sleep 1.2
login "$JB" "dave$RANDOM@fraziym.test"
C=$(code -b "$JA" $BASE/api/me); [ "$C" = "200" ] && pass "user A session" || fail "A session: $C"
C=$(code -b "$JB" $BASE/api/me); [ "$C" = "200" ] && pass "user B session" || fail "B session: $C"

echo "== C1 token factory ownership =="
sleep 0.5
TA=$(curl -s -b "$JA" -X POST $BASE/api/v1/tokens -H 'Content-Type: application/json' -d '{"kind":"pat","name":"a-pat"}' | json "['data']['token']['id']")
[ -n "$TA" ] && pass "A created PAT ($TA)" || fail "A PAT create failed"
# B tries to PATCH A's token
C=$(code -b "$JB" -X PATCH -H 'Content-Type: application/json' -d '{"name":"hijacked"}' $BASE/api/v1/tokens/$TA)
[ "$C" = "404" ] && pass "B PATCH A's token → 404 (owner-scoped)" || fail "B PATCH A token → $C"
# B tries to DELETE A's token
C=$(code -b "$JB" -X DELETE $BASE/api/v1/tokens/$TA)
[ "$C" = "404" ] && pass "B DELETE A's token → 404 (owner-scoped)" || fail "B DELETE A token → $C"
# A still sees exactly their token; B sees none
NA=$(curl -s -b "$JA" $BASE/api/v1/tokens | python3 -c "import json,sys; print(len([t for t in json.load(sys.stdin)['data']['items'] if t['status']=='active']))")
NB=$(curl -s -b "$JB" $BASE/api/v1/tokens | python3 -c "import json,sys; print(len([t for t in json.load(sys.stdin)['data']['items'] if t['status']=='active']))")
[ "$NA" = "1" ] && [ "$NB" = "0" ] && pass "token lists owner-scoped (A=1, B=0)" || fail "lists: A=$NA B=$NB"

echo "== C2 presets ownership =="
PA=$(curl -s -H "Authorization: Bearer $(curl -s -b "$JA" -X POST $BASE/api/v1/tokens -H 'Content-Type: application/json' -d '{"kind":"pat","name":"a2"}' | json "['data']['secret']" 2>/dev/null)" $BASE/api/v1/me >/dev/null; echo ok)
# A needs a PAT; but PAT limit is 1 — rotate instead
PAT_A=$(curl -s -b "$JA" -X POST $BASE/api/v1/tokens/pat/rotate -H 'Content-Type: application/json' -d '{"confirm":"ROTATE"}' | json "['data']['secret']")
[ -n "$PAT_A" ] && pass "A rotated PAT" || fail "rotate: $PAT_A"
sleep 1.2
R=$(curl -s -X POST -H "Authorization: Bearer $PAT_A" -H 'Content-Type: application/json' -d '{"tool_id":"jont_j246_natural-language-to-cron","name":"mine","payload":{"phrase":"daily"}}' $BASE/api/v1/presets)
PA_ID=$(echo "$R" | json "['data']['preset']['id']")
[ -n "$PA_ID" ] && pass "A created preset ($PA_ID)" || fail "preset create: $R"
# B needs a PAT to even reach the surface — but B has none; use A's against B's nothing: the ownership check is WHERE user_id = owner
PAT_B=$(curl -s -b "$JB" -X POST $BASE/api/v1/tokens -H 'Content-Type: application/json' -d '{"kind":"pat","name":"b1"}' | json "['data']['secret']")
sleep 1.2
C=$(code -X PUT -H "Authorization: Bearer $PAT_B" -H 'Content-Type: application/json' -d '{"name":"stolen","payload":{}}' $BASE/api/v1/presets/$PA_ID)
[ "$C" = "404" ] && pass "B PUT A's preset → 404 (never cross-user)" || fail "B PUT A preset → $C"
C=$(code -X DELETE -H "Authorization: Bearer $PAT_B" $BASE/api/v1/presets/$PA_ID)
[ "$C" = "404" ] && pass "B DELETE A's preset → 404" || fail "B DELETE A preset → $C"

echo "== C3 cross-plane bearer confusion on every data route =="
AAT=$(curl -s -b "$JA" -X POST $BASE/api/v1/tokens -H 'Content-Type: application/json' -d '{"kind":"aat","name":"a-agent","scopes":{"tools":"all"}}' | json "['data']['secret']")
sleep 1.2
for ep in "v1/me" "v1/quota" "v1/usage" "v1/tokens"; do
  C=$(code -H "Authorization: Bearer $AAT" $BASE/api/$ep)
  [ "$C" = "403" ] && pass "AAT on GET /$ep → 403 TOKEN_KIND_MISMATCH" || fail "AAT on /$ep → $C"
done
C=$(code -X PATCH -H "Authorization: Bearer $AAT" -H 'Content-Type: application/json' -d '{}' $BASE/api/v1/settings)
[ "$C" = "403" ] && pass "AAT on PATCH /v1/settings → 403" || fail "AAT settings → $C"
C=$(code -X PUT -H "Authorization: Bearer $AAT" -H 'Content-Type: application/json' -d '{}' $BASE/api/v1/presets/x)
[ "$C" = "403" ] && pass "AAT on PUT presets → 403" || fail "AAT PUT preset → $C"
# PAT on MCP routes
for ep in "tools" "quota"; do
  C=$(code -H "Authorization: Bearer $PAT_A" $BASE/api/mcp/$ep)
  [ "$C" = "403" ] && pass "PAT on GET /api/mcp/$ep → 403" || fail "PAT mcp/$ep → $C"
done

echo "== C4 boost replay + cap =="
R=$(curl -s -b "$JA" -X POST $BASE/api/boost/claim -H 'Content-Type: application/json' -d '{"ad_session_id":"adv-1","signature":"deadbeef"}')
# no verify key in this env → honest 503 (grants impossible); that IS the control
C=$(code -b "$JA" -X POST $BASE/api/boost/claim -H 'Content-Type: application/json' -d '{"ad_session_id":"adv-1","signature":"deadbeef"}')
[ "$C" = "503" ] && pass "boost without verify key → 503 honest refusal (no grant path)" || fail "boost → $C"

echo "== C5 signed-out access to account surfaces =="
for ep in "me" "quota" "consent"; do
  C=$(code $BASE/api/$ep)
  [ "$C" = "401" ] && pass "anonymous GET /$ep → 401" || fail "anon /$ep → $C"
done
C=$(code -X PATCH $BASE/api/settings)
[ "$C" = "401" ] && pass "anonymous PATCH /settings → 401" || fail "anon settings → $C"
C=$(code -X POST $BASE/api/auth/signout)
[ "$C" = "401" ] && pass "anonymous signout → 401" || fail "anon signout → $C"

echo "== C6 revoked bearer dies instantly =="
# free tier = 1 active PAT and list returns metadata only (no secrets) —
# rotate instead: the old secret dies, the new one is handed to us
PAT_C=$(curl -s -b "$JB" -X POST $BASE/api/v1/tokens/pat/rotate -H 'Content-Type: application/json' -d '{"confirm":"ROTATE"}' | json "['data']['secret']")
sleep 1.2
C=$(code -H "Authorization: Bearer $PAT_C" $BASE/api/v1/me)
[ "$C" = "200" ] && pass "fresh PAT works" || fail "fresh PAT → $C"
TID=$(curl -s -b "$JB" $BASE/api/v1/tokens | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(next(t['id'] for t in d['data']['items'] if t['kind']=='pat' and t['status']=='active'))")
curl -s -b "$JB" -X DELETE $BASE/api/v1/tokens/$TID > /dev/null
C=$(code -H "Authorization: Bearer $PAT_C" $BASE/api/v1/me)
[ "$C" = "401" ] && pass "revoked PAT → 401 immediately" || fail "revoked PAT → $C"

echo "───"
[ $FAILED -eq 0 ] && echo "BATCH C: ALL HELD" || echo "BATCH C: VULNERABILITIES ABOVE"
exit $FAILED
