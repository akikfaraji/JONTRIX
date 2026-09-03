# Volume 15 — The Ledger: Revenue, Costs & Unit Economics

**Document:** JONTRIX Build Specification — VOL-15
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED structure; numbers evolve with reality (the ledger is the only place they may)
**Depends on:** VOL-01 §5 (rails), VOL-04 §4 (payments rows), VOL-06 §8 (payout path), VOL-08 §5 (boost), VOL-02 §6 (ads baseline). Referenced by: VOL-14 (founder reporting, DoD).

---

## §1 What the Ledger Is (LOCKED)

One honest, script-generated record of every dollar, Star, and cost the platform touches — the founder's single source of financial truth, generated from first-party data (the `payments`/`webhook_events` tables, provider statements) and never hand-edited. It exists because C1's "$0/month" claim and C8's honesty standard are *testable assertions*, and someone has to keep score: **`scripts/ledger.ts` reads D1 + provider statement CSVs and emits `docs/ledger/2026-MM.csv` + a monthly summary block** — revenue by rail, ad revenue, costs, net, and the per-tier unit economics (§6). **MUST:** every number in the ledger traces to a `payments` row, a provider statement line, or a cost invoice; **NEVER** an adjustment without an audit row explaining it.

## §2 The Monthly Statement Structure (LOCKED)

One CSV per UTC month, one row per financial event, plus fixed summary fields:

```
event_id, date_utc, kind, rail, gross, fee, net, currency, hold_days, ref, note
kinds: subscription.stars | subscription.usdt | ads.adsgram | payout.out |
       cost.infra | cost.ai | cost.domain | grant.internal | adjustment
```

**MUST:** `gross − fee = net` holds on every row (arithmetic, not accounting opinion); Stars rows carry `hold_days=21` and a `available_after` date so cashflow is visible before the Fragment payout lands; **NEVER** a revenue row without its `webhook_event_id`/statement-line reference.

## §3 Money-In Recording Rules (LOCKED)

**Stars rail:** the `payments` row (Stars amount) is gross; the fee column records Telegram's implied haircut using the verified net rate (≈ $0.013/Star net vs $0.0133 web price, VOL-01 §5.1) so the statement shows both gross Stars and net USD; the 21-day hold and 1,000 ⭐ minimum are modeled as `hold_days` + a payout-eligibility flag, not as lost revenue. **USDT rail:** NOWPayments fee 0.5–1.5% is recorded from the processor's own invoice data; P2P cash-out costs (~2%) belong to the *payout* row (§7), not the revenue row — revenue is what the wallet receives. **Grants:** the founder's own test/grant accounts are `grant.internal` rows, always visible — the ledger must make it impossible to mistake a test purchase for revenue (C8 applies to the founder first).

## §4 Ads Revenue (D-02) (LOCKED)

AdsGram pays in Stars on provider statements with the same 21-day hold; the ledger records one `ads.adsgram` row per statement line (statement CSV dropped into `docs/ledger/statements/` monthly), converted at the same net rate as §3 so ads and subs compare honestly in one column. **MUST:** boost *grants* (`boost_ledger`) are usage events, not revenue — the only ad money in the ledger comes from statements; **MUST:** the monthly summary reports `ads_revenue`, `ads_revenue_per_1k_free_dau`, and the eCPM baseline from VOL-02 §6 ($1–3) so the < $1.00 kill-switch decision (VOL-01 §5.5) is data-driven, not vibes; **NEVER** an ad-revenue figure in marketing copy — ads are the founder's business, not the user's promise.

## §5 Cost Recording (LOCKED)

The cost side keeps C1 honest: **infra** rows exist only for the domain renewal(s) and any founder-approved C1 exception (Workers Paid $5/mo, requires the `docs/decisions.md` sign-off of VOL-01 §6); **AI costs** record provider usage against free tiers — the AI router's monthly usage (VOL-05 §10 counters × provider rates) is projected *before* a tier is exceeded, so the moment a provider's free tier would be breached, the ledger flags it and the fallback ladder (provider order → degrade → deterministic-only) fires per C1; **cost.domain** is the only guaranteed recurring row. **MUST:** a month with $0 infra spend other than domains prints exactly that; **NEVER** a silent paid-tier upgrade anywhere in the stack — the watchdog's mode flags (VOL-01 §6) and the ledger cross-check each other.

## §6 Unit Economics (LOCKED baseline, live numbers)

Monthly summary computes, per tier: **net revenue per active subscriber** (after rail fees), **conversion rate** (paid/free signups), **MCP-attachment rate** (AATs created ÷ paid users), and **free-tier cost headroom** (D1/Workers usage vs caps, from the watchdog totals). Baselines for judgment: Pro $4.99 → net ≈ $4.86 (USDT) / ≈ $5.20 (Stars, VOL-01 §5.2); ads baseline ≈ $150–400/mo at S1 with 25% opt-in (VOL-02 §6); the conversion lever dominates ads by ~3× at S1 — which is why D-01 (Free MCP = 40) exists. **MUST:** the summary states DAU and scenario (S0/S1/S2) so numbers are read against the load model, never floating alone.

## §7 Payout Reconciliation (LOCKED)

Payout rows (`payout.out`) record the founder's money-out events (VOL-06 §8 path): Fragment/GRAM conversions, NOWPayments sweeps to self-custody, P2P sales to bKash/Nagad with their ~2% cost. The ledger reconciles: revenue rows net → hold expiry → payout row, with the runbook's arithmetic (VOL-14 §7) referencing these rows. **MUST:** payout rows land within 48 h of the founder's actual move (a statement line or manual entry with reference); **NEVER** an automated withdrawal (no key material in Workers, VOL-06 §8) and never a payout row that lacks a source revenue linkage.

## §8 Reporting Cadence (LOCKED)

The monthly statement generates on the 1st (cron) with the watchdog digest (VOL-14 §6); the summary block is ≤ 20 lines by contract — founder-readable in one glance: revenue by rail, ads + eCPM, costs, net, conversions, headroom flags, payout pipeline (in-hold amounts). Quarterly, the ledger cross-checks the honesty claims: C1 statement (total infra spend), pricing-honesty invariants (VOL-01 §5.6), and boost economics vs the kill-switch threshold. **NEVER** a metric in the summary that the D1 tables cannot reproduce.

## §9 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T15.1 | Seeded payments month | `scripts/ledger.ts` | CSV rows match `payments` 1:1; gross−fee=net holds; grant rows flagged |
| T15.2 | Stars subscription | ledger row | gross Stars + net USD + hold_days=21 + available_after date |
| T15.3 | AdsGram statement CSV | drop-in + run | one row per line; eCPM vs baseline computed; kill-switch flag evaluated |
| T15.4 | AI usage at 90% of provider free tier | monthly compute | cost row projected; fallback-ladder flag fired before breach (C1) |
| T15.5 | Test purchase by founder account | ledger render | appears as `grant.internal`, never revenue |
| T15.6 | Payout event | reconciliation | links source revenue rows; P2P fee in the payout row; balances tie |
| T15.7 | Summary block | one glance | ≤ 20 lines; every number reproducible from D1 + statements |

**DoD hooks (VOL-14):** "ledger generates + reconciles for launch month" (G-37), "C1 cost statement: $0 infra beyond domains/exceptions" (G-38), "founder grant rows visible and separated" (G-39).
