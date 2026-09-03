# Volume 3 — Workspace, Environments & Deployment

**Document:** JONTRIX Build Specification — VOL-03
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 §0.4 (repo layout), VOL-00 §0.7 (versioning). Referenced by: Phase 0 (scaffold), VOL-14 §3 (CI/deploy).

---

## §1 Environments

Exactly three environments exist, and code reaches them only through the deploy pipeline (VOL-14 §3.2) — never by hand-editing production. **Local**: `wrangler dev` with Miniflare D1, seeded via `npm run db:seed`; every Phase exit condition in VOL-00 §0.3 is first proven here, and the platform test-suite (VOL-05 §9) must pass against Miniflare before any deploy is attempted. **Preview**: every push to a non-main branch deploys a preview Worker + Pages alias (`*.preview.jontrix.app`), wired to a throwaway D1 copy so webhook tests can run against real HTTP without touching production data; preview environments auto-expire after 7 days via cron to stay inside free limits. **Production**: `api.jontrix.app`, `mcp.jontrix.app`, `app.jontrix.app`, and the apex `jontrix.app` — deployed only from `main` with a green CI run, and only ever carrying migrations that were applied to preview first. The three-environment rule is not ceremony: Stars and NOWPayments webhooks (VOL-06) need stable public URLs to test against, and a webhook pointed at a dead preview URL must never be able to corrupt production entitlements.

**MUST:** production D1 is the single authority for users, entitlements, and usage; preview databases are disposable copies with all webhook secrets zeroed. **NEVER:** a preview environment holds real user rows or real payout addresses; a production deploy runs without the version string from `src/version.ts` embedded (VOL-03 §5).

## §2 Configuration and Secrets

Configuration splits three ways, and the split is contractual. **Static public config** lives in each app's `wrangler.toml` vars: environment name, public base URLs, tier-agnostic feature flags. **Secrets** (Telegram bot token, NOWPayments API key + IPN secret, healthchecks.io ping URL, email-OTP signing key) live only in Workers Secrets via `wrangler secret put` — never in the repo, never in `wrangler.toml`, never in D1. **Dynamic config** (tier prices, quota values, tool registry) lives in D1 rows seeded by VOL-04 §5, because VOL-01 §5.5 forbids hard-coded price strings anywhere. The secret inventory is exactly seven items; adding an eighth requires a decision-ledger entry stating why. CI receives no secrets at all except the Cloudflare API token scoped to this account — if a workflow needs more, the design is wrong.

**MUST:** every secret is referenced through a typed config module per app (`env: Env` binding), so a missing secret fails at build time, not at first request. **NEVER:** secrets in logs (extends VOL-10 §8.8 to every app), secrets echoed in error envelopes, or a `.env` file committed anywhere in the monorepo (CI greps for `.env` files and fails).

## §3 Deploy Topology and Domains

| Route | Serves | Vol | Notes |
|-------|--------|-----|-------|
| `jontrix.app` | SEO landing pages (static, programmatic) | VOL-07 §5 | the top of funnel; every page canonical, sitemap.xml regenerated on deploy |
| `app.jontrix.app` | PWA application shell | VOL-07 | service worker, engine assets, in-app Jont pages |
| `api.jontrix.app` | Platform API Worker | VOL-05/06 | auth, entitlements, billing webhooks, server-side Jont dispatch |
| `mcp.jontrix.app` | MCP Worker + `/api/mcp/*` + gateway landing | VOL-10 | also serves `/.well-known/jontrix-mcp.json` and the login page |
| CDN assets | Pages static hosts + R2 engine buckets | VOL-07 §3 | WASM/JS engines versioned by content hash; immutable cache |

**MUST:** all four production routes terminate on one Cloudflare account with one Workers Free allocation counted by VOL-01 §6; cross-route fetches stay inside the zone (no third-party hops for first-party calls). **NEVER:** a new subdomain, a second registrar, or DNS managed outside the repo's documented state — the apex and four subdomains are the complete domain surface, and `docs/decisions.md` records the registrar/DNS state at Phase 0.

## §4 Workspace Conventions (the build-agent expansion of VOL-00 §0.4)

VOL-00 §0.4 fixes the directory tree; this section fixes the conventions inside it so the build agent never improvises structure. Package manager: **npm workspaces** with a single lockfile at the root; TypeScript in **strict** mode with one shared `tsconfig.base.json`; the `config` package owns every lint/test preset so tool drift is impossible. Import direction is a one-way graph: `apps/* → packages/*` and `packages/* → packages/*` only where declared; `jont-kit` never imports from `ui`, `ui` never imports from any app, and nothing outside `apps/api` imports server-only modules. Every workspace package exposes its public surface through a single `index.ts`; deep imports across package boundaries fail CI. Runtime targets are fixed per app: API/MCP Workers on the `workerd` runtime with 10 ms CPU budgets in mind (VOL-01 §6), PWA as a Vite-built Preact bundle with WASM engines loaded as versioned assets, extension as MV3 with a service worker, gateway as a standalone Node 18+ CLI whose single-file binary build is derived from the same TypeScript source (VOL-10 §5.1).

**MUST:** every package's `package.json` `version` field is the derived semver produced at publish time (VOL-00 §0.7) with `"version"` otherwise left at `0.0.0-development` in-repo — the version-hygiene grep then has exactly one literal to find. **NEVER:** a second package manager, a second TypeScript config dialect, or a workspace package that reaches into another package's internals.

## §5 FRAZIYM Version Integration (LOCKED, implements VOL-00 §0.7)

The version graph is one file and many consumers. `src/version.ts` exports `VERSION` (the single string literal) and nothing else. **API and MCP Workers** import it and return it in `/health` (VOL-05 §7) and in every error envelope's `meta.version` field (VOL-05 §8) — support conversations therefore always carry the exact build. **PWA** injects it at build time into the about screen and the service worker's cache key. **Extension** renders it verbatim on its about page and stores it with `chrome.runtime.getManifest`-adjacent metadata derived at build. **Gateway** reads the same file at its build; its npm/PyPI/binary package versions are CI-derived mappings of `VERSION` (strip `V`, map `V00.01.003-beta-04` → `0.1.3-beta.4`), written at publish time, never hand-edited. **CI** runs the version-hygiene check from VOL-00 §0.7 (regex must appear in exactly `src/version.ts` + `CHANGELOG.md`) and a drift check that the deployed `/health` version matches the git tag being deployed. The bump procedure itself — who bumps, when, with what changelog line — is VOL-14 §9.

## §6 Local Development Stack

One command brings the whole platform up: `npm run dev` (documented in the root `README` the agent writes at Phase 0) starts `wrangler dev` for API + MCP with Miniflare D1/KV/R2, the Vite dev server for the PWA, and a stub bot mode that mocks Telegram webhooks with recorded fixtures. The stub mode matters because the bot surface (VOL-08) must be developable without a public HTTPS endpoint on day one. Engines (VOL-11 §3) run in plain browser contexts under Vite with no polyfills; the gateway (VOL-10) runs from source via `npm run gateway -- login` against the local API. Fixtures for every external dependency — Telegram updates, NOWPayments IPNs, provider AI responses — live in `tests/fixtures/` and are the only allowed source of external data in tests; live third-party calls in CI are forbidden (rate limits + flakiness), with one documented exception: the Phase-0 exit condition ping of the real health endpoint, which runs in the deploy workflow only.
