#!/bin/bash
# usage: search.sh "query" [num] [recency_days]
Q="$1"; N="${2:-6}"; R="$3"
for i in 1 2 3 4 5; do
  if [ -n "$R" ]; then
    OUT=$(z-ai function -n web_search -a "{\"query\": \"$Q\", \"num\": $N, \"recency_days\": $R}" 2>&1)
  else
    OUT=$(z-ai function -n web_search -a "{\"query\": \"$Q\", \"num\": $N}" 2>&1)
  fi
  if echo "$OUT" | grep -q '"url"'; then
    echo "$OUT" | grep -E '"(name|snippet|date|url)"'
    exit 0
  fi
  sleep 45
done
echo "SEARCH_FAILED: $Q"
