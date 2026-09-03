# Volume 9 — Chrome Extension (S3)

**Document:** JONTRIX Build Specification — VOL-09
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 (C3, C6), VOL-01 §2.2 (surface), VOL-05 (routes, envelope), VOL-06 §2 (session auth). Referenced by: VOL-12 (extension-exposed flags), VOL-14 (DoD).

---

## §1 Scope (LOCKED)

An MV3 extension ("Right-click → JONTRIX") that runs **server-side Jonts from any origin tab** and deep-links to client-side ones on the PWA. It is a distribution channel (C3: the store listing is permanent free shelf space) and a retention surface; it is **not** a second product — no business logic beyond calling the platform API (VOL-01 §2.2). Bundle discipline: Preact only where needed (popup), no framework in the service worker, **zero ad code** (D-02), zero telemetry (C8).

## §2 Architecture (LOCKED)

Three surfaces in one MV3 package: **service worker** (all API calls, quota cache, context-menu routing), **popup** (catalog search, quota chip, quick-run of the last-used tool), **content script** (selection capture, page metadata, result overlay injection — declared `host_permissions: <all_urls>` only for the overlay; API calls never read page data the user did not select). Auth reuses the **same session cookie** as the PWA: `fetch` from the service worker with `credentials: 'include'` against `api.jontrix.app` under `host_permissions` — no new token kind, no PAT in the extension (PATs are terminal credentials, D-03), no AAT here (AATs are for agents, VOL-10 §2). Login = `chrome.identity.launchWebAuthFlow` opening `app.jontrix.com/auth/extension`, which sets the cookie and closes.

## §3 Features (LOCKED)

**Context menu:** selection → 10 pinned quick tools (the extension-exposed set from the `jonts` registry flag, VOL-12) + "More JONTRIX tools…" (opens the PWA search). **Popup:** quota block (base/boost/effective, reset time), last-run history (local, device-only), catalog search with deep links. **Overlay:** results render in a shadow-DOM card anchored to the selection, with copy/export buttons and the same honest 402/429 copy as the PWA. **MUST:** every run shows which Jont ran, its tier badge, and the reset time after a cap; **NEVER** auto-running anything on page load, never a content script that scrapes without selection, never an overlay ad or promo banner (C8).

## §4 Rate and Brake Behavior (LOCKED)

The extension is a first-class metered client: every run passes the same middleware (VOL-05 §5); burst and 402/429 render in the overlay. In **conservative mode** (VOL-01 §6) the extension halves its polling and disables background prefetch; in **read-only mode** it queues nothing and says so. **MUST:** the quota cache in the service worker honors envelope `version` bumps within 60 s; **NEVER** a client-side grace invention (the gateway's honesty rule, VOL-10 §7, applies here too).

## §5 Store Listing (LOCKED)

Assets at build time: 128/440 icons, 5 screenshots (single-tool story, chain story, quota honesty, MCP teaser, privacy line), 132-char summary, description that cites only E1/E2 research patterns (VOL-02 §7). Privacy tab: "no data collection; server-side tools process only what you select; files for client-side tools never leave the browser" — every claim must trace to the spec (C8). Category: Productivity. The listing ships in the Phase-7 exit checklist (VOL-00 §0.3).

## §6 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T9.1 | U-PRO, any origin tab | select text → quick tool | result overlay in < 5 s; run metered in `jont_usage` with `source='extension'` |
| T9.2 | U-FREE at daily cap | same run | 402 copy + reset time in overlay; no retry loop |
| T9.3 | Logged-out extension | any run | login deep-link; after auth, cookie present; no token stored in `chrome.storage` |
| T9.4 | Client-side-only Jont | invoked from extension | deep-links to the PWA page (extension never bundles client engines — one runtime, VOL-11) |
| T9.5 | Read-only brake mode | extension run | honest queue-free refusal with reset time |
| T9.6 | Extension bundle | grep | no ad SDK, no analytics, no version literal outside the injected one (VOL-03 §2) |

**DoD hooks (VOL-14):** "extension loads unpacked + runs two server Jonts from any origin" (Phase-7 exit, G-09), "store assets + privacy claims trace to spec" (G-27), "no telemetry in extension bundle" (G-32 shared).
