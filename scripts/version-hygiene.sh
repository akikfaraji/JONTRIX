#!/usr/bin/env bash
# VOL-00 §0.7 / VOL-03 §2 version-hygiene check (G-05 / T3.2).
# The full FRAZIYM version regex must appear in exactly ONE source file
# (src/version.ts) plus the append-only CHANGELOG.md. Any other hit fails.
set -uo pipefail

REGEX='V[0-9]{2}\.[0-9]{2}\.[0-9]{3}(-[a-z]+-[0-9]{2})?'
ALLOWED="src/version.ts CHANGELOG.md"

hits=$(rg -l "$REGEX" \
  --glob '!node_modules/**' --glob '!.next/**' --glob '!bun.lock' \
  --glob '!package-lock.json' --glob '!*.log' --glob '!db/**' \
  --glob '!jontrix/**' --glob '!research/**' --glob '!tool-results/**' \
  --glob '!spec/**' --glob '!docs/**' --glob '!.zscripts/**' \
  . 2>/dev/null || true)

fail=0
for f in $hits; do
  norm="${f#./}"   # rg prints ./src/version.ts; ALLOWED lists src/version.ts
  if ! printf '%s\n' $ALLOWED | grep -qx "$norm"; then
    echo "HYGIENE FAIL: version literal found in $f"
    fail=1
  fi
done

if [ "$fail" -eq 0 ]; then
  echo "version hygiene — ALL GREEN (literal confined to src/version.ts + CHANGELOG.md)"
fi
exit "$fail"
