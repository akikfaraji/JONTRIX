#!/usr/bin/env bash
# One-shot E2E: boot dev server, prove mail delivery + Google OAuth chain,
# capture evidence, then let the server die with the tool call.
# Usage: bash scripts/e2e-mail-oauth.sh
set -u
cd /home/z/my-project

TEST_EMAIL="fraziymtech+jontrixtest@gmail.com"

pkill -f "next dev" 2>/dev/null; sleep 1
rm -f dev.log
setsid npm run dev < /dev/null > /dev/null 2>&1 &

echo "== waiting for server =="
READY=0
for i in $(seq 1 45); do
  sleep 2
  if curl -sf -m 3 http://localhost:3000/api/health > /dev/null 2>&1; then
    READY=1; echo "ready after ~$((i*2))s"; break
  fi
done
if [ "$READY" -ne 1 ]; then echo "SERVER NEVER BECAME READY"; tail -20 dev.log; exit 1; fi

echo; echo "== [1] catalog =="
curl -s -m 30 http://localhost:3000/api/jonts -o /tmp/jonts.json -w "HTTP %{http_code}\n"
python3 - <<'PY'
import json
try:
    d = json.load(open('/tmp/jonts.json'))
    data = d.get('data', d)
    items = data.get('items', data) if isinstance(data, dict) else data
    print(f"catalog jonts: {len(items)}")
except Exception as e:
    print(f"catalog parse: {e}")
PY

echo; echo "== [2] register (real SMTP delivery test) =="
curl -s -m 30 -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"T3st-Only-Lab-2026!x\"}" \
  -o /tmp/reg.json -w "HTTP %{http_code}\n"
head -c 400 /tmp/reg.json; echo

echo; echo "== [3] oauth google status =="
curl -s -m 15 http://localhost:3000/api/auth/oauth/google/status -w "\nHTTP %{http_code}\n"

echo; echo "== [4] oauth google start (expect 302 -> accounts.google.com) =="
curl -s -m 15 -o /dev/null -D - http://localhost:3000/api/auth/oauth/google/start | head -8

echo; echo "== [5] mailer evidence from dev.log =="
rg -n "mail|smtp|delivered|message|queued|driver" dev.log | rg -vi "smtp.gmail.com.*(password|pass)" | tail -15 || echo "(no mail lines matched)"

echo; echo "== [6] health (final) =="
curl -s -m 5 http://localhost:3000/api/health; echo
