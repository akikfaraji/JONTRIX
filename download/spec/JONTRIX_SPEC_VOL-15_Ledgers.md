# Volume 15 — Ledgers (the Records That Outlive the Build)

**Document:** JONTRIX Build Specification — VOL-15
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED
**Depends on:** VOL-00 §0.6 (evidence grades), VOL-02 (corpus), VOL-06 §7 (payouts), VOL-14 §6–7 (ops). Referenced by: every volume's decision requirements.

---

## §1 The Decision Ledger (`docs/decisions.md` — append-only, required)

Every AGENT CHOICE (VOL-00 §0.1), every tie-breaker-ladder invocation (§0.1's four-step ladder), every FALLBACK activation, every exception this spec grants, lands here as one row. Format contract — a row is exactly: `YYYY-MM-DD · TASK-ID or phase · decision in one sentence · the alternative rejected · the constraint or spec clause that governs · evidence pointer (file, URL, or command output)`. The ledger is append-only: corrections are new rows that supersede, never edits (a superseded row is struck through, not deleted, so the history of a mistake stays auditable). The DoD sweep (VOL-14 §1, G-39) verifies every AGENT CHOICE in the spec has a matching row, and the founder reads the ledger at each release gate — it is the durable record of *why the machine built what it built*. **MUST:** one row per decision, same day it was taken; **NEVER** a batch "misc decisions" row, a deleted row, or a decision that cites nothing.

## §2 The Evidence Ledger (claim → source → grade → date)

Every external claim used in product copy or in a build decision carries a ledger row: the claim, its source URL, its grade (E1/E2/E3 per VOL-00 §0.6), and the date checked. The corpus already provides ~1,200 of these (the seven research streams' citations); this ledger's job afterwards is small and vital: new claims surface only when the founder adds a directive, a provider changes terms (e.g. a free tier shrinks — the VOL-05 §5 provider table and VOL-01 §6 load model both cite rows here), or a FALLBACK is evaluated. Format: `claim · source · grade · checked-date · used-by (volume §)`. When a cited fact goes stale (a pricing page changes, a free tier dies), the row is updated with a `rechecked-date` and every volume that cites it appears in the next digest — that is how the spec stays true without re-research projects.

## §3 The Payout Ledger (implements VOL-06 §7)

Monthly, append-only, founder-owned: `month · Stars earned (Stars) · Stars withdrawable (post-21-day-hold) · Stars withdrawn (GRAM value) · USDT received (NOWPayments) · USDT converted via P2P (amount, rate, venue, MFS receipt ref) · fees & haircuts (Stars haircut, P2P spread) · net BDT to hand`. Two invariants make it honest: every number traces to a D1 source (`stars_purchases`, `invoices`) or a saved receipt reference — the ledger reconciles, it does not estimate; and the freeze-avoidance rule (one batch conversion per month, few large credits, saved receipts) is visible in the rows themselves — a month with twelve P2P conversions is a self-reported protocol violation, not a bookkeeping style. The monthly cron (VOL-06 §7) drafts the row; the founder confirms it in one message. This ledger is also the founder's tax-season artifact — which is exactly why it never lives in the product's marketing copy.

## §4 The Incident Ledger (operates VOL-14 §7)

One row per incident: `id · date · severity (S1/S2/S3) · surface(s) · cause in one sentence · resolution in one sentence · minutes of human time · brake states used · prevent-class (design | provider | founder-error | unknown)`. The quarterly review reads only this ledger to answer the C4 question — "is the platform actually under 10 minutes/week?" — and to pick the one automation that would remove the most repeated class. **MUST:** incidents land within 24 h of discovery, including the embarrassing ones; S1 rows cross-reference the `usage_ledger` events. **NEVER:** a post-mortem longer than its incident row (three sentences is the format), or a "no incidents" month with no rows (an empty month is itself a row: `no-incident`, so the record never silently lies).

## §5 The Jont Registry Ledger (frozen-score discipline)

The registry is data with a history: each regeneration of `spec/catalog/jonts.seed.json` (VOL-13 §4) appends a row here — `date · trigger (founder directive | new evidence batch) · rows added/removed/score-changed · seed checksum before/after · db:verify result`. The invariants this ledger protects: scores are frozen between founder directives (VOL-02 §1); tier-fit counts only change 155/79/13 → new values by founder sign-off (VOL-04 §6 check 4 makes silent drift a build failure); renames touch `name`/`slug` only, never `src_id` (VOL-13 §1). When VOL-12/13 cards are refined at build time (names, FAQs, fixtures), the refinement ships with a row: `card-refined · J0xx · field(s) touched · why`. **NEVER** a registry change without a ledger row — this is the mechanism that keeps the "frozen" promise auditable rather than aspirational.

## §6 The Maintenance Ledger (the C4 proof)

Every manual intervention beyond the crons — deploys, incident fixes, founder actions like payout conversions and store-listing submissions — logs `date · task · minutes`. The ledger answers to the quarter: total minutes/week averaged, the worst week, and the dominant class. If the quarterly average exceeds 10 minutes/week (C4), the next roadmap iteration (VOL-14 §8) must include the automation or elimination of the top class — that consequence is automatic, not optional. The build agent populates this ledger during the build itself (its own interventions count): a build that needed hours of weekly babysitting before launch would surface here honestly, before the founder inherits it.
