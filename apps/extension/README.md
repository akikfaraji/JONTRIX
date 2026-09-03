# JONTRIX Extension (VOL-09)

MV3 — "Right-click → JONTRIX". Server-side Jonts run from any origin tab;
client-side ones deep-link to the PWA (the extension never bundles client
engines — one runtime, T9.4).

- **Service worker** — all API calls (same session cookie as the PWA via
  `credentials: include`; no token kind stored, T9.3), quota cache honoring
  envelope version bumps within 60 s, context-menu routing (10 pinned quick
  tools + "More JONTRIX tools…").
- **Popup** — quota chip (base/boost/effective + reset), catalog search,
  quick-run of the last-used tool (local, device-only).
- **Content script** — selection capture + shadow-DOM result overlay with
  the same honest 402/429 copy as the PWA. Never scrapes without a
  selection; never auto-runs; never an overlay promo (C8).

Brake modes (§4): `conservative` halves polling and disables prefetch;
`read-only` queues nothing and says so. No client-side grace is ever
invented (the VOL-10 §7 honesty rule applies).

Zero ad code, zero analytics (D-02, C8, T9.6).

Load unpacked: `chrome://extensions` → Developer mode → Load unpacked →
this directory. Set the API base in `service-worker.js` (`API_BASE`).
