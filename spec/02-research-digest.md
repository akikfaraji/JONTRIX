# Volume 2 — Research Digest (Frozen Evidence Corpus)

**Document:** JONTRIX Build Specification — VOL-02
**Version:** 1.0 (2026-09-03)
**Status:** FROZEN — this volume condenses, never re-opens, the founder's research
**Sources:** `research/` (7 streams, all evidence-graded with URLs, checked 2026-09-02) + `research/opportunities.json` (247 rows × 38 fields)

---

## §1 How This Volume Is Allowed to Be Used

The build agent consumes the corpus in exactly three ways. First, as **evidence for product copy**: every Jont page ships its problem statement as the H1 subtitle (VOL-00 §0.5), and that statement plus its evidence grade comes from the row in `opportunities.json` — not from the build agent's imagination. Second, as **decision weights**: the 10-dimension weighted score and the tier/role assignments are frozen; the build order (VOL-12/13) is mechanical descent, and "I think X is more valuable" is not an argument the build agent is permitted to have. Third, as **constraint memory**: the infra and payments streams encode hard external realities (free-tier caps, rail availability) that Volumes 1, 4, 5, 6 and 14 already absorbed; when those volumes cite a number, the number traces to a row cited here. If a claim in a later volume cannot be traced to this corpus or to VOL-01, it is a bug — file it in `docs/decisions.md`.

**Evidence grades** carry the meaning fixed in VOL-00 §0.6: E1 = first-party (official docs/pricing pages, quoted threads, reproducible bug reports — treat as fact), E2 = reputable second-party (treat as strong signal), E3 = marked inference (validate cheaply post-launch; never over-invest). Row counts by grade across the 247 Jont rows: 79 E1, 15 E2, 153 E3-inherited (long-tail generated rows inherit the grade of the cluster evidence they came from).

## §2 The Seven Streams — What Each Established

| # | Stream (`research/*.md`) | Rows | Established (the one-line version) |
|---|--------------------------|------|------------------------------------|
| 1 | `data-repair.md` | 28 | The flagship zone: PDF/CSV/JSON/bank-statement repair pains are frequent, painful, and currently served by overpriced subscriptions (Acrobat outrage DR-C3, 8.20, E1) or by nothing (bank PDF→CSV DR-F1, 8.03). |
| 2 | `devtools.md` | 20 (B1–B20) | Developer tooling gaps with money attached: Postman free-tier gutting (Feb 2026) opened a migration-search window; SQL dialect conversion pays; large-JSON crashes (DV-B1, 7.58) are a client-side WASM wedge; CORS pain (DV-B3) is the biggest traffic pool; tunnels/JWT/regex head-on = rejected (moat or saturation). |
| 3 | `ecom-smb.md` | 31 | SMB operators drown in manual matching: invoice↔payment reconciliation (EC-C21, 7.58), WhatsApp order chaos (EC-C29, 7.55), feed/catalog maintenance — all automatable, none well served at low price. |
| 4 | `distribution-weird.md` | 25 | Weird-gold long tail: citation verification (WG-G4, 7.60), AI-detector false-positive provenance (WG-G5, 7.55) — E3-heavy, cheap to build, strong SEO long-shots. |
| 5 | `ai-providers.md` | 15 | The AI-fallback market: free tiers exist across multiple providers but churn limits often; the only safe design is rotation + aggressive caching (→ VOL-05 §5), never a hard dependency on one provider. |
| 6 | `infra.md` | 16 sections | The $0 platform exists: Cloudflare Workers 100k req/day, D1 5M rows-read/day, KV 1k writes/day, R2 10 GB zero-egress, Pages unlimited static, free Cron, Queues free at 10k ops/day (Feb 2026 change); Telegram bot caps (30 msg/s broadcast, 20 MB download); Turso 500M reads/mo as the scale escape valve. |
| 7 | `payments.md` | 12 rails | The two working rails for a Bangladesh founder with no bank/card: Stars→Fragment→GRAM→USDT→P2P→bKash (~4–5% total cost, 21-day hold, 1,000-Star min) and crypto-affiliate/USDT P2P (~2%); NOWPayments 0.5–1.5% / 0% withdrawal as the accept-rail; Stripe, PayPal, Lemon Squeezy, Ko-fi, Gumroad, Payhip, Patreon all verified broken; AdsGram pays USDT-TON at $100 min. |

## §3 The Frozen Numbers Every Volume Quotes

These are the only aggregate numbers later volumes may cite. Cluster averages (10-dim weighted composite): **Data & Repair 6.87 > Ecom & SMB 6.44 > DevTools 6.23 > Telegram/BD 6.09 > WeirdGold 5.94 > Media 5.87 > Text 5.77**. Platform-role mix across 247 rows: **HOOK 53 · GLUE 97 · PRO 65 · LTV 32**. Tier-fit mix: **FREE 155 · PRO 79 · MAX 13** — and VOL-01 §4.2 turns that mix into the tier matrix (Free unlocks 155, Pro 234, Max 247). The ten highest-scoring rows, verbatim from the file: DR-C3 8.20, DR-F1 8.03, GT-PDF-extract-DR-C2 7.75, DR-D2 7.67, DR-B2 7.62, DR-H1 7.60, WG-G4 7.60, GT-CSV-split-DR-B2 7.60, GT-CSV-excel-DR-A2 7.60, EC-C21 7.58. Pricing anchors that justify "never undersell": DocuClipper $49.95/mo, DataFeedWatch $59/mo, Postman $14/user/mo, iLovePDF-class $4–12/mo, Acrobat-class $20+/mo.

## §4 Constraint Memory — The External Realities

Four findings function as physical law for this build, and every later volume assumes them rather than re-arguing them. **(1) Cloudflare free-tier caps are daily and hard**: VOL-01 §6's load model and VOL-14's watchdog exist only because a cap breach means failed requests until 00:00 UTC. **(2) KV writes are the scarcest resource** (1,000/day): any design that writes KV per request is rejected on sight (VOL-05 §6). **(3) Stars money is slow and haircut**: net ≈ $0.013/Star, 21-day hold, 1,000-Star minimum — so VOL-01 §5.2's ladder prices Stars for net-parity and VOL-06 §7's payout runbook batches withdrawals monthly. **(4) Crypto is a Bangladesh Bank grey zone, not a ban**: the real operational risk is MFS wallet freezes from many small P2P credits, so the payout protocol (VOL-06 §7) prescribes few, larger, documented conversions — not a compliance strategy but a freeze-avoidance one (FERA 1947 exposure noted honestly, E2).

## §5 What Was Rejected, With Evidence

The corpus also records dead ends, and the build agent must not resurrect them without a new founder directive. Product-side: head-on regex competitors (regex101 moat), JWT tooling (saturated), generic URL shorteners, tunnel services (bandwidth cost). Rail-side: every Stripe/PayPal-dependent checkout (broken for BD), Google AdSense (wire-to-bank only), Payoneer→bank (no bank exists). Distribution-side: cold outreach of any kind (C3 forbids it; every row in the corpus that mentioned "we found this on Reddit/HN" is organic discovery, which the programmatic-SEO + Telegram + extension-store triad replicates honestly). Each rejection is one line in VOL-15 §1's decision ledger with its evidence pointer.
