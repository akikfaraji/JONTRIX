# Volume 14 — Definition of Done, Release & Operations

**Document:** JONTRIX Build Specification — VOL-14
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED
**Depends on:** everything (this volume is the gate). Referenced by: VOL-00 §0.3/§0.5 (phases, DoD), every volume's DoD hooks.

---

## §1 The Global DoD Checklist (LOCKED — 39 checks, G-01…G-39)

The build is complete only when `docs/dod-report.md` lists **every check as PASS with evidence** (command output, URL, or fixture id). The hooks were distributed across the volumes; this is the consolidated master list, grouped:

**Deploy & platform**
- **G-01** Prod deploy healthy: `/health` on both workers returns `status:"ok"`, watchdog shows "up", staging battery green before promotion.
- **G-02** Monorepo builds clean; hygiene greps green (no duplicated utilities, no stray version literals — VOL-03 §2/§5).
- **G-05** Envelope + version hygiene: every JSON response carries `meta.version` == `src/version.ts`; `/health` matches byte-for-byte (VOL-05 §2/§7).
- **G-14** Brake modes flip without deploy (conservative 80% / read-only 95%, VOL-01 §6) and AI-fallback caps + cache verified (VOL-05 §10).
- **G-15** No secrets in any artifact (T3.6 scan).
- **G-20** Watchdog + dead-man switch armed: hourly cron reads D1 totals, flips modes, and pings healthchecks.io; a dead watchdog pages the founder within 1 h.

**Data & catalog**
- **G-03** Seed determinism: `scripts/seed.ts` twice → byte-identical; 247 rows; catalog census 155/79/13 (VOL-02 T2.1, VOL-13 T13.6).
- **G-04** Schema verified: migrations + `db:verify` green; idempotency gates present on all four webhook providers (VOL-04 T4.1–T4.3).
- **G-10** Harness green for **all built Jonts** — top-50 and every long-tail family at its §4 gate (VOL-11/12/13).
- **G-11** Determinism double-run proof on the spot-audit set (VOL-13 T13.4).
- **G-28** Traceability audit: every card's score/tier matches `research/opportunities.json`; public claims trace (VOL-02 §7).
- **G-29** MAX gate proven on J006/J007/J027/J031 (402 at Studio, unlock at Max).
- **G-30** Long-tail families shipped at the ≥95% family gate; no fake pages for unbuilt Jonts (G-19 covers the copy half).

**Surfaces**
- **G-06** Lighthouse ≥ 90 perf + a11y on home and one Jont page (VOL-07 §5).
- **G-07** C6 leak test: client-context Jonts make zero execution API calls; zero ad/telemetry code in PWA/extension bundles.
- **G-08** SEO pages render with canonical URLs + sitemap; every built Jont's page contains the working tool or preview.
- **G-09** Extension loads unpacked, authenticates by shared session, runs two server Jonts from any origin; store assets ready (VOL-09 §5).
- **G-19** No untraceable public claims; no fake counters, reviews, or "coming soon" pages (C8 sweep).

**MCP & gateway**
- **G-13** Data-plane isolation: PAT/session/AAT kind matrix green (VOL-10 T10.15, VOL-05 T5.3–T5.5).
- **G-31** Gateway published to npm + PyPI with binaries attached; three-build conformance suite green (VOL-10 §5.1).
- **G-32** Zero-telemetry audit: gateway + extension + PWA bundles phone nowhere (grep + egress test).
- **G-33** Quota honesty verified on all tiers (pre-flight refuses locally; server enforces; T10.6).

**Billing & money**
- **G-16** Test purchase of each tier × each rail (Stars + USDT) flips entitlements ≤ 60 s; receipts + dual price shown (VOL-06 T6.2).
- **G-12** Webhook idempotency proven on all providers (replayed events ignored, no double revenue rows).
- **G-17** Downgrade = hide-not-delete; resubscribe restores (T1.6).
- **G-18** Reminders fire exactly once per stage (D-3/D-1/+1).
- **G-37** Ledger generates + reconciles for the launch month (VOL-15 T15.1).
- **G-38** C1 cost statement: total infra spend = domains (+ founder-signed exceptions only).
- **G-39** Founder grant/test rows visible and separated from revenue.

**Ads, consent & legal**
- **G-24** Boost ceremony verified: reward-callback-only grants, daily cap 2, replay refusal, honest 429 copy (VOL-08 §5).
- **G-25** Ad SDK absent from PWA/extension bundles (surface lock, D-02).
- **G-26** Bot message universe = receipts + reminders + opted digest — nothing else (VOL-08 §4).
- **G-21/G-34** Consent machinery end-to-end: default-denied, versioned re-ask, audit trail, export predicate (granted-only), withdrawal purge ≤ 30 days (VOL-16 §6).
- **G-22/G-23** Consent endpoints + token factory + consent card verified in the UI (VOL-05 §6/§8, VOL-07 §6).
- **G-35** Founder sign-off on the legal prose (terms/privacy/AUP) recorded in `docs/decisions.md` — **CLEARED 2026-09-03:** review pass complete (9 findings folded into VOL-16) and founder-directed closure recorded in `docs/decisions.md` (findings accepted in-chat; venue: Bangladesh). No longer launch-blocking.
- **G-36** Policy documents render from the versioned policy table, never from bundles (VOL-16 §10).

## §2 Per-Jont DoD (LOCKED format)

Every Jont (VOL-12 card or VOL-13 batch member) is done when, in one row of `docs/dod-report.md`: manifest validates · harness fixtures green · C6/context label honest · tier gate proven at its `tier_fit` boundary · SEO page renders with the evidence-cited subtitle · `mcp_exposed` correct in the registry · version-stamped build artifact exists. A Jont missing any box is not counted, not listed, not announced (VOL-00 §0.5).

## §3 CI/CD (LOCKED)

**`ci.yml`** on every push: typecheck → lint → unit → `test:jonts` (harness) → version-hygiene grep (VOL-00 §0.7) → `npm audit --omit=dev` → build all apps → deploy to **staging** → integration battery (platform routes, webhook fixtures, gateway conformance, consent/boost flows, C6 leak test). **`deploy.yml`**: manual tag promotion only — a `V*` tag (FRAZIYM format, §4) triggers staging→prod with the tag as the deployed `VERSION`; prod is never deployed from a dirty tree. **MUST:** red staging blocks promotion mechanically; **NEVER** a prod deploy without a green run of the full battery, and never a version tag that the hygiene grep cannot trace to `src/version.ts` + `CHANGELOG.md`.

## §4 Release & Versioning Procedure (LOCKED, FRAZIYM)

One decision tree, executed in this order:

1. **Is this a platform-generation change?** (breaking architecture/migration or founder-directed jump) → bump **PP** (e.g., `V00.x` → `V01.0.0-alpha-01`), reset FF/BBB/RR per VOL-00 §0.7. Otherwise continue.
2. **Shipped features in this release?** (new Jont batch, new surface capability, new family) → bump **FF**, reset BBB→`000`. Else bump **BBB** by one (bug-fix batch).
3. **Pre-release publication?** bump **RR** (staying in `-alpha|-beta|-rc`); reaching stable deletes `-STAGE-RR` entirely.
4. **Edit `src/version.ts` only** — the bump is a one-line change there; `CHANGELOG.md` gains one line (version, UTC date, one-paragraph summary); the release script derives npm/PyPI semver mechanically (VOL-03 §2) and CI stamps all build artifacts.
5. **Tag and push** — `V*` tag → deploy pipeline (§3).

**MUST:** the current build baseline is `V00.00.000-beta-01` (initial beta foundation); the working-bot-platform feature release is `V00.01.000-beta-02` per the founder's example table (VOL-00 §0.7). **NEVER** a version string anywhere else, a hand-edited derived semver, or a release without a CHANGELOG line.

## §5 Monitoring & SLOs (LOCKED)

Monitoring is founder-scale (C4): the hourly watchdog (G-20) checks `/health` on both workers, reads the day's D1 usage totals, evaluates the 80/95 brake thresholds (VOL-01 §6), pings healthchecks.io (dead-man), and writes a one-line status note. SLOs, honest and few: API availability ≥ 99.5% monthly (measured by the watchdog's own probes), envelope error rate ≤ 1% of metered calls, entitlement-sync latency ≤ 60 s after webhook (T1.4), MCP `/call` p95 ≤ 2 s server-side. Dashboards = the watchdog's status page + the ledger summary (VOL-15 §8) — no third-party APM (cost + C7).

## §6 Operations Runbook — the 10-Minute Week (LOCKED)

**Weekly founder check (the whole maintenance budget):** (1) watchdog status page green; (2) ledger monthly summary (on the 1st); (3) webhook `failed` rows = 0; (4) security inbox for reports (VOL-16 §3.6). Everything else is automated. **Incident ladder:** worker down → watchdog pages → rerun `deploy.yml` last-green tag → if infra-cap related, brakes already engaged (VOL-01 §6) → founder-only escalations (paid-tier decision) go through `docs/decisions.md`. **Backups:** nightly D1 export to R2 (`jontrix-backups/`, 30-day retention) + R2 results bucket lifecycle rules; **restore drill** runs in staging monthly (cron) and its result is a DoD-maintained line in the status page. **Secret rotation:** on any suspected leak, rotate the named secret per environment (§3 of VOL-03), audit `token.*` events for misuse (VOL-04 §5).

## §7 Payout Runbook (LOCKED, references VOL-15 §7)

Manual, monthly, arithmetic-only: (1) read the ledger's available balances (Stars out of 21-day hold; NOWPayments sweep landed); (2) execute the VOL-06 §8 path (Fragment → GRAM → USDT; self-custody → P2P → bKash); (3) record `payout.out` rows with references within 48 h; (4) confirm the reconciliation test (T15.6) passes. **NEVER** an automated payout path and never key material online beyond the self-custody wallet the founder controls.

## §8 Launch Checklist & 90-Day Roadmap (LOCKED)

**Launch =** all 39 DoD checks PASS + founder legal sign-off (G-35) + the launch channels live: SEO pages indexed-submit (G-08), CWS listing submitted (G-09), MCP directory listing (G-31), Telegram bot `/start` verified. **90-day roadmap after launch:** month 1 — S0 watch (watchdog + ledger), fix top honest-feedback items as BBB bumps; month 2 — first FF release (`V00.01.x-beta-RR`, the working bot-platform batch per the founder's version table), long-tail family waves continue; month 3 — evaluate ads eCPM against the kill-switch (VOL-01 §5.5), evaluate the S1 brake math, prepare the founder decision memo on Workers Paid **only if** S2 math says so (VOL-01 §6 escape hatch requires founder sign-off).

## §9 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T14.1 | Clean checkout | full CI run | all stages green incl. hygiene greps and harness |
| T14.2 | Staging green + `V*` tag | deploy.yml | prod carries exactly `VERSION`; envelope + `/health` + about-page agree (T7.5 analog) |
| T14.3 | Staging red | promotion attempt | mechanically blocked; prod untouched |
| T14.4 | Version bump by the tree | release script | npm/PyPI derived values match the mapping fixtures (T3.3); CHANGELOG has the line; nothing else changed |
| T14.5 | Watchdog killed | 1 h | dead-man switch pages the founder; restart restores |
| T14.6 | Nightly backup | restore drill in staging | D1 + R2 restore to a prior UTC day; drill logged |
| T14.7 | DoD report | launch review | 39/39 PASS with evidence; any N/A is founder-approved in writing |

**DoD hooks:** this volume *is* the hooks' registry (G-01…G-39 above; VOL-00 Phase 9 consumes it).
