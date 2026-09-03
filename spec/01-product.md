# Volume 1 — Product Definition, Surfaces, Entitlements & Pricing

**Document:** JONTRIX Build Specification — VOL-01
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 (protocol, constraints). Referenced by: VOL-04 (schema), VOL-05 (middleware), VOL-06 (billing), VOL-07/08/09 (surfaces), VOL-10 (MCP + gateway), VOL-12/13 (catalog).

---

## §1 What JONTRIX Is (LOCKED)

JONTRIX is **one product with as many tools as possible** — a subscription mega-toolbox. A user pays once and gets every tool in the catalog; no tool is ever sold separately. The atomic unit of the catalog is a **Jont** (from Bengali যন্ত্র, "machine"): a single-purpose, single-page tool that does one transformation well and finishes in seconds. The brand pair is fixed: **Fraziym Soft** is the publisher, **JONTRIX** is the product, and the tiers are **JONTRIX Free / Pro / Studio / Max**.

The economic thesis comes from the evidence corpus, not from taste. Research row DR-C3 ("Acrobat-subscription outrage," score 8.20, E1) shows users resent paying $20+/month for one transformation they need twice a month; row DR-D2 ("tool-stitching meta-pain," 7.67) shows the actual job-to-be-done is *chaining* five small tools, which today means five websites, five paywalls, five re-uploads. JONTRIX sells the whole shelf: one subscription, every tool, files processed in the browser wherever possible (constraint C6). The long-tail directive is LOCKED: **even a tool used once a month by one person is included**, because its marginal cost is near zero (shared runtime, VOL-11) and its existence strengthens the "everything is in here" promise that drives the subscription.

The catalog is already computed and frozen. `research/opportunities.json` holds **247 scored Jonts** across 7 zones and 16 families, each with a 10-dimension weighted score, a `platform_role` (HOOK/GLUE/PRO/LTV), and a `tier_fit` (FREE/PRO/MAX). Volume 12 builds the top 50 by score as full cards; Volume 13 ships the remaining long-tail in family batches. Nothing in this volume re-opens prioritization — the numbers are frozen, and the build agent's job is execution.

Three distribution surfaces and one agent surface are hard-wired by founder decision: the **PWA** (web), the **Telegram Mini App**, the **Chrome Extension**, and **MCP access via `jontrix-gateway`** (VOL-10). Monetization is hard-wired to two rails: **Telegram Stars** (inside the Mini App/bot ecosystem) and **USDT** (web, crypto-settled). Both rails exist because the founder's constraint set (C1/C2: no bank, no card, $0 capital) eliminates every card-rail SaaS checkout for a Bangladesh-based solo founder; the rails were verified in `research/payments.md` and are not re-litigated here.

## §2 Users and Surfaces

### §2.1 Personas

The personas below are the only marketing segments this spec recognizes; every surface decision in Volumes 7–10 maps back to one of them. They are derived from the zone clusters in the opportunity database, so each persona already has scored evidence behind it.

1. **The Data Wrangler (prosumer).** Has bank-statement PDFs, exports, CSVs, invoices; needs them converted, cleaned, merged. Pain cluster: Data & Repair (average score 6.87, the highest cluster). Willingness to pay is proven by DR-F1 (bank-statement PDF→CSV, 8.03) and the per-tool replacement costs in the research ($49.95/mo DocuClipper class). Finds JONTRIX via SEO landing pages; converts on the PWA; pays USDT.
2. **The SMB Operator.** Runs a small commerce or service business (Ecom cluster 6.44): invoice matching (EC-C21, 7.58), WhatsApp order triage (EC-C29, 7.55), catalog feeds. Low technical skill, mobile-first, lives in Telegram. Finds JONTRIX through the Mini App or a bot share; pays in Stars because it is one tap.
3. **The Agent Operator.** A developer or power user driving Claude, Cursor, or another MCP client. Pain cluster: DevTools (6.23), with DV-B1 (large-JSON crashes, 7.58) as the wedge. Never opens a browser if an agent can do the work; installs `jontrix-gateway`, authenticates with a PAT/AAT (VOL-10), and consumes Jonts as MCP tools. Pays USDT for quota; this persona is why MCP exists as a first-class surface.

### §2.2 Surfaces (LOCKED)

All four surfaces are in scope for the one-shot build. A surface is a *client* of the platform core (VOL-05); no surface contains business logic that the others lack.

| # | Surface | Volume | Primary persona | Auth | Hard-wired rail | Notes |
|---|---------|--------|-----------------|------|-----------------|-------|
| S1 | **PWA** (app.jontrix.app + SEO pages) | VOL-07 | Data Wrangler | Telegram Login / email OTP | USDT | Programmatic SEO pages are the top of funnel; client-side WASM engines run here by default (C6). |
| S2 | **Telegram Mini App** (inside @JONTRIX_bot) | VOL-08 | SMB Operator | Telegram-initiated | **Stars** | Impulse-purchase surface; Stars checkout is native here; receipt + re-engagement via bot. |
| S3 | **Chrome Extension** (MV3) | VOL-09 | Data Wrangler / Agent Operator | Same account token | USDT | "Right-click → JONTRIX" on any page; runs server-side Jonts from any origin; store listing is a distribution channel (C3). |
| S4 | **MCP via jontrix-gateway** | VOL-10 | Agent Operator | PAT / AAT (`/api/mcp/login`) | USDT | The gateway is a small installable CLI (npm/PyPI/binaries) that logs in once and proxies MCP stdio ↔ HTTPS thereafter. |

**MUST:** every surface enforces the same entitlements (§4) by calling the shared middleware; a tier bought on Stars must light up the PWA, the extension, and MCP within 60 seconds (VOL-06 sync contract). **NEVER:** a native mobile app, an Electron desktop app, or any second web property — these are out of scope (§7) and violate the maintenance budget (C4).

## §3 Product Invariants (LOCKED)

These five invariants are the product's laws. They are enforced by the entitlements middleware (VOL-05) and audited by the global DoD (VOL-14).

1. **One subscription unlocks everything.** There is no per-tool price, no tool marketplace, no à-la-carte bundle. Marketing copy must never say "buy this tool."
2. **The free tier is the hook, not the product.** Every FREE-tier Jont must be genuinely useful with no account (HOOK/GLUE roles), and every tier-gated Jont must show its value before its paywall (result preview, first N rows free). Dark patterns are forbidden (C8).
3. **Files stay in the browser by default.** A Jont whose engine can run client-side MUST run client-side; its server calls are limited to entitlement checks and optional result saves. Server-side execution requires a manifest flag and a visible "this runs on our server" label in every surface.
4. **Honest scarcity.** Quotas (§4.3) are real, counted, and shown to the user before they hit them; the upgrade prompt appears at 80% and 100% of quota, and nowhere else. No fake counters, no invented urgency.
5. **No underpricing.** Tier prices (§5) are anchored to the per-tool replacement costs verified in research (Postman $14/user/mo, DocuClipper $49.95/mo, data-feed tools $59/mo). The annual discount is exactly two months free and nothing deeper. Discounts are never advertised as percentages off invented list prices.

## §4 Entitlements

### §4.1 Contracts

The entitlements system has one authority (the API's `entitlements` table in D1, schema VOL-04) and four cached projections (one per surface). The following types are binding; VOL-05 §entitlements-middleware implements them and every surface consumes them verbatim.

```ts
type Tier = 'free' | 'pro' | 'studio' | 'max';

interface Plan {                      // one row per tier, seeded at Phase 1
  tier: Tier;
  price_usd_monthly: number;          // 0 | 4.99 | 9.99 | 19.99
  price_usd_annual: number;           // 0 | 49.90 | 99.90 | 199.90  (USDT rail only)
  price_stars_monthly: number;        // 0 | 400 | 750 | 1500        (Stars rail only)
  limits: Limits;                     // contract below
}

interface Limits {
  jonts_unlocked: 'FREE' | 'PRO' | 'MAX';   // tier_fit gate: see §4.2 mapping rule
  server_calls_per_day: number;             // 25 | 500 | 2000 | 10000
  max_upload_mb: number;                    // 2 | 25 | 100 | 100
  batch_rows_max: number;                   // 100 | 5000 | 50000 | 250000
  concurrent_jobs: number;                  // 1 | 2 | 5 | 10
  mcp_calls_per_month: number;              // 100 | 2000 | 10000 | 100000
  mcp_aats_max: number;                     // 1 | 3 | 10 | 9999  (9999 = "unlimited")
  ai_fallback_calls_per_month: number;      // 0 | 100 | 1000 | 5000
  history_days: number;                     // 0 | 90 | 365 | 36500
  presets_max: number;                      // 3 | 50 | 9999 | 9999
  seats: number;                            // 1 | 1 | 1 | 3
}

interface Entitlement {               // the live, user-keyed projection (KV-cached, D1-authoritative)
  user_id: string;
  tier: Tier;
  source: 'stars' | 'usdt' | 'grant';
  window: { starts_at: string; expires_at: string };   // UTC; §5 window rules
  counters: Record<string, number>;   // daily + monthly usage counters (VOL-04)
  version: number;                    // bumped on every change; surfaces compare before caching
}
```

**Behavioral spec:** the middleware resolves entitlements in one D1 primary-key lookup plus one KV read (never a scan — D1 free tier counts rows read, VOL-00 §0.2/C1). Every mutating endpoint (billing webhooks, grant script) bumps `version`; surfaces may cache an `Entitlement` for at most 60 seconds or until `version` changes. Quota counters are incremented by the same middleware call that performs the check, atomically: **check-and-increment MUST be a single operation** so two parallel calls cannot both consume the last remaining unit. When a counter exceeds its limit, the middleware returns HTTP 402 (quota exhausted, tier cap) with `upgrade_url`, never 403; burst limiting (10 requests / 10 s per token or session) returns 429 with `Retry-After` (VOL-05 §rate-limiter).

### §4.2 The Tier Matrix (LOCKED)

Four tiers, monthly prices anchored to the per-tool replacement costs in the research corpus, annual = ×10 (USDT rail only). The `tier_fit` mapping rule is mechanical: a Jont's row in `research/opportunities.json` carries `tier_fit ∈ {FREE, PRO, MAX}`; FREE-fit Jonts are available to every tier, PRO-fit Jonts unlock at Pro and above, MAX-fit Jonts unlock at Max only. Studio therefore buys *capacity* (quota, AI, history, MCP), not additional Jonts — that is deliberate: Studio exists for users who already unlocked Pro's catalog but hit its ceilings.

| Capability | **Free** $0 | **Pro** $4.99/mo | **Studio** $9.99/mo | **Max** $19.99/mo |
|---|---|---|---|---|
| Jonts unlocked (of 247) | **155** | **234** | 234 | **247** |
| — of which client-side (unlimited use) | all of its 155 | all of its 234 | 234 | 247 |
| Server-side Jont calls / day | 25 | 500 | 2,000 | 10,000 |
| Max upload (server-side Jonts) | 2 MB | 25 MB | 100 MB | 100 MB |
| Batch rows per job | 100 | 5,000 | 50,000 | 250,000 |
| Concurrent jobs | 1 | 2 | 5 | 10 |
| **MCP calls / month (via gateway)** | 100 | 2,000 | 10,000 | 100,000 |
| **MCP AATs (agent tokens)** | 1 | 3 | 10 | unlimited |
| AI-fallback calls / month (VOL-11 §1) | 0 | 100 | 1,000 | 5,000 |
| Result history retention | — | 90 days | 365 days | unlimited |
| Saved presets | 3 | 50 | unlimited | unlimited |
| Seats | 1 | 1 | 1 | 3 |
| Surfaces: PWA · Mini App · Extension | ✓ ✓ ✓ | ✓ ✓ ✓ | ✓ ✓ ✓ | ✓ ✓ ✓ |
| MCP via jontrix-gateway | ✓ (quota above) | ✓ | ✓ | ✓ |
| Support | community | community | email | email + priority |

Rationale, for the build agent's judgment calls later: Free's 155 Jonts are the HOOK/GLUE mass (155 FREE-fit rows) — enough catalog to prove the thesis with zero friction; Pro's +79 PRO-fit Jonts include the top-scored converters that anchor willingness to pay; the 13 MAX-fit Jonts are the LTV flagships (bank-statement PDF→CSV class, score ≥ 8.0 territory) held back to make Max a real decision, not a rounding error. MCP is deliberately quota-cheap at Free (100 calls/mo) so an agent operator can wire JONTRIX into a workflow and feel the ceiling within the same month — that ceiling is the upgrade.

### §4.3 Quota Semantics (LOCKED)

All quota windows are UTC. Daily counters reset at 00:00 UTC; monthly counters reset on the 1st at 00:00 UTC. There are no rolling windows — a fixed reset is explainable in one sentence to a user, which C8 demands. Anonymous (logged-out) users on Free get the Free daily server-call quota keyed by a salted IP+UA hash, halved (12 calls/day), to blunt farm abuse without asking for an account first; signing in always doubles what an anonymous user had, and that promise appears verbatim in the UI copy.

Counters live in D1 (authoritative) and are incremented only by the middleware's atomic check-and-increment; KV is used solely for the per-token/session burst window (read-heavy, ≤2 writes per call worst case — and KV's 1,000 writes/day free cap is protected by the design rule in VOL-05 §cache: *no per-request KV writes, ever*). When any daily cap reaches 80%, the middleware stamps `warnings: ["quota_80"]` on the response envelope so surfaces can show the one-time honest prompt. When a cap is reached: 402 + `upgrade_url` for tier caps; 429 + `Retry-After` for burst; the UI never invents a third kind of limit.

### §4.4 Gating Rules and Lifecycle (LOCKED)

Client-side engines are static assets; a technically determined user can extract a WASM engine and run it without a tier. That is accepted by founder decision — the moat is the catalog, the chaining, the presets, and the server-side Jonts, not client-side obfuscation. Accordingly: **client-side gating** = UI-level (page renders, engine loads, results render; PRO-fit engines refuse only preset-saving and history), while **server-side gating** = hard (middleware refuses before execution). VOL-12/13 Jont cards must mark each Jont's context honestly; a Jont must never claim client-side processing while silently calling the server (C6, C8).

Downgrade semantics: when a paid window expires without renewal, `tier` reverts to `free` within 60 seconds of the expiry check (hourly cron, VOL-14 §6). Data is never deleted on downgrade: history beyond the Free horizon becomes read-only-hidden (not destroyed) for 90 days, presets beyond 3 are frozen not lost, and re-subscribing restores everything intact — this is a stated retention promise in the billing UI. Refunds are not offered on the USDT rail (crypto finality, stated plainly at checkout, C8); the Stars rail follows Telegram's own refund mechanics and the bot surfaces them.

## §5 Pricing & Payment Rails (LOCKED)

### §5.1 The Rails

Two rails are hard-wired by founder decision, verified in `research/payments.md` (Sept 2026 evidence): **Telegram Stars** and **USDT**. Every other rail is a documented FALLBACK or out of scope. This is not a stylistic preference — it is the consequence of C1/C2 (no bank, no card, $0 capital, Bangladesh payout reality): Stripe, PayPal, Paddle-direct-to-bank, Lemon Squeezy, Ko-fi, and friends are all **broken for this founder** per the research; crypto affiliate/P2P and Stars→Fragment→GRAM are the two **working** money-in paths.

| Rail | Surface | Plans sold | Settlement path | Verified economics |
|------|---------|-----------|-----------------|--------------------|
| **Stars** (hard-wired) | Mini App + bot (S2) | Monthly subs only (§5.2) | Stars → Fragment → GRAM → USDT → P2P → bKash | Dev nets ≈ **$0.013/Star** vs $0.0133 web price (−2.3%); in-app user price $0.02/Star; 1,000-Star min payout (~$13); 21-day hold; Fragment KYC possible |
| **USDT** (hard-wired) | PWA + Extension (S1/S3) | Monthly + annual | NOWPayments → USDT (TRC20/TON) → self-custody → P2P → bKash | Processor fees **0.5–1.5%**, 0% withdrawal, min payment ~$2–5; P2P cash-out ~2% total; FX bonus +2–3.5% vs official rate |

### §5.2 Stars Ladder (LOCKED)

Stars prices are set so that *net* revenue after Telegram's haircut meets or slightly exceeds the USD ladder — the founder directive is "never undersell," and a Stars price that nets less than USDT for the same plan is underselling. At ≈$0.013 net per Star: **Pro = 400 Stars** (net ≈ $5.20), **Studio = 750 Stars** (net ≈ $9.75), **Max = 1,500 Stars** (net ≈ $19.50). The user's in-app cost is $0.02/Star (iOS/Android) or ≈$0.0133 via web/Fragment, so the checkout page MUST display the honest dual price ("400 Stars ≈ $8.00 in-app · ≈ $5.33 on web") — hiding the in-app premium would violate C8. Stars sales are **monthly subscriptions only** (Telegram's native Stars subscription mechanics handle renewal and cancellation); annual is never sold for Stars in v1. Entitlement window per successful monthly cycle: 31 days from the webhook timestamp (VOL-06 §sync).

### §5.3 USDT Ladder (LOCKED)

USDT is the primary web rail and the only annual rail. Fixed-price invoices via NOWPayments (USDT on TRC20 and TON networks; the ~$2–5 min payment floor is safely below the $4.99 entry plan). Prices: monthly $4.99 / $9.99 / $19.99; annual $49.90 / $99.90 / $199.90 (exactly ×10). There is **no auto-renew** on this rail in v1 — instead the bot and email send renewal reminders at D-3, D-1, and expiry+1, each with a one-tap invoice link; the checkout page states "crypto payments are final, no refunds" in the same viewport as the pay button (C8). Entitlement windows: 31 days from payment confirmation (monthly) or 366 days (annual), granted only on NOWPayments IPN verification per VOL-06 §sync — never on invoice creation.

### §5.4 Fallbacks and Non-Rails

**FALLBACK (documented, not built at launch):** Paddle checkout — the only mainstream SaaS rail open to Bangladesh (3% + $1, Payoneer payout), reserved for the day a high-value customer segment demands card payment; VOL-06 carries its integration contract but Phase 5 does not build it. **Rejected with evidence:** Stripe, PayPal, Lemon Squeezy, Ko-fi, Buy Me a Coffee, Gumroad, Payhip, Patreon (all Stripe/PayPal/bank-dependent — broken per `research/payments.md`). **Ads (AdsGram, mini-app rewarded/video):** permitted by this spec only inside the Mini App, **default OFF at launch**, revisited at ≥10,000 DAU as a Free-tier monetization experiment; the decision and its numbers land in `docs/decisions.md` if activated. Ads never appear on the PWA or extension (C8 trust wedge).

### §5.5 Pricing Honesty Contract

All surfaces render prices from the seeded `Plan` rows (§4.1) — never hard-coded strings — so the ladder can change in one place. Any future price change MUST: (a) grandfather existing windows to their end date, (b) update Stars and USDT ladders together within the same release, and (c) preserve the ×10 annual rule and the ≥-parity Stars-net rule. These three conditions are checked in the VOL-14 DoD sweep.

## §6 Projected Load & Free-Tier Budget (LOCKED)

The load model exists to prove C1 ($0/month) holds at realistic scale and to define the exact "hard brake" behavior when a free cap approaches. Cloudflare free caps (verified `research/infra.md`, Sept 2026): Workers **100k req/day**; D1 **5M rows-read/day, 100k rows-written/day, 5 GB**; KV **100k reads/day, 1k writes/day**; R2 **10 GB, 1M Class-A / 10M Class-B ops/mo**; Pages static/bandwidth unlimited; Cron free; Queues 10k ops/day.

| Scenario | DAU | Assumptions/day | API req/day | D1 rows-read/day | Verdict vs free caps |
|----------|-----|-----------------|-------------|------------------|----------------------|
| **S0 Launch** (month 1–3) | 100 | 2 server Jont-calls + 10 platform calls (auth/ent/config) per user; ~40 SEO page views each | ≈ 1.6k | ≈ 48k (entitlement + usage lookups) | ≈2% Workers · ≈1% D1 — comfortable |
| **S1 Growth** (month 4–9) | 1,000 | same per-user mix | ≈ 14k | ≈ 480k | 14% Workers · 10% D1 — comfortable |
| **S2 Scale** (month 10+) | 10,000 | same per-user mix | ≈ 140k | ≈ 4.8M | **Workers cap breached (140%)**; D1 at 96% — hard brakes engage (below) |

Design rules that make these numbers hold: static pages and client-side engines are served from Pages (unlimited, never counted against Workers); every Jont page embeds its entitlement snapshot so listing/config reads don't hit the API; KV writes are reserved for burst windows and entitlement-version bumps (≪ 1k/day); R2 stores only user-saved results of paid tiers (S2 estimate ≈ 2 GB, Class-B ops ≈ 300k/mo).

**Hard brake contract (LOCKED):** the hourly watchdog (VOL-14 §6) reads the day's usage totals from D1 (not from Cloudflare dashboards, which have no API on free tier). At **80%** of any daily cap it flips the platform to *conservative mode* (aggressive cache headers, AI fallback disabled, extension polling halved) and posts a status note. At **95%** it flips to *read-only mode*: server-side Jont execution returns 429 with `Retry-After: <seconds until UTC reset>` and a banner explains the daily reset honestly (C8). The documented escape hatch past S2 is Workers Paid ($5/mo) — an explicit C1 exception requiring founder sign-off recorded in `docs/decisions.md`; Turso offload (500M reads/mo free) is the second lever. The build agent implements the brake levels and the escape-hatch runbook; neither is optional.

## §7 Non-Goals (LOCKED)

The following are explicitly out of scope for this build, and any volume that appears to require them is misread: native mobile apps; Electron/desktop apps; team workspaces, SSO, or RBAC beyond the 3-seat Max allowance; per-tool purchases or a tool marketplace; advertising on PWA/extension; referral or affiliate programs; public REST/OAuth API beyond MCP (the gateway contract in VOL-10 is the entire programmatic surface); multi-language UI beyond English at launch (SEO may spawn BD-language pages as an AGENT CHOICE); white-labeling. Adding any of these post-launch requires a new founder directive and a spec revision — the one-shot build agent MUST NOT improvise them.

## §8 Acceptance Tests — Entitlements & Pricing

Every row is a test the platform must pass before the DoD sweep counts it (VOL-14). Fixtures: seeded `Plan` rows per §4.1; users U-FREE, U-PRO, U-MAX with known windows.

| # | Given | When | Then |
|---|-------|------|------|
| T1.1 | U-FREE | requests a PRO-fit server Jont | 402 + `upgrade_url`; no usage counter incremented |
| T1.2 | U-FREE, 25th call consumed | 26th server call same UTC day | 402; UI shows reset time; call not executed |
| T1.3 | U-PRO | calls a MAX-fit Jont | 402 (tier cap), not 403 |
| T1.4 | U-PRO via Stars | Stars webhook lands | tier flips to `pro` in D1 ≤ 60 s; `version` bumps; all surfaces see new tier within their 60 s cache |
| T1.5 | U-PRO annual USDT | NOWPayments IPN verified | window = 366 days; IPN replay ignored (idempotent) |
| T1.6 | Any paid user | window expires (simulated) | hourly cron reverts tier to `free` ≤ 60 s past check; history hidden-not-deleted; resubscribe restores |
| T1.7 | U-MAX | runs 3 concurrent batch jobs | allowed; 4th queued per `concurrent_jobs` |
| T1.8 | Anonymous IP | 13th server call of the UTC day | 402 with sign-in prompt copy ("signing in doubles your quota") |
| T1.9 | U-PRO MCP | 2,001st MCP call in month | 402 on `/api/mcp/call`; gateway pre-flight shows remaining=0 (VOL-10 T10.6) |
| T1.10 | Any surface | renders pricing page | prices match seeded `Plan` rows byte-for-byte; Stars row shows dual in-app/web price |
| T1.11 | U-FREE MCP | issues 2nd AAT | rejected (limit 1); error names the tier limit |
| T1.12 | System | daily usage reaches 80% of Workers cap | watchdog flips conservative mode; status note posted; AI fallback returns deterministic path or clean error |

