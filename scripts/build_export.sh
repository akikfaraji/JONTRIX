#!/bin/bash
OUT=/home/z/my-project/download/FRAZIYM_Research_Export_Phase1.md
mkdir -p /home/z/my-project/download
{
cat << 'HDR'
# FRAZIYM $1/DAY ECOSYSTEM — PHASE 1 RESEARCH EXPORT
**Export date:** 2026-09-02 · **Status:** Interim (6 of 7 research streams complete; developer-tooling stream pending)
**Client constraints:** $0 budget · Android/Termux · no bank/card · bKash/Nagad/Rocket/crypto in · no client work · <10 min/week maintenance · $1/day within ~1 month target

**Evidence legend:** E1 = direct community post/issue (strongest) · E2 = verified product/pricing/docs fact · E3 = reasonable inference (must be validated before building)

**Streams in this export:**
1. Data & File Repair Pain (2-a) — 28 problems, 18 facts
2. Free AI Provider Free Tiers (2-d) — 15 providers verified 2026-09-02
3. Free Infrastructure (2-e) — full $0 stack verified
4. Distribution + Weird Markets (2-g) — 25 pain rows, 10 distribution facts
5. E-commerce + SMB Documents (2-c) — 31 problems, 14 facts
6. Bangladesh Payment Rails (2-f) — 12-rail ledger, fee chains
7. Developer Tooling (2-b) — 20 problems, 14 facts

---

HDR
echo ""
echo "# SECTION 1 — DATA & FILE REPAIR PAIN (Task 2-a)"
echo ""
cat research/data-repair.md
echo ""
echo "---"
echo ""
echo "# SECTION 2 — FREE AI PROVIDERS (Task 2-d)"
echo ""
cat research/ai-providers.md
echo ""
echo "---"
echo ""
echo "# SECTION 3 — FREE INFRASTRUCTURE (Task 2-e)"
echo ""
cat research/infra.md
echo ""
echo "---"
echo ""
echo "# SECTION 4 — DISTRIBUTION + WEIRD MARKETS (Task 2-g)"
echo ""
cat research/distribution-weird.md
echo ""
echo "---"
echo ""
echo "# SECTION 5 — E-COMMERCE + SMB DOCUMENTS (Task 2-c)"
echo ""
cat research/ecom-smb.md
echo ""
echo "---"
echo ""
echo "# SECTION 6 — BANGLADESH PAYMENT RAILS (Task 2-f)"
echo ""
cat research/payments.md
} > "$OUT.tmp"
{
cat "$OUT.tmp"
echo ""
echo "---"
echo ""
echo "# SECTION 7 — DEVELOPER TOOLING (Task 2-b)"
echo ""
cat research/devtools.md
} > "$OUT"
rm -f "$OUT.tmp"
wc -l "$OUT"
