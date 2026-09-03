# Volume 7 — PWA Surface (Web App + Programmatic SEO)

**Document:** JONTRIX Build Specification — VOL-07
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-01 (surfaces, tiers), VOL-05 (envelope, config), VOL-11 (manifests, engines). Referenced by: Phase 4, VOL-08 (Mini App host reuse).

---

## §1 Application Shell and Service Worker

The PWA at `app.jontrix.app` is a Vite + Preact single-page application whose shell is intentionally boring: header (catalog, search, account), a Jont-page outlet, and a footer carrying the version (`src/version.ts`, VOL-03 §5) and the honest status link (VOL-05 §7). The **service worker** contract: app-shell precache (HTML, JS, CSS — content-hashed); engine assets and SEO pages served stale-while-revalidate; API responses never cached by the SW beyond the per-session in-memory store, because entitlements and results are per-user data (VOL-05 §6). Offline behavior is honest, not theatrical: with a cold cache the user sees the shell, the catalog from the last successful `/api/config` snapshot, and a "you are offline — client-side Jonts still work" banner; server-side Jonts queue nothing (C8: no fake sync). **MUST:** Lighthouse performance and accessibility ≥ 90 on the home page and one Jont page (the Phase-4 exit condition), measured in CI on every deploy. **NEVER:** a service worker that caches authenticated responses, a stale SW that survives two deploys (skipWaiting + clients.claim with a version-keyed cache name per FRAZIYM `VERSION`), or a shell that renders prices from anywhere but `/api/config`.

## §2 The Jont Page Template (one template, 247 instances)

Every Jont renders through one template parameterized by its manifest (VOL-11 §2) — there is no per-Jont page code, which is what makes 247 Jonts maintainable under 10 min/week (C4). Template sections, in order: **(1)** H1 = the Jont's `name`; subtitle = the row's evidence-cited problem statement verbatim from the registry (VOL-00 §0.5's requirement, fed by VOL-13's seed); **(2)** the workbench (§3–4) sized to the Jont's pattern; **(3)** the honest execution label — "runs in your browser" or "runs on our server" — from `manifest.context` (C6, VOL-01 §3.3); **(4)** tier gate: FREE-fit renders full workbench; PRO/MAX-fit renders the value preview (first N rows / watermark / full analysis of a sample) with the upgrade panel naming the exact tier and price from `/api/config`; **(5)** presets + history slots for signed-in users (VOL-01 §4.2 allowances); **(6)** "related Jonts" (same cluster, 3 items) — the chaining surface that answers DR-D2's tool-stitching pain; **(7)** JSON-LD (`SoftwareApplication` + `FAQPage`) for the SEO layer (§5). **MUST:** the tier gate renders before any engine download for PRO/MAX-fit Jonts (no free WASM delivery of gated engines). **NEVER:** a per-Jont bespoke layout, an invented testimonial, or a gate that blocks the *preview* of a paid Jont's value (C8: show the value, then the price).

## §3 Engine Loader (client-side execution)

The loader resolves a Jont's `manifest.engine` to a content-hashed asset in the R2 `engines` bucket (VOL-04 §3), fetches it with the SW caching it for offline reuse, and instantiates it: WASM modules stream-compile with `WebAssembly.instantiateStreaming`; heavy JS engines load as module workers. Loading is progressive — the workbench paints first, a spinner names the engine size honestly ("loading 2.1 MB engine, one time, then cached") — and the loader refuses to download gated engines for locked tiers (§2). Execution runs in a **worker**, never on the main thread; progress is reported as manifest-declared stages (e.g. `parse → transform → serialize`) so the UI can show real progress, not fake bars. Memory: the loader enforces the manifest's `max_input_mb` client-side before reading the file, with the honest error naming the limit and the tier that raises it. **MUST:** the engine communicates with the page only via structured postMessage per the pattern contracts (VOL-11 §4) — no engine touches `fetch`, storage, or DOM. **NEVER:** an engine fetch on a gated Jont before the gate decision, a main-thread transform above the manifest's small-input threshold, or an engine bundle without its content-hash.

## §4 Worker Pipeline (large inputs, batches, chaining)

One pipeline component serves the three hard jobs in the catalog: large files (DR-B2/DV-B1: 100 MB–1 GB+ JSON/CSV), batches (row-limited per tier, VOL-01 §4.2), and chaining (the DR-D2 stitch: output of one Jont feeds another without a re-upload). Contract: the pipeline reads File/Blob inputs as **streams** in the worker, processes in manifest-declared chunks (e.g. NDJSON line-groups, CSV row windows), emits partial results incrementally so the UI shows usable output before completion, and enforces the tier's `batch_rows_max` with a live count. Chaining is a local handoff: Jont A's output blob becomes Jont B's input via an in-memory handle — nothing re-uploads, nothing round-trips the server, and the chain UI (a breadcrumb of applied Jonts) is the product's answer to "five websites, five paywalls" (VOL-01 §1). **MUST:** the pipeline backs pressure off (pause/resume via stream backpressure) instead of buffering 1 GB; cancellation is immediate and total. **NEVER:** a client-side "batch" that silently downsamples (it stops at the tier limit with an honest message), or a chain that persists intermediates anywhere (memory or explicit user save only — C6).

## §5 Programmatic SEO Pages (the top of funnel)

`scripts/seo-gen.ts` runs at build (and on catalog change) and emits static pages to `public/seo/` served at `jontrix.app`: **one page per Jont** (`/jonts/{slug}/` — canonical, H1 = name, subtitle = problem statement, FAQ block from the manifest's 3 seeded Q&As, JSON-LD, single CTA to `app.jontrix.app`), **one page per cluster** (`/collections/{cluster}/` — the 7 cluster averages and member lists from the frozen file), and **one page per (zone × top-query)** pairing derived from the registry's `seo_json` (VOL-04 §2) — roughly 247 + 7 + ~40 pages, each internally linked from its Jont page. Every page: canonical URL, `sitemap.xml` regenerated per deploy, `Last-Modified` honest, and **zero** thin-content pages (each carries the evidence paragraph, the FAQ, and real interlinks — Google-thin content is a C8 violation too). `seo_query` values from the frozen file are the only keyword sources; the agent does not invent keywords. **MUST:** every SEO page renders identically with JS disabled (static HTML first). **NEVER:** a doorway page cluster targeting one query stem with cosmetic variants, hidden text, or a canonical pointing anywhere but itself.

## §6 Entitlement Surfaces in the PWA (thin, honest, cached)

The PWA consumes entitlements through three hooks and nothing else: `useEntitlement()` (60-second cached `Entitlement`, VOL-05 §6), `useQuota()` (live counters for the honest "X of Y today" meter in the workbench header), and `useGate(jont)` (the §2 decision). The account panel: login (VOL-06 §1), tier + window + renewal date, quota meters, MCP connect card (the VOL-10 §9 three-step onboarding, verbatim), and the PWA pricing page rendering `plans` from `/api/config` with the Stars dual-price row (VOL-01 §5.2). Upgrade CTAs deep-link: PRO/MAX gates link to the pricing page; MCP quota exhaustion links to the same page with `#mcp`. **MUST:** every quota meter shows real numbers and reset time. **NEVER:** an interstitial nag, an upgrade toast more than once per session, or pricing text hard-coded in the PWA bundle.

## §7 Acceptance Tests — PWA (Phase-4 exit gate)

| # | Given | When | Then |
|---|-------|------|------|
| T7.1 | Fresh visitor | Lighthouse audit on home + one Jont page | performance ≥ 90, accessibility ≥ 90, best-practices ≥ 90 |
| T7.2 | U-FREE | opens PRO-fit Jont page | value preview renders; engine not fetched; gate names tier + price from `/api/config` |
| T7.3 | Any tier | runs a 500 MB NDJSON Jont | streaming progress; UI responsive; cancellation frees memory within 2 s |
| T7.4 | U-PRO at 500/500 daily calls | 501st server call | envelope 402 `QUOTA_EXCEEDED`; meter shows reset time; no engine or data left the browser |
| T7.5 | Offline, warm cache | opens a client-side Jont | fully functional; banner states offline honestly; server Jonts explain why they're unavailable |
| T7.6 | Bot crawler | fetches `/jonts/{slug}/` for all 247 slugs | 200, canonical self, JSON-LD valid, zero 404s; sitemap lists all pages |
| T7.7 | U-PRO | chains Jont A → B on a 50 MB file | no re-upload; breadcrumb shows both; intermediate never hits disk or network |
| T7.8 | Any visitor | views about screen | version matches deployed `/health` `meta.version` exactly |
