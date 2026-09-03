# Volume 5 — Platform Core: Router, Auth, Middleware, AI Router, Errors

**Document:** JONTRIX Build Specification — VOL-05
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-01 §4 (limits/counters), VOL-04 (schema). Referenced by: VOL-00 C7 (AI router = §5), VOL-06 (auth), VOL-07/08/09 (consumers), VOL-10 §4.10 (error codes).

---

## §1 Request Lifecycle and the Response Envelope

Every API request follows one lifecycle, in order, and every handler can assume the steps before it succeeded: **(1)** the router matches method + path and binds the app's typed `Env`; **(2)** the request-id middleware attaches a fresh `req_<16 hex>` id and starts the clock; **(3)** auth resolves the caller (session cookie for browser surfaces, bearer for MCP/extension) or records `anonymous`; **(4)** entitlements load or construct the caller's `Entitlement` (VOL-01 §4.1) and the matched Jont's manifest; **(5)** the quota/rate stage runs the atomic check-and-increment (§6); **(6)** the handler executes and returns through the envelope; **(7)** the ledger stage appends `jont_usage` (calls) or `usage_ledger` (events) asynchronously — never blocking the response on the write, but never dropping it silently either (a failed ledger write retries once, then logs to `usage_ledger` itself as a `ledger_write_failed` event). Responses always wear one envelope:

```json
{ "ok": true, "data": { }, "meta": { "version": "<VERSION>", "request_id": "req_…", "warnings": ["quota_80"] } }
```

Errors use the same envelope with `ok: false` and `error: { code, message, …context }` per §8. **MUST:** `meta.version` comes from `src/version.ts` (VOL-00 §0.7) on every response, which is how support chats identify the exact build. **NEVER:** a handler bypasses the envelope, a middleware reorders the lifecycle, or a response omits `request_id`.

## §2 Router and Middleware Chain (contract)

The router is a static method+path table compiled at build time — no dynamic route construction, no wildcard catch-alls except the SEO host (VOL-07 §5). Route families: `/health` (§7) · `/api/config`, `/api/status` (§7) · `/api/auth/*` (VOL-06 §1–2) · `/api/billing/*` (VOL-06 §3–5) · `/api/jonts/*` (catalog + call) · `/api/results/*` · `/api/mcp/*` and `/mcp` (VOL-10 §4 — same middleware chain, deployed as the MCP worker). Middleware is a fixed ordered list per route family, declared as data (array of names), so the lifecycle above is auditable in one place; adding middleware mid-list without a decision entry fails review. **MUST:** every route declares its auth level (`public | anonymous-ok | user | pat | aat`), its quota tags (`server_call`, `ai_call`, `mcp_call`, `none`), and its cache policy (§6) in the same table row — the middleware reads the declaration rather than each handler re-implementing it. **NEVER:** CORS headers on the API except the app origin (VOL-10 §8.7), or a route that exists in code but not in the table (CI asserts the table is exhaustive against a route-snapshot test).

## §3 Auth Middleware (contract)

Two credential families, one resolution result: `Caller = { kind: 'anonymous' | 'user' | 'token', user_id?, token_id?, via }`. Browser surfaces resolve an HttpOnly session cookie (`SameSite=Lax`, `Secure`, 30-day rolling expiry, value = random 256-bit id → `sessions` KV-cached row → `users`); MCP/extension resolve `Authorization: Bearer jx_(pat|aat|sess)_…` through the VOL-10 §2 pipeline (hash lookup → status → scope). Session issuance happens only in VOL-06 §1–2 flows; the auth middleware never creates credentials, only verifies them. **MUST:** anonymous callers get a salted IP+UA hash id for quota keying (VOL-01 §4.3) — the salt lives in a Worker secret, the hash is never reversible into an IP, and no anonymous row is ever written to `users`. **NEVER:** the middleware trusts a client-supplied user id, a cookie survives logout (logout deletes the session row and clears the cookie), or a bearer token is accepted on a cookie-auth route (VOL-10 §8.7's bearer-only rule applies to `/api/mcp/call` and, by extension here, to `/api/jonts/*/call` from the extension — same caller contract, both accepted deliberately).

## §4 Entitlements Middleware (implements VOL-01 §4)

The middleware exposes exactly one decision function to handlers: `gate(caller, tag, jont?) → { allowed: true, entitlement, counters } | { allowed: false, error }`. Internally it: reads `ent:{user_id}` from KV (60 s TTL), falls back to the single `entitlements` PK row (bumping KV only when `version` differs — VOL-04 §3); resolves the Jont's `tier_fit` against the tier map (FREE→all, PRO→pro+, MAX→max); computes the effective counter cap (tier `Limits`, halved for anonymous per VOL-01 §4.3, AAT clamp per VOL-10 §2 when the caller is a token); and performs the atomic check-and-increment on `usage_counters` in one D1 transaction — the guarantee VOL-01 §4.3 demands, so two concurrent calls cannot both consume the last unit. Refusals map to §8 codes: tier miss → `TIER_LOCKED` (402), counter full → `QUOTA_EXCEEDED` (402), burst → `RATE_LIMITED` (429). At 80% of any counter it appends `quota_80` to `meta.warnings` (VOL-01 §4.3) — surfaces render the honest one-time prompt from that warning and from nowhere else.

## §5 AI Router (C7: rotate, never exceed)

AI is a fallback for fuzzy steps only (VOL-11 §1), and every AI call is cached. The router holds a provider table seeded from `research/ai-providers.md`: each provider row is `{ id, models, free_daily_estimate, priority }`; AGENT CHOICE governs which 3–5 providers ship at build time from that research, and the table is data (D1 `config` via seed), not code. Selection algorithm, in order: **(1)** exact-cache — the pair (task hash of prompt+model-class+inputs) is looked up in KV/D1 (prompt cache rows in D1 `ai_cache`: `hash PK, response_json, created_at, hits`); a hit returns instantly and increments `hits`. **(2)** health memory — providers with a recent failure (in-memory circuit breaker, 10-minute half-open window) sink in priority. **(3)** rotation — the highest-priority healthy provider with remaining daily headroom; on 429/quota-exhaust or timeout, mark degraded and move to the next. **(4)** give-up — if all providers are degraded or the monthly `ai_calls` counter (VOL-01 §4.2: 0/100/1000/5000) is exhausted, return the deterministic-path error `AI_UNAVAILABLE` with the Jont's deterministic fallback message; the request never queues or waits on AI. **MUST:** every AI call records provider, model, cache status, and latency in `jont_usage.ai_json`; prompts contain user content only for the minimal fuzzy step (never whole files when a slice suffices — VOL-11 §5). **NEVER:** two providers called for one step "for quality", a user's text used for provider-side training promises (only providers whose terms permit API usage without training retention are seeded), or an AI call on a path a deterministic algorithm covers.

## §6 Rate Limiter and Cache

Burst limiting: 10 requests / 10 s per bearer-or-session-or-anon-hash, tracked in KV `burst:{key}` (TTL 10 s, ≤2 KV writes per call — the only per-request KV writes in the platform, VOL-04 §3); trips return 429 + `Retry-After: remaining-window-seconds`. Daily counters are D1 (§4), so cap accounting survives KV loss. Caching is a three-layer contract: **edge** — SEO pages and engine assets are static with immutable content-hash headers (VOL-07 §5); **KV** — entitlements (60 s), tool catalog ETag (VOL-10 §4.5), platform config (5 min); **D1** — authoritative rows, never cached longer than their `version` allows. **MUST:** cache invalidation is version-driven — a `version` bump in `entitlements` is the only signal surfaces need, which is why VOL-01 §4.1 made it mandatory. **NEVER:** caching a per-user response at the edge (privacy), writing KV per request beyond the burst exception (cap math), or a cache TTL longer than its contract row above.

## §7 Health and Utility Endpoints (the Phase-2 three)

**`GET /health`** → `200 {"status":"ok","version":VERSION,"env":"production|preview","uptime_hint":…}` — no auth, no DB touch (a deploy-target probe must stay cheap); the watchdog (VOL-14 §6) pings it and the dead-man switch relies on it. **`GET /api/config`** → public platform config for all surfaces: seeded `Plan` rows (prices per VOL-01 §5.5), tier matrix summary, catalog counts by tier, current `brake` mode, and the minimum client versions — one anonymous call lets any surface render correctly without hard-coded prices. **`GET /api/status`** → honest operational status: brake mode, last watchdog run, catalog size, version, and any active incident note (VOL-14 §7); it is the page behind the status link in every surface's footer (C8). All three are envelope responses, all three render `VERSION` from `src/version.ts`.

## §8 Error Taxonomy (LOCKED — the only error codes in the platform)

| Code | HTTP | Meaning / raised by | Envelope extras |
|------|------|---------------------|-----------------|
| `AUTH_REQUIRED` | 401 | no credential where one is required (§3, VOL-10 §4.10) | — |
| `AUTH_INVALID` | 401 | unknown/revoked/expired session or token | — |
| `SESSION_EXPIRED` | 401 | browser session past 30-day rolling window | `reauth_url` |
| `FORBIDDEN_TOOL` | 403 | AAT scope denies the tool (VOL-10 §2) | `token_name` |
| `TIER_LOCKED` | 402 | tier does not unlock the Jont (§4) | `upgrade_url`, `tier_fit` |
| `QUOTA_EXCEEDED` | 402 | daily/monthly counter full (§4, VOL-10 §7) | `upgrade_url`, `resets_at` |
| `RATE_LIMITED` | 429 | burst window tripped (§6) | `Retry-After` |
| `UNKNOWN_JONT` | 404 | slug not in registry | — |
| `UNKNOWN_TOOL` | 404 | MCP tool name not in registry (VOL-10 §4.10) | — |
| `ARGUMENTS_INVALID` | 422 | input fails the manifest `inputSchema` (VOL-11 §2) | `field_paths[]` |
| `CONFLICT_IDEMPOTENCY` | 409 | in-flight duplicate idempotency key (VOL-10 §6) | `retry_after` |
| `AI_UNAVAILABLE` | 503 | §5 give-up state | `deterministic_hint` |
| `TOOL_FAILED` | 500 | Jont engine raised (VOL-11 §3) | `tool_trace_id` |
| `TOOL_UNAVAILABLE` | 503 | engine asset missing / brake read-only mode | `resets_at?` |
| `INTERNAL` | 500 | catch-all; detail never leaks internals | `request_id` only |

**MUST:** every error path in every app raises through this table — new codes require a spec revision, not a handler's whim; messages are human, honest, and actionable (C8), and never include stack traces or internal ids beyond `request_id`.

## §9 Observability and the Platform Test Suite

Logging is structured JSON lines with `request_id`, route, caller kind, and outcome — payload bodies never (VOL-10 §8.8 extends platform-wide). Metrics derive from the ledgers, not from a metrics vendor (C1): `usage_ledger` answers "what happened", `jont_usage` answers "how much", and the hourly watchdog (VOL-14 §6) turns both into the daily digest posted to the founder's Telegram. The platform test suite `tests/platform/` (Phase-2 exit gate) covers, minimum: envelope shape on success and on every §8 code; the atomic counter race (two parallel calls, one unit left — exactly one wins); KV-outage fallback (entitlements resolve from D1, burst fails open to D1 counting); anonymous halving; brake modes' effect on dispatch; and the version-hygiene assertion reused from VOL-00 §0.7. All fixtures come from `tests/fixtures/` (VOL-03 §6); no test touches a live third party.
