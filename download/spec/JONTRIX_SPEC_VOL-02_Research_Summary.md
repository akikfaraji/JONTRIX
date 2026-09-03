# Volume 2 — Research Summary & Evidence Base

**Document:** JONTRIX Build Specification — VOL-02
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED (summary of frozen evidence; grades per VOL-00 §0.6)
**Depends on:** VOL-00 §0.6 (grading legend). Referenced by: VOL-01 (thesis), VOL-07 §5 (SEO), VOL-12/13 (catalog), VOL-15 (unit economics).

---

## §1 What This Volume Is

The founder's research corpus lives in `research/` (seven streams: data-repair, devtools, ecom-smb, distribution-weird, ai-providers, infra, payments) and is **frozen** — the build agent never re-researches and never re-prioritizes. This volume condenses the findings that shape build-time judgment: why the catalog is shaped the way it is, which numbers marketing copy may cite, and where every load-bearing claim in the spec comes from. When a Jont card (VOL-12) says "score 7.58" or a pricing claim says "$49.95/mo replacement," the citation resolves here or to the underlying file.

## §2 The Opportunity Database (LOCKED)

`research/opportunities.json` holds **247 scored Jonts** across **7 zones** and **16 families**, each row with 38 fields including a 10-dimension weighted score, `platform_role ∈ {HOOK, GLUE, PRO, LTV}`, and `tier_fit ∈ {FREE, PRO, MAX}`. The distribution that drives the tier matrix (VOL-01 §4.2): **155 FREE-fit** (the hook mass), **79 PRO-fit** (the conversion shelf), **13 MAX-fit** (the LTV flagships). Zone average scores, highest first: Data & Repair 6.87, Ecom/SMB 6.44, DevTools 6.23, then the long tail — the ordering is why the personas of VOL-01 §2.1 exist and why the SEO program (VOL-07 §5) leads with data-repair pages.

## §3 The Driver Rows (LOCKED marketing citations)

| Row | Finding | Score | Grade | Where it is used |
|---|---|---|---|---|
| **DR-C3** | "Acrobat-subscription outrage" — users resent $20+/mo for one transformation needed twice a month | 8.20 | E1 | VOL-01 §1 thesis; PWA pricing-page copy may cite the pattern (never the brand name) |
| **DR-F1** | Bank-statement PDF→CSV is a top-converting, repeat-pain job; incumbents charge $49.95/mo (DocuClipper class) | 8.03 | E1/E2 | MAX-fit flagship Jont card; pricing anchor |
| **DR-D2** | "Tool-stitching meta-pain" — the real job is chaining 5 small tools across 5 paywalls | 7.67 | E2 | The one-subscription-unlocks-everything pitch (VOL-01 §3.1); presets/chaining emphasis in VOL-11 |
| DV-B1 | Large-JSON tooling crashes / browser tab death | 7.58 | E2 | DevTools wedge for the Agent Operator persona; MCP-catalog anchor |
| EC-C21 / EC-C29 | Invoice matching 7.58 · WhatsApp order triage 7.55 | — | E2 | Mini App surface emphasis (VOL-08) |

**MUST:** any public copy citing research uses the *pattern* and the *number*, not scraped quotes or brand mockery (C8); **NEVER** an invented statistic — if a number is not in this file or the JSON, it does not ship.

## §4 Distribution Facts That Shaped the Surfaces (E2 unless noted)

The four surfaces and their growth rails are downstream of these findings: **programmatic SEO** works but new domains need 3–12 months (hence SEO pages ship at Phase 4, C3); **Telegram Mini Apps** are a proven distribution + payments container (75k+ apps, $1B+ volume, native Stars; tap-to-earn churn is the cautionary tale — utility, not dopamine, is the retention play); **Chrome Web Store** review is slow but the listing is a free permanent channel (extension ships with store-ready assets, VOL-09); **MCP directories** are the zero-cost listing for the gateway (VOL-10 §5.1). Product Hunt, Reddit, and directory blasts are launch-week tactics at most — the evergreen channels are SEO + Telegram + the two stores.

## §5 Payments & Infra Facts (LOCKED inputs)

`research/payments.md` (Sept 2026): Stars net ≈ $0.013/Star with 21-day hold and 1,000 ⭐ minimum; NOWPayments fees 0.5–1.5%, ~$2–5 minimum, no refunds; Paddle 3% + $1 via Payoneer (FALLBACK); everything card/bank-dependent is broken for this founder (C2). `research/infra.md` (Sept 2026): the Cloudflare free caps quoted in VOL-01 §6 (Workers 100k req/day; D1 5M reads/100k writes/day; KV 100k/1k; R2 10 GB) — every load computation in the spec traces to this file, and the hard-brake contract exists because S2 breaches two caps. **MUST:** these numbers are re-verified only if the founder re-freezes the research (a `research/` file change is a spec revision event, not a build-agent judgment call).

## §6 Ads Economics Context (D-02)

AdsGram (Mini App rewarded video) pays in Stars at the same ≈$0.013 net with the same 21-day hold; South-Asia-weighted eCPM for rewarded placements is roughly $1–3, which is why VOL-01 §5.5 sizes the Boost program as honest supplemental revenue (~$150–400/mo at S1 with 25% opt-in) and why the fallback when eCPM disappoints is *off*, not *more ads*. The Boost decision (Option B) is founder-locked; the numbers here exist so VOL-15's ledger has a baseline to compare reality against.

## §7 How the Build Agent Uses Evidence

Three rules: **(1) trace, don't re-derive** — every scored number in VOL-12/13 cards comes from `opportunities.json`; if a card and the JSON disagree, the JSON wins and the conflict is logged. **(2) grade your claims** — public copy may only assert E1/E2 findings; E3 hypotheses are for post-launch cheap experiments, never for landing pages. **(3) freeze means freeze** — re-scoring, re-pricing, or re-prioritizing mid-build is out of scope; findings that would change LOCKED decisions go to `docs/decisions.md` as founder questions, not unilateral edits.

## §8 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T2.1 | `opportunities.json` | count rows by `tier_fit` | 155 / 79 / 13 — matches VOL-01 §4.2 matrix; any drift blocks the build |
| T2.2 | All VOL-12 cards | cross-check `score` fields | byte-equal to the JSON; zero invented scores |
| T2.3 | All public copy strings | grep for statistics | every number appears in this volume or the research corpus |
| T2.4 | Seed pipeline (VOL-03 §4) | run twice | deterministic output; family/zone aggregates match §2 above |

**DoD hooks (VOL-14):** "catalog ↔ research JSON consistency proven" (G-03 shared), "no untraceable public claims" (G-19).
