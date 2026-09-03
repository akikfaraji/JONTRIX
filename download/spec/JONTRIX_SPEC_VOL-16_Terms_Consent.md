# Volume 16 — Ecosystem Rules, Terms & Consent

**Document:** JONTRIX Build Specification — VOL-16
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED structure and rules; final legal wording is a founder review gate (AGENT REVIEW below)
**Depends on:** VOL-00 (C7, C8, D-03..D-06), VOL-04 §5 (consent_events, audit), VOL-05 §8 (consent endpoints), VOL-01 §5 (payment rails). Referenced by: VOL-07/08/09 (copy surfaces), VOL-14 (DoD), VOL-15 (ledger honesty).

---

## §1 Purpose and Legal Posture (LOCKED)

JONTRIX is an honest product (C8) and this volume is where honesty becomes enforceable: the ecosystem rules, the terms users agree to, and the consent machinery that governs their data — including the founder-mandated **explicit permission for AI-model training use of user-given data (D-05)**. Posture rules: the build agent produces the complete *structure* and *rule content* specified here; the final legal wording of the Terms is flagged **AGENT REVIEW** — the founder (or a hired reviewer) signs the prose before launch, and the DoD blocks launch until that sign-off is recorded in `docs/decisions.md`. Nothing in this volume requires a lawyer to *build*; it requires one only to *bless the prose*, and the product must not launch without that blessing. Publisher of record: **Fraziym Soft**; the terms name the publisher, the product, the effective date, and the governing-language rule (English text governs; a Bangla courtesy translation may exist but is marked non-authoritative).

## §2 Terms of Service — Required Skeleton (LOCKED)

`/terms` renders the current ToS with a version id and effective date; the version id feeds `policy_version` (VOL-05 §8). Required sections, in order:

1. **Who we are** — Fraziym Soft (publisher), JONTRIX (product), contact channel (support email + bot).
2. **Accounts** — one human per account; accurate Telegram/email; you are responsible for your tokens (cross-ref §7); minimum age per applicable law.
3. **The service** — one subscription unlocks the catalog (VOL-01 §3.1); features, quotas, and tiers as rendered in-app at purchase; we may change the catalog (additions are routine; removals are announced in-app ≥ 14 days ahead with the reason).
4. **Payments** — Stars and USDT rails as specified in VOL-01 §5; **USDT/crypto payments are final — no refunds** (stated at checkout and here); Stars sales follow Telegram's own subscription/refund mechanics; you are responsible for your local taxes.
5. **Your data & AI training** — the C6 promise (files processed in your browser never touch our servers unless you save them), retention horizons per tier, and the **AI-training consent rule in full (§6 of this volume)**: we never train on your data without your explicit, revocable, versioned permission.
6. **Acceptable use** — cross-ref §3 of this volume; violations ladder to suspension (§9).
7. **Disclaimers & liability cap** — service "as is" during beta stages (the FRAZIYM version string is shown in-app, so "beta" is provable, not vibes); liability capped at the last 12 months of fees paid or $50, whichever is higher.
8. **Changes to terms** — versioned re-ask (VOL-05 §8): material changes trigger the consent re-ask banner; continued use after acknowledgment is acceptance.
9. **Termination** — by you (account deletion, §4) and by us (abuse, §9), with data-handout windows stated.

## §3 Acceptable Use Policy (LOCKED)

`/aup` renders the rules that protect the ecosystem's honesty and cost model:

1. **One human, many tools — not many accounts.** One account per person; seats follow the tier (VOL-01 §4.2). Sybil farms, shared logins beyond seats, and quota-farm rotation (identity, IP, or device) are violations.
2. **Tokens are personal.** Selling, renting, publishing, or sharing PATs/AATs is a violation; a leaked token must be rotated/revoked promptly (duty to mitigate, §7); we never ask for your tokens in chat — anyone who does is not us (C8 anti-phishing line, also on the login page).
3. **No abuse of the free tier or boost.** Automated mass-registration, ad-fraud (fake Boost callbacks — a §9 offense with no appeal), scraping the catalog or API outside the documented MCP/data-plane contracts, and resale of JONTRIX output-as-a-service are prohibited.
4. **Respect the upstream world** (C7): no using JONTRIX to violate provider ToS at scale (mass scraping, spam generation); the deterministic tools are for your own data and lawfully obtained files.
5. **No illegal content or harm.** Malware packing, CSAM, targeted harassment material, fraud kits — the zero-tolerance set; immediate suspension, data preserved only as legally required.
6. **Honest reporting.** Found vulnerabilities get thanks and credit (security@ channel in the docs); pentesting without coordination is not "research."

## §4 Privacy & Data Retention (LOCKED)

`/privacy` states, in the same order, what exists and why: **(1)** account data (identity, tier, settings) — kept while the account lives; **(2)** usage metadata (`jont_usage`: tool, size, timing — never content) for metering and abuse defense; **(3)** saved results & presets — only on explicit save, retained per tier horizon (VOL-01 §4.2) then deleted by the expiry cron (VOL-04 §4), hidden-not-deleted on downgrade for 90 days (VOL-01 §4.4); **(4)** files — the C6 promise is the headline: *client-side processing means the file never leaves the browser*; server-side Jonts stream inputs and discard them with the request (VOL-11 §4), and that difference is labeled on every tool page; **(5)** consent & audit records (§6, VOL-04 §5) — kept to prove the promises. **Account deletion** (dashboard-only): tombstones the account, purges email/Telegram links, presets, results (D1 rows + R2 bodies), consent events retained in anonymized form only; the pipeline of §6 drops the user's data from the next snapshot build. The deletion path is self-service and completes within 24 h (cron), stated on the page.

## §5 Payment Honesty Terms (LOCKED)

The payment-facing copy rules, restated as user-facing terms: prices render from `plans` (VOL-01 §5.6); the ×10 annual rule and Stars-net parity are internal constraints users never see as math; **"crypto payments are final"** appears at USDT checkout and in the terms; Stars refunds route through Telegram mechanics; renewal reminders are D-3/D-1/+1 with no fake urgency (VOL-06 §6.2); boost is a free-tier earn mechanic, never purchasable (VOL-08 §5). **NEVER:** a dark pattern (confirm-shaming, hidden cancel, forced continuity beyond Telegram's mechanics), an invented "regular price" strike-through, or a testimonial that is not a real one (there are none at launch — the page says so, which is itself the honest pattern, C8).

## §6 AI-Training Consent (LOCKED, D-05 — the founder-mandated permission)

The specific permission the founder required, as a machine-checkable contract:

1. **The ask.** At onboarding (once) and in settings (always), every user is asked: *"May we use the data you save on JONTRIX (saved results, presets, and files you choose to store) to train future JONTRIX AI models? Default: No. You can change this anytime."* — two buttons, equal weight, no dark-pattern ordering (C8). "Decide later" = No until answered.
2. **Scope of "yes".** Covers **stored data only**: saved results, presets, and deliberately stored files. It never covers in-browser work (C6 — we cannot train on what we never receive), usage metadata, or identity. Each consent record binds `policy_version` (§2) so users know exactly which policy text their "yes" meant.
3. **The machinery.** `users.ai_training_consent` + `consent_events` (VOL-04 §5); `POST /api/consent` (VOL-05 §8) is the only writer; every change is versioned and audited; a policy-text change bumps `policy_version` and triggers the re-ask banner — consent does **not** carry over silently to a new policy version.
4. **The pipeline.** Training-data export is a standalone cron job, never a request handler: it selects only rows whose owner's consent = `granted` **at export time**, writes them to R2 `jontrix-training/batches/<policy_version>/<date>/` (VOL-04 §6), and logs the batch (count, users-hashed, version) to the audit log. **NEVER** a manual export, a interactive query path, or a batch that skips the consent predicate — the DoD proves this with a granted-user and a denied-user fixture.
5. **Withdrawal.** Flipping to No is forward-looking and takes effect at the next export; the batch deletion procedure purges the user's rows from R2 batches within 30 days of withdrawal, stated in the policy text; already-trained models are disclosed honestly ("your data may remain in previously trained model weights; it will not appear in future training data").
6. **Minimization promise.** We ask for permission we might never use: at launch, no training pipeline runs at all — the machinery ships dormant so the promise is testable from day one. When training starts (founder decision, recorded), this volume's §6.4/6.5 are already the law.

## §7 Token & API Ecosystem Rules (LOCKED)

The rules users accept when creating tokens (rendered at the token factory, VOL-05 §6): **(1)** kind duties — the PAT is the master data-plane key (treat it like a password: rotate on suspicion; rotation is one click and instant), AATs are per-agent keys you can revoke cheaply; **(2)** the factory rule — tokens are created only in the dashboard (device-approval included, D-04); no JONTRIX employee, bot, or "support agent" can create one for you; **(3)** leak duty — rotate within a reasonable time of suspected exposure; the audit log records rotation (VOL-04 §5) and we may force-revoke a token that appears in public paste sites (with notice to the account); **(4)** attribution — calls through an AAT are attributed to that agent in your usage view (VOL-10 §7); **(5)** the data plane's powers (§3.1 of VOL-05) are yours alone — we never use your PAT, and support operates only with your explicit, revocable, time-boxed grant.

## §8 Rail Compliance Notes (LOCKED)

Each rail's own rules are inherited and linked: **Telegram/Stars** — Mini App and bot policies, Stars monetization rules, and the prohibition on misleading payment flows; **NOWPayments** — acceptable-business terms (JONTRIX is a standard SaaS; no restricted goods) and IPN-handling duties; **AdsGram** — rewarded-placement policies (the Boost flow's honest label and callback verification are also compliance features, VOL-08 §5); **Paddle FALLBACK** — if ever activated, Paddle becomes merchant of record and the tax/VAT burden moves with it (VOL-06 §7). **MUST:** every checkout and Boost surface links the rail's consumer-facing terms; **NEVER** a rail used against its restricted-use list — the FALLBACK ladder always ends in "turn the rail off," never in a ToS violation (C7).

## §9 Enforcement Ladder (LOCKED)

Graduated, documented, appealable: **(1)** automated throttle (burst/abuse windows, VOL-05 §5) — no human, no record beyond counters; **(2)** warning (email/bot) with the specific rule cited; **(3)** suspension of the offending capability (e.g., tokens revoked, boost disabled) for 7–30 days; **(4)** account suspension with data handout (30-day export window); **(5)** ban for the zero-tolerance set (§3.5) or ad fraud. Appeals: one channel (support email), answered within 7 days, decisions recorded. **NEVER** an und explained throttle (every 429/402 names its rule, C8), a silent ban, or an enforcement without an audit row.

## §10 Copy Surfaces (LOCKED)

| Document | Surface | Consent machinery |
|---|---|---|
| Terms (`/terms`) | PWA footer, Mini App menu, checkout | version id = `policy_version` |
| Privacy (`/privacy`) | PWA footer, Mini App menu, onboarding card | links §6 ask |
| AUP (`/aup`) | PWA footer, bot `/rules` | links §9 ladder |
| Training consent card | onboarding (once), settings, re-ask banner | VOL-05 §8 endpoints |
| Token rules | token factory modal (one screen, must-scroll) | VOL-05 §6 |

**MUST:** every surface renders the current document version from one source (the seeded policy table — same discipline as `plans` pricing, VOL-01 §5.6); **NEVER** a hard-coded legal paragraph in any bundle.

## §11 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T16.1 | Fresh onboarding | consent card interaction | two equal buttons; "later" = `denied`; decision + policy version in `consent_events` |
| T16.2 | Granted user, withdrawal | next export cron | user's rows absent from new batch; R2 purge within 30 days; audit row |
| T16.3 | Denied user | any export run | zero rows ever (T1.15/T5.8 shared) |
| T16.4 | Policy text change | version bump | re-ask banner on next visit; consent unchanged until user answers |
| T16.5 | ToS checkout link | USDT checkout | "crypto payments are final" visible in same viewport (VOL-01 §5.3 shared) |
| T16.6 | Token factory modal | render | §7 rules one screen; version from policy table, not the bundle |
| T16.7 | Enforcement | any 429/402/suspension | rule named in-product; audit row; appeal channel linked |
| T16.8 | Launch gate | DoD sweep | founder sign-off on legal prose recorded in `docs/decisions.md` before launch checklist completes |

**DoD hooks (VOL-14):** "consent machinery end-to-end (ask → audit → export predicate → withdrawal purge)" (G-21 shared, G-34), "legal prose signed off pre-launch" (G-35), "policy documents render from the versioned source" (G-36).
