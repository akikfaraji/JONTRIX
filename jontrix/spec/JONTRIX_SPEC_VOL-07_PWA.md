# Volume 7 — PWA Surface (S1)

**Document:** JONTRIX Build Specification — VOL-07
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 (C6, versioning), VOL-01 §2/§4 (surfaces, entitlements), VOL-04/05/06 (schema, routes, auth), VOL-11 (manifest/runtime). Referenced by: VOL-12/13 (cards render here), VOL-14 (DoD).

---

## §1 Scope (LOCKED)

The PWA is the top-of-funnel and the power surface: `app.jontrix.app` (the app shell) plus programmatic SEO landing pages on the apex (`jontrix.app/<slug>` and family hubs). It runs client-side Jont engines in-browser (C6), calls the platform API for everything server-side, and contains **no ad code of any network** (D-02 — ads are Mini-App-only). Framework: Preact + Vite from the monorepo (VOL-03 §5); the Mini App (VOL-08) reuses this shell's components via `packages/ui`, but this volume is web-only.

## §2 App Shell and Routing (LOCKED)

Routes (client-side, each server-renderable or prerendered for SEO where public):

| Route | Auth | Purpose |
|---|---|---|
| `/` | none | home: catalog search, tier pitch, honest quota explainer |
| `/t/{slug}` | none to run client-side Free Jonts; sign-in for saves | the Jont page template (§3) |
| `/family/{family}` | none | family hub (programmatic, VOL-13) |
| `/pricing` | none | renders `plans` rows byte-for-byte (VOL-01 §5.6); Stars rows only inside Mini App context, USDT checkout links here |
| `/dashboard` | session | account, quota meters, presets, history, billing windows |
| `/dashboard/tokens` | session | **the token factory UI** (VOL-05 §6): create/attach AATs, rotate/revoke PAT with the shown-once + confirm-rotation ceremony |
| `/dashboard/settings` | session | settings + **consent card** (VOL-05 §8) |
| `/connect-agent` | session | the 3-step gateway onboarding copy (VOL-10 §9) |
| `/about` | none | product, publisher (Fraziym Soft), `VERSION` rendered verbatim |

**MUST:** the shell renders the entitlement snapshot (tier, quota block with `base`/`boost`/`effective`) in a persistent header chip; **NEVER** a quota display that hides the boost origin (C8) or a tier label the API did not send.

## §3 The Jont Page Template (LOCKED)

One template renders all 247 Jonts from `manifest_json` (VOL-11 §2). Sections, in order: **(1)** H1 = Jont title; subtitle = the evidence-cited one-liner from the card (VOL-02 §3 copy rules); **(2)** the run panel — inputs per the manifest's input schema (file picker with the tier's `max_upload_mb` stated before selection, text areas, dropdowns); **(3)** the honest execution label: "runs in your browser — files never leave your device" vs "runs on our server" per `context` (C6/C8 — the label is generated from the manifest, never hand-written); **(4)** results area with export buttons (the formats the manifest declares) and, for PRO/MAX-fit previews, the first-N-rows free preview before the paywall (VOL-01 §3.2); **(5)** presets bar (save/load per tier limits); **(6)** related Jonts in family (internal links = SEO). **MUST:** a 402 response renders the upgrade card with `upgrade_url` and the reset time; a 429 renders "daily reset at 00:00 UTC" honestly (VOL-01 §4.3); **NEVER** a client-side Jont that silently calls the server (the manifest validator enforces it, VOL-11 §2).

## §4 Client Engine Loader (LOCKED)

Engines are static ES modules + WASM in `apps/pwa/src/jonts/` and `src/engines/`, loaded lazily per Jont page, executed inside a **Web Worker** with a 2 GB memory guard and a cancellable job object (the `concurrent_jobs` limit applies client-side too: Free = 1). The loader contract: fetch engine by content-hashed URL → instantiate WASM → stream inputs (File API) → post progress → return result bytes; results render locally; nothing uploads unless the user saves a result to history (server Jonts excepted — they inherently hit `/api/jonts/{id}/run`, VOL-05 §4). **MUST:** the loader checks entitlement *only* for saving/presets on PRO-fit client Jonts (UI-level gate, VOL-01 §4.4) — execution itself is never blocked client-side; **NEVER** a client engine fetching an AI provider directly (fuzzy steps go through the platform's AI router, VOL-05 §10, so keys and quotas stay server-side).

## §5 Programmatic SEO (LOCKED)

One page per Jont (from the manifest + card fields: problem statement, I/O contract in plain language, FAQ of 3 honest questions) and one hub per family. Generation is build-time (`scripts/seo-gen.ts`) → `public/seo/`, canonical URLs absolute, `sitemap.xml` from the `jonts` registry (VOL-05 §7), robots allows all. Copy rules: E1/E2 claims only (VOL-02 §7), the tier badge shown on the page ("Free to run · save results from Pro"), **NEVER** doorway spam — every page must contain the tool itself (client-side) or a working preview (server-side), because the page *is* the product for Free Jonts. Lighthouse ≥ 90 performance + accessibility on the home page and one Jont page is the Phase-4 exit condition (VOL-00 §0.3).

## §6 Dashboard Details (LOCKED)

Quota meters show `base`, `boost`, `effective`, `remaining`, `resets_at` from the envelope (VOL-01 §4.3) — Boost values render as "from ads" in the PWA (granted in the Mini App; the PWA displays, never grants). History list respects retention horizons and shows "hidden by downgrade" rows as locked-but-present (VOL-01 §4.4). The tokens screen implements the D-04 factory ceremony exactly: creation modal shows the secret once with a copy button and a "I stored it" acknowledgment; PAT rotation requires typing `ROTATE` (VOL-05 §6); AAT list shows last-used and per-token usage sparkline from `/api/v1/tokens` metadata. Billing section is read-only status (tier, source, window ends, reminder schedule) — checkout buttons deep-link to the USDT invoice flow (§4 of VOL-06) or instruct Mini-App purchase for Stars.

## §7 Service Worker, Offline, Performance (LOCKED)

SW strategy: app shell + engines = stale-while-revalidate; catalog JSON = network-first with 1 h cache; API calls = network-only (never cache quota/auth answers). Offline behavior: client-side Jonts already installed run offline; server-side Jonts show an honest offline card. Install prompt follows stock PWA criteria; the About screen renders `VERSION` (build-time injection, VOL-03 §2). **MUST:** Lighthouse budgets enforced in CI; **NEVER** a breaking SW update without a version-matched cache purge keyed on `VERSION`.

## §8 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T7.1 | U-FREE, client-side Free Jont | run with airplane mode on | completes locally; nothing in the network tab but static assets |
| T7.2 | U-FREE, PRO-fit client Jont | run | executes (UI-level gate only); save preset → upgrade card; no server execution refusal |
| T7.3 | U-FREE, MAX-fit server Jont | run | first-N preview renders; full run → 402 + `upgrade_url` + reset time |
| T7.4 | Any user | open `/pricing` | values match `plans` seed byte-for-byte (T1.10 shared) |
| T7.5 | Any user | `/about`, envelope header, `/health` | all three show the same `VERSION` string |
| T7.6 | Session user | create AAT via factory | shown-once ceremony; token appears with last4; `mcp_aats_max` enforced at limit |
| T7.7 | Session user | rotate PAT | type-`ROTATE` gate; old secret dead ≤ 60 s (T5.5 shared) |
| T7.8 | Fresh visit, consent unset | onboarding card | shows once; "decide later" → `denied`, re-ask in 7 days (T5.8 shared) |
| T7.9 | Home + one Jont page | Lighthouse CI | performance ≥ 90, accessibility ≥ 90 |
| T7.10 | Boost-granted Free user | PWA quota chip | shows +20 "from ads" honestly; no Boost button exists on the PWA |

**DoD hooks (VOL-14):** "Lighthouse gates green" (G-06), "C6 leak test: client Jonts make zero API execution calls" (G-07), "token factory ceremony + consent card verified in UI" (G-23), "SEO pages render with canonicals + sitemap" (G-08).
