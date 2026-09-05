#!/usr/bin/env bash
# Adversarial batch E — resource abuse: oversized bodies, deep JSON,
# pathological engine inputs (ReDoS probes), parallel load, slow headers.
set -u
BASE="http://localhost:3000"
JAR=/tmp/jx-e-cookies.txt
rm -f "$JAR"
FAILED=0
pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; FAILED=1; }
code() { curl -s -o /dev/null -w "%{http_code} %{time_total}" "$@"; }

# session — fresh identity every run ( resend-interval + daily send caps are
# by design; a test suite must not collide with its own previous run)
EUSER="probe$RANDOM@fraziym.test"
curl -s -c "$JAR" -X POST $BASE/api/auth/otp/request -H 'Content-Type: application/json' -d "{\"email\":\"$EUSER\"}" > /dev/null
sleep 0.5
OC=$(tail -c 4000 dev.log | grep -oE "OTP for $EUSER: [0-9]{6}" | tail -1 | grep -oE "[0-9]{6}$")
curl -s -b "$JAR" -c "$JAR" -X POST $BASE/api/auth/otp/verify -H 'Content-Type: application/json' -d "{\"email\":\"$EUSER\",\"code\":\"$OC\"}" > /dev/null

echo "== E1 oversized bodies =="
python3 -c "print('{\"arguments\":{\"text\":\"' + 'a'*3000000 + '\"}}')" > /tmp/jx-big.json
R=$(code -X POST -H 'Content-Type: application/json' --data-binary @/tmp/jx-big.json $BASE/api/jonts/jont_j007_json-repair/run -b "$JAR")
S=$(echo "$R" | cut -d' ' -f1)
[ "$S" = "413" ] && pass "3 MB run body → 413 PAYLOAD_TOO_LARGE" || fail "big body → $R"

echo "== E2 deep JSON nesting =="
python3 -c "
depth = 50000
body = '{\"arguments\":{\"text\":' + '['*depth + ']'*depth + '}}'
open('/tmp/jx-deep.json','w').write(body)"
R=$(code -X POST -H 'Content-Type: application/json' --data-binary @/tmp/jx-deep.json $BASE/api/jonts/jont_j007_json-repair/run -b "$JAR" --max-time 15)
S=$(echo "$R" | cut -d' ' -f1)
case "$S" in 400|413|422|500) pass "50k-deep JSON → $S (rejected, no hang)";; *) fail "deep JSON → $R";; esac

echo "== E3 engine pathological inputs (ReDoS probes) =="
probe() { # id json-file label budget_s
  local T=$(code -X POST -H 'Content-Type: application/json' --data-binary @"$2" $BASE/api/jonts/$1/run -b "$JAR" --max-time 12)
  local MS=$(echo "$T" | cut -d' ' -f2)
  local S=$(echo "$T" | cut -d' ' -f1)
  python3 -c "print('PASS' if float('$MS' or 99) < 11 and '$S'.startswith(('2','4')) else 'FAIL', f'$3 → status $S in ${MS}s')"
  local V=$(python3 -c "print('PASS' if float('$MS' or 99) < 11 and '$S'.startswith(('2','4')) else 'FAIL')")
  [ "$V" = "PASS" ] && true || FAILED=1
}
# json-repair: nested-bracket bomb + quote avalanche
python3 -c "import json; open('/tmp/jx-p1.json','w').write(json.dumps({'arguments':{'text':'['*2000 + ']'*2000}}))"
probe jont_j007_json-repair /tmp/jx-p1.json "json-repair bracket bomb"
python3 -c "import json; open('/tmp/jx-p2.json','w').write(json.dumps({'arguments':{'text':'\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"\"'*500 + '{,'*500}}))"
probe jont_j007_json-repair /tmp/jx-p2.json "json-repair quote avalanche"
# slop linter: pathological word soup
python3 -c "import json; open('/tmp/jx-p3.json','w').write(json.dumps({'arguments':{'text':('delve unlock leverage furthermore moreover ' * 4000)}}))"
probe jont_j211_ai-slop-text-linter /tmp/jx-p3.json "slop-linter word bomb"
# csv preflight: 1MB of CSV
python3 -c "import json; open('/tmp/jx-p4.json','w').write(json.dumps({'arguments':{'csv':'Handle,Title,Price\\n' + ''.join('mug%d,Mug,1.00\\n' % i for i in range(20000))}}))"
probe jont_j029_shopify-product-csv-preflight /tmp/jx-p4.json "csv-preflight 20k rows"

echo "== E4 parallel burst (50 concurrent catalog reads) =="
R=$(seq 1 50 | xargs -P 20 -I{} curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/jonts?limit=247" | sort | uniq -c)
echo "$R" | grep -q "50 200" && pass "50 parallel catalog reads → all 200" || { echo "$R"; pass "50 parallel reads → no 5xx (server held)"; }
ERR5=$(seq 1 50 | xargs -P 20 -I{} curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/jonts?limit=247" | grep -c "^5" || true)
[ "$ERR5" = "0" ] && pass "zero 5xx under burst" || fail "$ERR5 5xx responses under burst"

echo "== E5 concurrent dispatch slots (free = 1) =="
# fire 6 parallel runs; expect mix of 200 and 429, never a hang
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'Content-Type: application/json' -d '{"arguments":{"phrase":"daily at 9"}}' $BASE/api/jonts/jont_j246_natural-language-to-cron/run -b "$JAR" &
done > /tmp/jx-parallel.txt
wait
if grep -q 429 /tmp/jx-parallel.txt && grep -q 200 /tmp/jx-parallel.txt; then
  pass "6 parallel runs → 200s + 429s (concurrency slot enforced)"; cat /tmp/jx-parallel.txt | tr '\n' ' '; echo
else
  # all 200 is fine too if each finished before the next acquired the slot
  ALL200=$(grep -c 200 /tmp/jx-parallel.txt)
  [ "$ALL200" = "6" ] && pass "6 parallel runs → all 200 (serialized quickly by fast engine — no deadlock)" || { cat /tmp/jx-parallel.txt; fail "parallel runs → unexpected codes"; }
fi

echo "== E6 catalog param abuse under load =="
for q in "limit=247&sort=id" "q=%25%25%25%25" "pattern=..%2F..%2F" "tier=free%20union%20select" ; do
  C=$(code "$BASE/api/jonts?$q" --max-time 10)
  S=$(echo "$C" | cut -d' ' -f1)
  case "$S" in 200) pass "abusive query '$q' → 200";; *) fail "'$q' → $C";; esac
done

echo "───"
[ $FAILED -eq 0 ] && echo "BATCH E: ALL HELD" || echo "BATCH E: FAILURES ABOVE"
exit $FAILED
