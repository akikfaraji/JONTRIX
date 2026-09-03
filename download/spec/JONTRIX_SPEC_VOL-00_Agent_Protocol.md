# Volume 0 — Agent Build Protocol

**Document:** JONTRIX Build Specification
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Purpose:** This single specification is sufficient for one autonomous build agent to design, implement, test, deploy, and launch the complete JONTRIX system in one continuous engagement. Nothing else is required. No product decisions remain.

---

## 0.1 How To Read This Specification

You, the build agent, are addressed directly throughout this document. "You" means the autonomous coding agent executing the build. Every volume below is written so that you can act on it without asking a human anything. Where the spec says **LOCKED**, that decision is final and must not be renegotiated, substituted, or "improved." Where the spec says **FALLBACK**, that is the documented Plan-B you switch to only when the primary service fails, is unavailable at build time, or its terms have materially changed. Where the spec says **AGENT CHOICE**, you may pick freely within the stated constraints, and you must record the choice in `docs/decisions.md` with a one-line rationale.

The specification is organized into 16 volumes. Read all of them once, in order, before writing any code. The volumes reference each other by ID (for example, "see VOL-04 §2 for the `usage_ledger` schema"). Volume 12 contains fifty complete build specifications for the fifty highest-value Jonts, and Volume 13 catalogs the remaining long-tail Jonts. Volumes are numbered `00` through `16` (VOL-16 is the ecosystem rules, terms, and consent volume) and the build order is defined in §0.3 below, which is not the same as the reading order.

Three file types appear throughout:

1. **Contract blocks** — JSON or TypeScript type definitions, API request/response shapes, and table schemas. These are binding interfaces. If two volumes ever appear to conflict, the contract block wins, and you must note the conflict in `docs/decisions.md`.
2. **Behavioral specifications** — plain-language, step-by-step descriptions of what each component must do, plus invariants written as MUST/NEVER rules. **The spec never contains implementations.** Code snippets are capped at five lines and appear only where a contract would otherwise be ambiguous (a token format, a single CLI invocation, one example request). You, the build agent, write 100% of the code; the spec defines the WHAT — interfaces, invariants, sequencing, and acceptance criteria — never the HOW.
3. **Acceptance tests** — tables of input/expected-output pairs. Every Jont ships with its acceptance tests passing before it counts as done. The global Definition of Done (VOL-14) is the final gate.

**LOCKED writing rule — "contracts, not code":** if you find yourself writing a function body, a class, a SQL migration body beyond column definitions, or any listing longer than five lines in a volume, stop and convert it into (a) a contract block, (b) a behavioral step list, or (c) an acceptance-test row. This rule exists by founder directive and applies to every volume without exception.

If you encounter a situation this spec does not cover, apply the following tie-breaker ladder, in order: (1) does it preserve the global constraints in §0.2? (2) does it follow the cheapest-$0 path? (3) does it follow the deterministic-before-AI principle (VOL-11 §1)? (4) choose the option with the least operational surface to maintain, given the under-10-minutes-per-week maintenance budget (VOL-14 §6). Record every such decision in `docs/decisions.md`.

---

## 0.2 Global Constraints (LOCKED)

These eight constraints bound every decision in every volume. They come from the founder's mission and from the verified research corpus in `research/`. If any proposed change violates one of these, the change is rejected.

| # | Constraint | Meaning in practice |
|---|------------|---------------------|
| C1 | **$0.00 capital, $0.00/month run cost** | Every service must have a free tier that covers the projected load in VOL-01 §6, or a client-side equivalent. No paid plans, no trials that convert, no credit card on file anywhere. |
| C2 | **No bank account, no credit card of the founder** | Payouts land via USDT to a self-custody wallet, P2P to bKash/Nagad/Rocket, or Payoneer. Never wire-to-bank. See VOL-06 §7 for the compliant payout protocol. |
| C3 | **No freelance, no manual client acquisition** | All growth is product-led: SEO pages, Telegram distribution, extension store, MCP directory listing, ad rails. Cold outreach is forbidden. |
| C4 | **Under 10 minutes/week of human maintenance** | Operations are cron-driven with dead-man switches (VOL-14 §6-7). Any design requiring daily human attention is rejected. |
| C5 | **Deterministic before AI** | A Jont's core transformation must be a deterministic algorithm whenever one exists. AI is a fallback for fuzzy steps only, and every AI call is cached. See VOL-11 §1. |
| C6 | **Files never leave the browser by default** | Any Jont whose engine can run client-side (WASM/JS) must run client-side. Server-side execution is the exception, requires a manifest flag, and the UI must say so. This is the trust wedge that converts users into subscribers. |
| C7 | **Respect every provider's ToS** | One account per provider, respect rate limits, honor robots and scraping restrictions. The AI router (VOL-05 §5) rotates providers instead of exceeding limits. |
| C8 | **Honest product, honest marketing** | No fake counters, no dark patterns, no invented testimonials. The brand is Fraziym Soft (publisher) and JONTRIX (product). |

---

## 0.3 The One-Shot Build Protocol

Execute the phases in this exact order. Do not start a phase until the previous phase's exit condition is met. Each phase lists its output and its exit condition.

**Phase 0 — Scaffold (target: first working deploy).** Create the monorepo exactly as laid out in VOL-03 §4. Initialize the Cloudflare Workers project, D1 database, R2 bucket, KV namespaces, and Pages project; run `wrangler deploy` and `wrangler d1 migrations apply` so that an empty-but-live API exists behind the real domain. Register the healthchecks.io dead-man switch and the CF Cron that pings it. *Exit condition:* `https://api.jontrix.app/health` returns `200` and the watchdog shows "up."

**Phase 1 — Data layer.** Apply every migration in VOL-04. Seed the `jonts` registry from the machine-readable catalog (`spec/catalog/jonts.seed.json`, generated from Volume 13). Seed entitlement plans to match VOL-01 §4. *Exit condition:* a script `npm run db:verify` passes, asserting every table, index, and seed row exists.

**Phase 2 — Platform core.** Implement VOL-05 completely: router, auth, entitlements middleware, rate limiter, cache, AI router, error taxonomy. Ship the three health/utility endpoints. *Exit condition:* the integration test suite in `tests/platform/` passes against a local `wrangler dev` with Miniflare D1.

**Phase 3 — Jont runtime + first ten Jonts.** Implement VOL-11 (the runtime and the five patterns). Then build Jonts `J001` through `J010` from VOL-12, each with its acceptance tests passing. These ten were chosen because they exercise all five patterns and both execution contexts (client WASM and server Worker). *Exit condition:* `npm run test:jonts` green for J001-J010; each has a live URL on the PWA.

**Phase 4 — PWA surface.** Build VOL-07: app shell, Jont page template, engine loader, worker pipeline, SEO landing pages for J001-J010. *Exit condition:* Lighthouse performance and accessibility scores of 90 or higher on the home page and one Jont page; programmatic SEO pages render correct canonical URLs.

**Phase 5 — Accounts, billing, entitlements.** Implement VOL-06: Telegram Login + email OTP auth, Stars checkout end-to-end, USDT checkout end-to-end (NOWPayments processor per VOL-01 §5), entitlement sync state machine. Paddle is a documented FALLBACK (VOL-01 §5.4), not built in this phase. *Exit condition:* a test purchase of each tier via both hard-wired rails (Stars and USDT) flips entitlements in D1 and the UI reflects the tier within 60 seconds.

**Phase 6 — Telegram bot and Mini App.** Implement VOL-08. *Exit condition:* the bot serves the Jont catalog, opens the Mini App, completes a Stars purchase, and delivers a receipt.

**Phase 7 — Chrome extension.** Implement VOL-09. *Exit condition:* the extension loads unpacked, authenticates a user, and runs two server-side Jonts (CORS Echo and cURL-to-Code) from any origin tab.

**Phase 8 — MCP server + gateway.** Implement VOL-10: the remote MCP worker and the `jontrix-gateway` package (npm + PyPI + standalone binaries), wired to the `/api/mcp/login` AAT flow (PATs are data-plane credentials and are rejected on `/api/mcp/*` per the Decision Register §0.8). *Exit condition:* after `jontrix-gateway login`, an MCP client (any reference client) connected through the gateway can list tools and successfully call two Jonts with an AAT — usage metered in `jont_usage`, quota pre-flight honored — and a PAT presented to `/api/mcp/call` is refused with `403 TOKEN_KIND_MISMATCH`.

**Phase 9 — Remaining Jonts, DoD sweep, launch.** Build the remaining top-50 Jonts from VOL-12 in descending score order, then the long-tail catalog from VOL-13 in family batches. Run the full Definition of Done sweep (VOL-14), wire CI (VOL-14 §3), execute the launch checklist and the 90-day roadmap (VOL-14 §8). *Exit condition:* the DoD report (`docs/dod-report.md`) shows every checklist item checked, and the launch checklist is complete.

Throughout, commit small and often with conventional commits. Every phase ends with: tests green, deploy live, `docs/decisions.md` updated, and a short entry in `BUILDLOG.md` (one paragraph: what shipped, what broke, what you decided).

---

## 0.4 Repository Layout (LOCKED)

Create exactly this monorepo. Where a file is not specified in later volumes, its content follows the conventions of its neighbors.

```
jontrix/
  package.json                  # npm workspaces, private
  tsconfig.base.json
  .github/workflows/ci.yml      # VOL-14 §3.1
  .github/workflows/deploy.yml  # VOL-14 §3.2
  apps/
    api/                        # Cloudflare Worker: api.jontrix.app (VOL-05, 06)
      wrangler.toml
      src/index.ts
      src/routes/…              # auth, jonts, billing, entitlements
      src/lib/…                 # ai-router, cache, ratelimit, errors, log
      migrations/0001_init.sql  # VOL-04
      tests/…
    mcp/                        # Cloudflare Worker: mcp.jontrix.app (VOL-10)
      wrangler.toml
      src/index.ts
    pwa/                        # PWA + Telegram Mini App host (VOL-07, 08)
      vite.config.ts
      index.html
      src/app/…                 # shell, router, stores
      src/jonts/…               # one folder per client-side Jont engine
      src/engines/…             # WASM/JS engine loader + web-worker pipeline
      public/seo/…              # generated programmatic pages
    extension/                  # Chrome MV3 extension (VOL-09)
      manifest.json
      src/background.ts
      src/content/…
      src/popup/…
  packages/
    gateway/                    # jontrix-gateway: CLI + stdio MCP bridge (VOL-10)
    jont-kit/                   # shared Jont runtime + patterns (VOL-11)
      src/patterns/converter.ts validator.ts generator.ts extractor.ts fixer.ts
      src/manifest.ts           # zod schema for jont.manifest.json
      src/testing/harness.ts
    ui/                         # design tokens + shared Preact components
    config/                     # eslint, tsconfig, vitest presets
  spec/                         # THIS specification, kept in-repo
    catalog/jonts.seed.json     # generated from VOL-13
  src/
    version.ts                  # FRAZIYM VERSION — single authoritative source (VOL-00 §0.7)
  docs/
    decisions.md                # append-only decision log (required)
    dod-report.md               # DoD sweep results
    runbooks/                   # payout, incident, backup (VOL-06 §7, VOL-14 §6)
  research/                     # read-only evidence corpus (from the founder)
  scripts/                      # qa_gate.sh, seed.ts, seo-gen.ts, verify-db.ts
  BUILDLOG.md
```

---

## 0.5 Definition of Done — Explained In Plain Language

**DoD means "Definition of Done."** It is nothing more than a checklist that answers one question: *when is a piece of work genuinely finished, not just "I wrote the code and it seems to work"?* A checklist is needed because the most common failure mode of an autonomous build is declaring victory too early — the feature runs on the happy path, but the error path crashes, the tests were never written, the docs are missing, and nobody can reproduce the deploy.

This specification uses DoD at two levels:

1. **Per-Jont DoD** (format defined in VOL-14 §2, enforced on every Jont card in VOL-12): a Jont is done when its manifest validates, its engine passes every acceptance-test row, its UI works on mobile and desktop, its tier gating works for anonymous/free/paid users, its SEO page renders, and its evidence-cited problem statement ships as the page's H1 subtitle. If any box is unticked, the Jont is not done, and it must not be counted, listed, or announced.
2. **Global DoD** (VOL-14 §1): forty numbered checks covering the whole system — deploy health, billing integrity, privacy promises kept, monitoring armed, docs written, and the founder's constraints (§0.2) verified. The build is complete only when `docs/dod-report.md` lists every check as PASS with evidence (command output or URL).

Plain-language rule of thumb for you, the agent: **done means a stranger could use it, break it, and get a sensible error, and you could prove all of that without touching the keyboard again.**

---

## 0.6 Evidence Grading Legend

Research claims in this spec carry a grade from the founder's research corpus, kept so you can weigh how hard to fight a problem:

- **E1** — direct first-party evidence: official documentation or pricing page, quoted community thread, or reproducible bug report. Treat as fact.
- **E2** — second-party evidence: reputable publication, aggregator data, or a vendor page that implies the claim. Treat as strong signal.
- **E3** — inference or hypothesis marked as such by the researcher. Treat as a guess to validate cheaply after launch; do not over-invest.

The full corpus lives in `research/` (seven streams: data-repair, devtools, ecom-smb, distribution-weird, ai-providers, infra, payments). VOL-02 condenses what matters; VOL-15 carries the ledgers. You never need to re-research: priorities are already computed and frozen in `research/opportunities.json` (247 rows, 38 fields, 10-dimension weighted score). When a Jont card says "score 7.58," that number comes from that file.

---

## 0.7 The FRAZIYM Versioning System (LOCKED)

This project does **not** use conventional semantic versioning. It uses the official **FRAZIYM versioning format**, defined once here and enforced everywhere:

```
VPP.FF.BBB-STAGE-RR
│  │  │    │     │
│  │  │    │     └── Pre-release revision (01, 02, …) — counts publications within the current (generation, stage) pair
│  │  │    └──────── Release stage (-alpha | -beta | -rc; omitted entirely when stable)
│  │  └───────────── Bug-fix version (000, 001, …)
│  └──────────────── Feature version (00, 01, …)
└─────────────────── Platform generation (V00, V01, …)
```

Canonical examples, which double as the conformance fixtures for every version parser you write:

| Version | Meaning |
|---------|---------|
| `V00.00.000-beta-01` | Initial beta foundation |
| `V00.01.000-beta-02` | First feature release — working bot platform |
| `V00.01.003-beta-04` | Feature release, 3 bug fixes since it, 4th beta revision |
| `V01.00.000` | Stable release (stage and revision omitted) |

**Bump rules (LOCKED):** precedence is PP > FF > BBB > RR. Bump **PP** only on a platform-generation change — a breaking architectural migration or a founder-directed generation jump — and reset FF→`00`, BBB→`000`, RR→`01` at the next pre-release. Bump **FF** on every shipped feature release (a new Jont batch, a new surface capability) and reset BBB→`000`; RR keeps counting. Bump **BBB** by one per accumulated bug-fix batch; RR keeps counting. Bump **RR** on every pre-release publication within the current (PP, stage) pair; moving alpha→beta→rc resets RR→`01`; reaching stable deletes `-STAGE-RR` entirely. Zero-padding is mandatory and exact: FF two digits, BBB three, RR two.

**Single source of truth (LOCKED):** the one authoritative version string is `src/version.ts`:

```ts
export const VERSION = 'V00.00.000-beta-01' as const;
```

Every component — API, MCP worker, PWA, extension, gateway, health endpoints, logs, release metadata, the dashboard — imports `VERSION` from there. **NEVER** write a version literal in any other file. The build contract: `apps/api` and `apps/mcp` surface it in `/health` (VOL-05 §7); the PWA about-screen and extension about-page render it verbatim; the gateway reads it at build time from the same file (its own package version is derived, §0.7 below). Package registries force semver, so CI **derives** npm/PyPI versions mechanically — strip the `V`, map `V00.01.003-beta-04` → `0.1.3-beta.4` — and the derived value is written at publish time, never hand-edited. CI carries a **version-hygiene check**: a grep proves the full version regex `V\d{2}\.\d{2}\.\d{3}(-[a-z]+-\d{2})?` appears in exactly one source file (`src/version.ts`) plus the append-only `CHANGELOG.md`; any other hit fails the build. `CHANGELOG.md` records one line per published version in ascending order — version, UTC date, phase/feature summary — and is the only file allowed to repeat the string.

---

## 0.9 Founder Decision Register (LOCKED)

Decisions taken in the founder review of 2026-09-03. Each row is binding and is elaborated in the volume shown; where a row conflicts with older prose in any volume, the row wins.

| # | Decision | Elaborated in |
|---|----------|---------------|
| D-01 | Free-tier MCP quota is **40 calls/month** (was 100). Rationale: agent access is the paid differentiator; 40 ≈ two tasting sessions and keeps Free D1 write load ≈ 40k/day at 10k free users. | VOL-01 §4.2, VOL-10 §7 |
| D-02 | Ads are **Option B — rewarded-only Boost**: AdsGram rewarded video inside the Mini App only; 1 rewarded ad → +10 server calls for the current UTC day, max 2 ads/day (cap +20). Opt-in only, paid tiers never see ads, PWA and extension stay ad-free forever. **Ads never gate access to a user's own data or any base free function** — boost is always surplus (C8 extension). | VOL-01 §5.4, VOL-08 §5, VOL-15 §4 |
| D-03 | **PAT (Personal Access Token): exactly one per user on every tier.** Full read **and write** access to all of that user's data via the `/api/v1/*` data plane. Rotatable (rotation kills the old secret instantly) and revocable in the dashboard. A PAT is **never accepted on `/api/mcp/*`** — agents use AATs; a PAT presented there gets `403 TOKEN_KIND_MISMATCH`. A PAT cannot manage tokens, change password/email, touch billing, or delete the account (control plane stays behind the browser session). | VOL-10 §2, VOL-05 §3 |
| D-04 | **AAT (Agent Access Token): tier ladder 1 / 3 / 10 / ∞.** The **dashboard is the only token factory** for both kinds — the device-approval page of `/api/mcp/login` is a dashboard surface that either creates an AAT for the device or attaches an existing one; no unattended minting API exists. | VOL-10 §2–3, VOL-05 §6 |
| D-05 | **AI-training consent:** account-level `ai_training_consent`, **default `denied` until explicitly granted**. Asked once at onboarding, toggleable in settings, version-stamped re-ask on policy change, every change audit-logged. The training pipeline ingests **granted-only** records. Applies to stored data only — per C6, files processed in-browser never leave the device unless the user saves/syncs them. | VOL-04 §5, VOL-05 §8, VOL-16 §6 |
| D-06 | The specification gains **VOL-16 — Ecosystem Rules, Terms & Consent** (terms skeleton, acceptable use, privacy/retention, token-abuse rules, payment-rail compliance notes). | VOL-16 |
