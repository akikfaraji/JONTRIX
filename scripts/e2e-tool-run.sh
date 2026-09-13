#!/usr/bin/env bash
# One-shot: boot, sign in, run REAL server engines end-to-end, probe unbuilt refusal.
set -u
cd /home/z/my-project
pkill -f "next dev" 2>/dev/null; sleep 1; rm -f dev.log
setsid npm run dev < /dev/null > /dev/null 2>&1 &
for i in $(seq 1 30); do sleep 2; curl -sf -m 3 http://localhost:3000/api/health >/dev/null 2>&1 && break; done
echo "server ready"

JAR=/tmp/jontrix-cookies.txt
rm -f "$JAR"

echo; echo "== sign in (fresh test user) =="
curl -s -m 20 -c "$JAR" -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"fraziymtech+toolrun@gmail.com","password":"T3st-Only-Lab-2026!y"}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('register:', 'ok' if d.get('ok') else d)"

echo; echo "== catalog build status counts =="
curl -s -m 20 "http://localhost:3000/api/jonts?limit=300" | python3 -c "
import json,sys
d = json.load(sys.stdin)
items = d['data']['items']
from collections import Counter
print('total:', len(items), dict(Counter(i['status'] for i in items)))
"

echo; echo "== [T1] json-repair (server engine) =="
curl -s -m 20 -b "$JAR" -X POST http://localhost:3000/api/jonts/jont_j007_json-repair/run \
  -H 'Content-Type: application/json' \
  -d '{"arguments":{"input":"{\"name: \"jontrix\", \"tools\": 247, broken: true,}"}}' \
  -w "\nHTTP %{http_code}\n" | head -c 700

echo; echo "== [T2] jwt-decoder-verifier (server engine) =="
curl -s -m 20 -b "$JAR" -X POST http://localhost:3000/api/jonts/jont_j224_jwt-decoder-verifier/run \
  -H 'Content-Type: application/json' \
  -d '{"arguments":{"jwt":"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJqb250cml4In0.dQw4w9WgXcQsignature123"}}' \
  -w "\nHTTP %{http_code}\n" | head -c 700

echo; echo "== [T3] nl-to-cron (server engine) =="
curl -s -m 20 -b "$JAR" -X POST http://localhost:3000/api/jonts/jont_j246_natural-language-to-cron/run \
  -H 'Content-Type: application/json' \
  -d '{"arguments":{"text":"every monday at 9am"}}' \
  -w "\nHTTP %{http_code}\n" | head -c 700

echo; echo "== [T4] UNBUILT tool refusal (honest?) =="
curl -s -m 20 -b "$JAR" -X POST http://localhost:3000/api/jonts/jont_j001/run \
  -H 'Content-Type: application/json' -d '{"arguments":{}}' \
  -w "\nHTTP %{http_code}\n" | head -c 300

echo; echo "== [T5] NO AUTH → what user sees if session lost =="
curl -s -m 20 -X POST http://localhost:3000/api/jonts/jont_j007_json-repair/run \
  -H 'Content-Type: application/json' -d '{"arguments":{"input":"{}"}}' \
  -w "\nHTTP %{http_code}\n" | head -c 300

echo; echo "== [T6] tool status endpoint (form schema source) =="
curl -s -m 20 http://localhost:3000/api/jonts/jont_j007_json-repair | head -c 500
echo
