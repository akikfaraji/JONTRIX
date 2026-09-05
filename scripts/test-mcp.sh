#!/usr/bin/env bash
# VOL-10 acceptance sweep — T10.15, T10.2/T10.2b, T10.5, T10.6-ish, T10.7, T10.14
set -u
BASE="http://localhost:3000"
JAR=/tmp/jx-mcp-cookies.txt
rm -f "$JAR"

pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; FAILED=1; }
FAILED=0

json() { python3 -c "import json,sys; d=json.load(sys.stdin); print(d$1)"; }

# ── setup: session + AAT + PAT ─────────────────────────────────────────────
EMAIL="founder$RANDOM@fraziym.test"
curl -s -c "$JAR" -X POST $BASE/api/auth/otp/request -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\"}" > /dev/null
CODE=$(tail -c 4000 dev.log | strings | grep -oE "OTP for [^ ]*founder[^ ]*: [0-9]{6}" | tail -1 | grep -oE "[0-9]{6}$")
curl -s -b "$JAR" -c "$JAR" -X POST $BASE/api/auth/otp/verify -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}" > /dev/null

# clean slate: revoke any tokens left by a previous run (limits are 1/1 on free)
for id in $(curl -s -b "$JAR" $BASE/api/v1/tokens | python3 -c "
import json,sys
d=json.load(sys.stdin)
for t in d['data']['items']:
    if t['status']=='active': print(t['id'])
"); do
  curl -s -b "$JAR" -X DELETE $BASE/api/v1/tokens/$id > /dev/null
done

AAT=$(curl -s -b "$JAR" -X POST $BASE/api/v1/tokens -H 'Content-Type: application/json' -d '{"kind":"aat","name":"cursor-main","scopes":{"tools":"all"}}' | json "['data']['secret']")
PAT=$(curl -s -b "$JAR" -X POST $BASE/api/v1/tokens -H 'Content-Type: application/json' -d '{"kind":"pat","name":"terminal"}' | json "['data']['secret']")
echo "setup: AAT=${AAT:0:12}… PAT=${PAT:0:12}…"
[ -n "$AAT" ] && [ -n "$PAT" ] || { echo "FATAL: token setup failed"; exit 1; }

# ── T10.15 PAT kind isolation on every /api/mcp/* route ────────────────────
for ep in "tools" "quota"; do
  R=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $PAT" $BASE/api/mcp/$ep)
  C=$(curl -s -H "Authorization: Bearer $PAT" $BASE/api/mcp/$ep | json "['error']['code']" 2>/dev/null)
  [ "$R" = "403" ] && [ "$C" = "TOKEN_KIND_MISMATCH" ] && pass "T10.15 PAT on GET /api/mcp/$ep → 403 TOKEN_KIND_MISMATCH" || fail "T10.15 PAT on /api/mcp/$ep → $R/$C"
done
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $PAT" -H 'Content-Type: application/json' -d '{"tool":"jont_j007_json-repair","arguments":{"text":"{}"}}' $BASE/api/mcp/call)
C=$(curl -s -X POST -H "Authorization: Bearer $PAT" -H 'Content-Type: application/json' -d '{"tool":"jont_j007_json-repair","arguments":{"text":"{}"}}' $BASE/api/mcp/call | json "['error']['code']")
[ "$R" = "403" ] && [ "$C" = "TOKEN_KIND_MISMATCH" ] && pass "T10.15 PAT on POST /api/mcp/call → 403 TOKEN_KIND_MISMATCH" || fail "T10.15 PAT on call → $R/$C"

# ── T10.1/T10.2 device flow via pasted AAT ─────────────────────────────────
DEV=$(curl -s -X POST $BASE/api/mcp/login/device -H 'Content-Type: application/json' -d '{"agent_name":"test-agent","client_hint":"conformance/1.0"}')
DC=$(echo "$DEV" | json "['device_code']")
UC=$(echo "$DEV" | json "['user_code']")
echo "device: user_code=$UC"
[ ${#DC} -ge 40 ] && pass "§4.2 device_code issued (43-char class)" || fail "device_code too short"
echo "$UC" | grep -qE '^JX-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$' && pass "§4.2 user_code unambiguous format" || fail "user_code format: $UC"

P1=$(curl -s -X POST $BASE/api/mcp/login/device/poll -H 'Content-Type: application/json' -d "{\"device_code\":\"$DC\"}")
[ "$(echo "$P1" | json "['status']")" = "pending" ] && pass "§4.3 poll → pending" || fail "poll pending: $P1"

# approve via pasted AAT (browser flow POST /api/mcp/login, attach)
APPROVE=$(curl -s -X POST $BASE/api/mcp/login -H 'Content-Type: application/json' -d "{\"user_code\":\"$UC\",\"via\":\"paste\",\"aat\":\"$AAT\"}")
echo "$APPROVE" | grep -q "return to your terminal" && pass "§3.1 approve via pasted AAT" || fail "approve: $(echo $APPROVE | head -c 200)"

PAIR=$(curl -s -X POST $BASE/api/mcp/login/device/poll -H 'Content-Type: application/json' -d "{\"device_code\":\"$DC\"}")
SESS_ACCESS=$(echo "$PAIR" | json "['access_token']")
SESS_REFRESH=$(echo "$PAIR" | json "['refresh_token']")
[ "$(echo "$PAIR" | json "['token_type']")" = "Bearer" ] && pass "§4.3 success → session pair" || fail "pair: $PAIR"

# device_code burned
P2=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/mcp/login/device/poll -H 'Content-Type: application/json' -d "{\"device_code\":\"$DC\"}")
[ "$P2" = "410" ] && pass "§4.3 second poll → 410 (code burned)" || fail "burn: $P2"

# ── T10.5 scope isolation (deny-listed AAT; revoke the all-scoped one first —
#    free tier allows exactly 1 active AAT) ──────────────────────────────────
AAT_ID=$(curl -s -b "$JAR" $BASE/api/v1/tokens | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(next(t['id'] for t in d['data']['items'] if t['kind']=='aat' and t['status']=='active'))")
curl -s -b "$JAR" -X DELETE $BASE/api/v1/tokens/$AAT_ID > /dev/null
AAT2=$(curl -s -b "$JAR" -X POST $BASE/api/v1/tokens -H 'Content-Type: application/json' -d '{"kind":"aat","name":"scoped-agent","scopes":{"tools":{"deny":["jont_j007_json-repair"]}}}' | json "['data']['secret']")
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $AAT2" -H 'Content-Type: application/json' -d '{"tool":"jont_j007_json-repair","arguments":{"text":"{}"}}' $BASE/api/mcp/call)
C=$(curl -s -X POST -H "Authorization: Bearer $AAT2" -H 'Content-Type: application/json' -d '{"tool":"jont_j007_json-repair","arguments":{"text":"{}"}}' $BASE/api/mcp/call | json "['error']['code']")
[ "$R" = "403" ] && [ "$C" = "FORBIDDEN_TOOL" ] && pass "T10.5 deny-listed tool → 403 FORBIDDEN_TOOL" || fail "T10.5 → $R/$C"
R=$(curl -s -X POST -H "Authorization: Bearer $AAT2" -H 'Content-Type: application/json' -d '{"tool":"jont_j224_jwt-decoder-verifier","arguments":{"token":"x.y.z"}}' $BASE/api/mcp/call | json "['ok']")
[ "$R" = "True" ] && pass "T10.5 identical call via allowed scope succeeds" || fail "T10.5 allowed call: $R"

# tools list omission for scoped-out tool (§4.5)
LISTED=$(curl -s -H "Authorization: Bearer $AAT2" $BASE/api/mcp/tools | python3 -c "import json,sys; d=json.load(sys.stdin); names=[t['name'] for t in d['tools']]; print('jont_j007_json-repair' in names)")
[ "$LISTED" = "False" ] && pass "§4.5 scoped-out tool omitted from list" || fail "§4.5 omission: $LISTED"

# ── success call + metering via session pair ───────────────────────────────
CALL=$(curl -s -X POST -H "Authorization: Bearer $SESS_ACCESS" -H 'Content-Type: application/json' -d '{"tool":"jont_j246_natural-language-to-cron","arguments":{"phrase":"daily at 9"}}' $BASE/api/mcp/call)
Cron=$(echo "$CALL" | json "['result']['data']['cron']")
[ "$Cron" = "0 9 * * *" ] && pass "§4.6 call via session → executed" || fail "call: $(echo $CALL | head -c 300)"

# ── T10.14 idempotency replay ──────────────────────────────────────────────
KEY="opt-test-$(date +%s)"
C1=$(curl -s -X POST -H "Authorization: Bearer $SESS_ACCESS" -H 'Content-Type: application/json' -d "{\"tool\":\"jont_j246_natural-language-to-cron\",\"arguments\":{\"phrase\":\"hourly\"},\"idempotency_key\":\"$KEY\"}" $BASE/api/mcp/call)
C2=$(curl -s -X POST -H "Authorization: Bearer $SESS_ACCESS" -H 'Content-Type: application/json' -d "{\"tool\":\"jont_j246_natural-language-to-cron\",\"arguments\":{\"phrase\":\"hourly\"},\"idempotency_key\":\"$KEY\"}" $BASE/api/mcp/call)
RP=$(echo "$C2" | json "['replayed']")
[ "$RP" = "True" ] && pass "T10.14 replay → replayed:true, no re-execution" || fail "T10.14: $C2"

# ── quota snapshot shape (§4.7) ────────────────────────────────────────────
Q=$(curl -s -H "Authorization: Bearer $SESS_ACCESS" $BASE/api/mcp/quota)
T=$(echo "$Q" | json "['tier']"); M=$(echo "$Q" | json "['mcp']['calls_limit_month']")
[ "$T" = "free" ] && [ "$M" = "40" ] && pass "§4.7 quota snapshot (free/40)" || fail "quota: $Q"

# ── T10.7 refresh rotation + theft detection ───────────────────────────────
R1=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $SESS_REFRESH" $BASE/api/mcp/refresh)
REPLAY=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $SESS_REFRESH" $BASE/api/mcp/refresh)
[ "$R1" = "200" ] && [ "$REPLAY" = "401" ] && pass "T10.7 refresh 200 then replay → 401 session_revoked" || fail "T10.7: $R1/$REPLAY"
# family is dead: the old access must now fail (it was in the same family)
OLD_ACCESS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $SESS_ACCESS" $BASE/api/mcp/quota)
[ "$OLD_ACCESS" = "401" ] && pass "T10.7 family revoked (old access → 401)" || fail "family: $OLD_ACCESS"

# ── 422 arguments + 404 unknown tool (via AAT2 — all-scoped except j007) ───
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $AAT2" -H 'Content-Type: application/json' -d '{"tool":"jont_j246_natural-language-to-cron","arguments":{}}' $BASE/api/mcp/call)
[ "$R" = "422" ] && pass "§4.10 arguments fail schema → 422" || fail "422: $R"
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer $AAT2" -H 'Content-Type: application/json' -d '{"tool":"jont_nope","arguments":{}}' $BASE/api/mcp/call)
[ "$R" = "404" ] && pass "§4.10 unknown tool → 404" || fail "404: $R"

# ── discovery manifest renders (DoD) ───────────────────────────────────────
D=$(curl -s -o /dev/null -w "%{http_code}" $BASE/.well-known/jontrix-mcp.json)
[ "$D" = "200" ] && pass "§4.9 discovery manifest renders" || fail "discovery: $D"

echo "───"
[ $FAILED -eq 0 ] && echo "MCP SWEEP: ALL GREEN" || echo "MCP SWEEP: FAILURES ABOVE"
exit $FAILED
