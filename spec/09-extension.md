# Volume 9 — Chrome Extension (MV3)

**Document:** JONTRIX Build Specification — VOL-09
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-01 §2 (surface S3), VOL-05 (envelope), VOL-06 §1 (identity). Referenced by: Phase 7, VOL-12 (CORS Echo `J-`, cURL-to-Code cards).

---

## §1 Manifest and Permissions (minimum viable, honestly explained)

MV3 manifest contract: `name` "JONTRIX — one subscription, every tool"; `version` derived at build from `VERSION` (VOL-03 §5; Chrome requires semver, so the mapping `V00.01.003-beta-04` → `0.1.3` with stage appended to `version_name`); `manifest_version: 3`; service worker background; `action` popup; `options_page` (account + connect card); `host_permissions` limited to the platform origins (`https://api.jontrix.app/*`, `https://mcp.jontrix.app/*`) — **no** `<all_urls>`; `storage` for session state; `contextMenus` for the right-click surface; `activeTab` instead of broad content-script access, requested per-interaction so the permission prompt is honest (C8). The Chrome Web Store listing ships with a permissions justification paragraph quoting exactly this section. **MUST:** every permission maps to a named feature in §3–5; the store draft is produced at Phase 7, not at launch. **NEVER:** `tabs`, `webRequest`, `scripting` on all sites, remote-hosted code (MV3 forbids it — all extension code ships in the package), or an update channel outside the store (self-hosted CRX updates require enterprise policy; not our users).

## §2 Background Service Worker (the API client)

The service worker owns three jobs: **session** — stores the platform session (VOL-06 §1 login via `chrome.identity.launchWebAuthFlow` against the PWA's auth callback, or an in-popup Telegram widget handoff; AGENT CHOICE between the two, decided once and recorded), refreshes it on the rolling 30-day window, and clears it on logout; **dispatch** — the single function that calls `POST /api/jonts/{slug}/call` with the VOL-05 envelope, injecting credentials and mapping §8 error codes to user-facing strings; **quota cache** — a 60-second entitlement snapshot per VOL-05 §6 so the popup renders meters without a network round-trip. The worker is event-driven and short-lived (MV3 lifecycle): every job is resumable from `chrome.storage.session`, and no job assumes the worker stays alive across awaits longer than a fetch. **MUST:** every extension API call carries `client: extension` in its meta so `jont_usage.source='extension'` attribution works (VOL-04 §2). **NEVER:** a long-lived alarm that pings the API (extension polling is halved in conservative brake mode, VOL-01 §6, and zeroed in read-only), or credentials in `chrome.storage.local` (session storage only — memory-backed, clears on browser exit).

## §3 Popup and Context Menu (the right-click surface)

Popup (≤ 360 px wide): signed-out state shows the one-screen login; signed-in shows tier, daily quota meter, and the last 5 Jont results; a search box filters the catalog (same registry source as `/jonts`, VOL-08 §1) and pins 3 favorites. Context menu: "JONTRIX →" on selections, links, images, and the page itself, each mapping to the manifest-declared quick-actions (e.g. selection → "convert with…", link → cURL-to-Code on API docs, image → Media-zone Jonts). Quick-actions open either inline results in the popup (small outputs) or a Jont page in `app.jontrix.app` with the payload handed over via a one-time, 30-second, single-use handoff token — large files always go through the PWA (the extension is a launcher and lightweight runner, not a second workbench). **MUST:** the context menu degrades gracefully when no handler matches (no dead items); the popup shows the honest quota numbers from the cached snapshot with reset time. **NEVER:** a popup that fetches on every open (cache-first), a handoff token valid twice, or content extracted from a page without `activeTab` granted for that interaction.

## §4 Server-Jont Proxy from Any Origin (the Phase-7 exit capability)

The extension's distinct power: run **server-side** Jonts from any origin tab without the page's CORS cooperating — because the call goes extension → `api.jontrix.app` (extension origin, platform host_permissions), never page → API. Two Jonts anchor this (both are VOL-12 cards and Phase-3/7 fixtures): **CORS Echo** (from DV-B3, the "biggest traffic pool" row): given a URL + method + headers, the server-side engine performs the request server-to-server and returns status, response headers, and a CORS diagnosis (which header is missing, why the browser refused) — the developer's "why is my fetch failing" answer in one call; **cURL-to-Code** (from DV-B5): given a copied cURL command, the deterministic parser produces fetch/axios/Python-requests/Go snippets (VOL-11 §4 converter pattern) with an optional AI fallback only for exotic flags (VOL-05 §5). The content-script bridge (when `activeTab` is granted) can capture "the failing request as cURL" from DevTools-adjacent context and hand it to cURL-to-Code — this chain is the extension's wedge into the DevTools zone. **MUST:** proxied calls obey the same gates, quotas, and ledgers as every other surface (no extension free lunch); request bodies from pages are never persisted (§2 storage rule). **NEVER:** an open proxy (the extension calls JONTRIX server-side Jonts only, and CORS Echo refuses private-network targets per the Jont card's SSRF guard — VOL-12 card contract), or a bypass that sends page data anywhere but `api.jontrix.app`.

## §5 Store Listing and Update Discipline

Assets produced at Phase 7: 128/440/920 px icons, 1 small + 3 large screenshots (popup, context menu, a Jont result), the honest one-paragraph description (no superlatives C8 forbids), and the privacy policy page (static, on `jontrix.app/legal/extension-privacy`) stating: session token storage, per-call payloads processed and not retained, no browsing-history access. Updates ride the store with the derived semver; `version_name` carries the full FRAZIYM string for support identification. Store review notes pre-answer the three questions reviewers ask: single purpose (toolbox launcher for the user's own account), permissions justification (§1), remote code (none). **MUST:** the listing version and `/health` version match at every submission. **NEVER:** a listing claim the product doesn't honor (C8), or a submission without the privacy policy URL live.

## §6 Acceptance Tests — Extension (Phase-7 exit gate)

| # | Given | When | Then |
|---|-------|------|------|
| T9.1 | Unpacked build | loads in Chrome stable | zero errors; MV3 warnings clean; version fields match `VERSION` mapping |
| T9.2 | Signed-out | popup login | session issued via chosen flow; popup shows tier + quota within 2 s |
| T9.3 | Any page (Phase-7 exit) | runs CORS Echo + cURL-to-Code from the context menu on a foreign-origin tab | both return envelope results; `jont_usage.source='extension'`; page's own CORS irrelevant |
| T9.4 | U-FREE at daily cap | 26th server call from extension | 402 surfaced in popup with reset time; no retry loop |
| T9.5 | Browser restart | reopen popup | session survives (rolling window) or re-prompts honestly at expiry; quota cache rebuilds ≤ 2 s |
| T9.6 | Read-only brake (VOL-01 §6) | any server Jont attempt | `TOOL_UNAVAILABLE` with `resets_at`; extension shows banner; polling already at zero |
| T9.7 | cURL input with exotic flag | cURL-to-Code | deterministic parse where covered; AI fallback only for the flagged portion; cache hit on second run |
| T9.8 | Handoff token | reused after 30 s or twice | rejected both times; popup explains and re-issues on demand |
