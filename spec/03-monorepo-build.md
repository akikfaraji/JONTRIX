# Volume 3 — Monorepo, Environments & Build System

**Document:** JONTRIX Build Specification — VOL-03
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 §0.4 (repo layout), VOL-00 §0.7 (versioning). Referenced by: VOL-05 (worker), VOL-07/08/09 (clients), VOL-10 §5 (gateway), VOL-14 §3 (CI/CD).

---

## §1 Layout and Ownership (LOCKED)

The monorepo is exactly VOL-00 §0.4 — npm workspaces, four apps (`apps/api`, `apps/mcp`, `apps/pwa`, `apps/extension`), shared packages (`packages/gateway`, `packages/jont-kit`, `packages/ui`, `packages/config`), plus `src/version.ts` at the root. Ownership rules that keep the one-shot build coherent: **`packages/jont-kit`** owns the runtime and patterns (VOL-11) and is imported by `apps/api` (server dispatch) and `apps/pwa` (client engines) — never duplicated; **`packages/ui`** owns design tokens + shared Preact components so PWA and Mini App render identically; **`packages/gateway`** is self-contained (its npm/PyPI builds must not drag workspace deps — VOL-10 §5.1). **MUST:** every workspace resolves TypeScript via `tsconfig.base.json`; **NEVER** a copy-pasted helper that exists in a package — the DoD greps for duplicated utility functions across apps.

## §2 The Version Source Plumbing (LOCKED, VOL-00 §0.7)

`src/version.ts` is the single authoritative version source; this volume defines how each consumer imports it without ever copying the string:

| Consumer | How it gets `VERSION` |
|---|---|
| `apps/api`, `apps/mcp` (Workers) | direct TS import; bundled at build; surfaces in envelope `meta.version` and `/health` (VOL-05 §7) |
| `apps/pwa` | Vite `define` injection from `src/version.ts` at build time; About screen renders it verbatim |
| `apps/extension` | same `define` injection; about-page renders it; no other literal |
| `packages/gateway` | compile-time import + **derived semver** for npm (`V00.01.003-beta-04` → `0.1.3-beta.4`) and PyPI (`0.1.3b4`), computed by `scripts/release-derive.ts` and written into package metadata at publish time only |
| D1 | `meta` table row copied from `src/version.ts` at migration/seed time (VOL-04 §7) |
| `CHANGELOG.md` | append-only ledger of published versions — the only file allowed to repeat the string |

**MUST:** the CI version-hygiene check (grep, VOL-00 §0.7) passes on every push; a hand-edited version anywhere else fails the build. **NEVER:** gateway package versions hand-edited in `package.json`/`pyproject.toml` on the main branch (they carry the literal `0.0.0-dev` placeholder; publish writes the derived value).

## §3 Environments and Deploy Targets (LOCKED)

Three Cloudflare environments, one account, $0 total (C1):

| Env | Workers | Pages | D1 | Purpose |
|---|---|---|---|---|
| **prod** | `api.jontrix.app`, `mcp.jontrix.app` | `app.jontrix.app` + SEO apex | `jontrix-prod` | real users, real money |
| **staging** | `staging.api.jontrix.app` … | `staging.app.jontrix.app` | `jontrix-staging` | every merge runs the full test battery here first |
| **local** | `wrangler dev` + Miniflare D1/KV/R2 | Vite dev server | local sqlite | development and `tests/` |

**MUST:** prod deploys happen only from CI (VOL-14 §3.2), only after staging green, tagged with the current `VERSION`. **MUST:** secrets (NOWPayments IPN salt, Telegram bot token, OTP mail credentials, AI provider keys) live in Worker secrets per environment — never in the repo, never in `wrangler.toml`; a leaked secret is rotated per the VOL-14 §7 runbook. **NEVER:** a third-party staging service that would cost money or a second cloud account.

## §4 Data Pipeline: Evidence → Catalog Seed (LOCKED)

The catalog is frozen research, not build-time discovery. Pipeline: `research/opportunities.json` (247 rows, founder-frozen) → `scripts/seed.ts` validates every row against the 38-field contract (score 0–10, `tier_fit ∈ {FREE,PRO,MAX}`, `platform_role`, family id) and emits `spec/catalog/jonts.seed.json` → Phase 1 loads it into the `jonts` table (VOL-04 §4). **MUST:** the seed is deterministic — same input, byte-identical output — and the DoD re-runs it to prove zero drift; **NEVER** an edit to priorities that bypasses `opportunities.json` (the founder re-freezes the JSON; the spec re-derives).

## §5 Dependency Policy (LOCKED)

C1/C4 in package form: every runtime dependency must (a) be MIT/Apache/BSD, (b) have no paid tier requirement, (c) be pullable in 2026 without registry quirks. The allowed heavy hitters: Preact (PWA/Mini App), zod (manifest + envelope validation), Hono or a hand-rolled router (AGENT CHOICE — record it), tsup/esbuild/Vite, vitest. **MUST:** `npm audit --omit=dev` clean (no high/critical) before every deploy; lockfiles committed; dependabot-style PRs are out of scope (C4) — a quarterly manual bump is the maintenance budget's answer. **NEVER:** a dependency that phones home at runtime (C8 zero-telemetry applies to the whole product, not just the gateway), UI framework bets heavier than Preact, or a monorepo tool beyond npm workspaces (no turborepo/nx — the build is simple by design).

## §6 Build & CI Hooks (summary — binding details in VOL-14 §3)

`ci.yml` runs: typecheck → lint → unit tests → Jont conformance (`tests/jonts/`) → version-hygiene grep → audit → build all apps → deploy to staging → integration battery. `deploy.yml` promotes staging → prod on version tag `V*` only. The gateway's three builds (npm/PyPI/binaries) run the shared conformance suite (VOL-10 §5.1) in the same pipeline. Extension packaging produces a store-ready zip artifact.

## §7 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T3.1 | Fresh clone | `npm install && npm run build` | all workspaces build clean; zero cross-app duplicated utilities (grep) |
| T3.2 | `src/version.ts` | CI hygiene grep | full version string exists only there + `CHANGELOG.md`; build fails otherwise |
| T3.3 | Gateway publish dry-run | derive script runs | npm `0.1.3-beta.4`-style and PyPI `0.1.3b4`-style outputs match the mapping table for all fixtures of VOL-00 §0.7 |
| T3.4 | `research/opportunities.json` | `scripts/seed.ts` twice | byte-identical seed output; 247 rows; zero contract violations |
| T3.5 | Merge to main | pipeline | staging deploy + full battery green before any prod path is reachable; prod untouched on red |
| T3.6 | Any app bundle | strings scan | no AI-provider keys, no bot token, no IPN salt in any artifact |

**DoD hooks (VOL-14):** "monorepo builds + hygiene checks green" (G-02), "seed determinism proven" (G-03), "secrets absent from artifacts" (G-15).
