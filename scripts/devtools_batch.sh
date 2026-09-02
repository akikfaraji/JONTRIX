#!/bin/bash
# Atomic devtools search batch — survives flaky sessions by finishing all searches in one run.
cd /home/z/my-project
LOG=research/batch_log.txt
: > "$LOG"

run_search() {
  local out="$1"; local query="$2"; local tries=0
  while [ $tries -lt 3 ]; do
    tries=$((tries+1))
    if z-ai function -n web_search -a "{\"query\": \"$query\", \"num\": 8}" -o "$out" >> "$LOG" 2>&1; then
      if [ -s "$out" ]; then echo "OK $out (try $tries)" >> "$LOG"; return 0; fi
    fi
    echo "RETRY $out (try $tries failed)" >> "$LOG"; sleep 8
  done
  echo "FAIL $out" >> "$LOG"; return 1
}

run_search research/s_b7.json  "ngrok free plan limits pricing complaint alternative localhost tunnel"
sleep 2
run_search research/s_b8.json  "webhook testing tool inspect requests local development request bin"
sleep 2
run_search research/s_b11.json "cron expression confusing how to write every 15 minutes generator"
sleep 2
run_search research/s_b12.json "MCP model context protocol server debugging tools gaps developers"
sleep 2
run_search research/s_b13.json "JWT debugger decoder tool token debugging"
sleep 2
run_search research/s_b14.json "json schema generator from json example tool"
sleep 2
run_search research/s_b15.json "r/SideProject dev tool launched got users reddit feedback"
sleep 2
run_search research/s_b16.json "reqbin online api tool pricing free webhook.site limits"
sleep 2
run_search research/s_b17.json "epoch timestamp converter timezone confusing developers"

echo "=== BATCH DONE ===" >> "$LOG"
ls -la research/s_b*.json >> "$LOG" 2>&1
cat "$LOG"
