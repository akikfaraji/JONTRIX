# Volume 5 — Platform Core (API Worker, Middleware, Data Plane)

**Document:** JONTRIX Build Specification — VOL-05
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 (constraints, versioning), VOL-01 §4 (entitlements), VOL-04 (schema), VOL-10 §2/§4.4 (token kinds). Referenced by: VOL-06 (billing), VOL-07/08/09 (surfaces), VOL-11 (dispatch), VOL-14 (DoD).

---

## §1 The API Worker's Shape (LOCKED)

One Worker (`apps/api`, `api.jontrix.app`) is the whole platform core: router → middleware chain → route handler → envelope. The middleware chain is fixed and ordered — **CORS → request-id → burst (KV) → auth → kind check → entitlements (check-and-increment where metered) → handler → envelope → log**. A request that fails at any stage never reaches the next one, and failures return the §9 taxonomy with the request id attached. **MUST:** every route in this volume and in VOL-06/07/08/09 is served by this one worker; the MCP worker (VOL-10) shares the same D1 and library code but not the process. **NEVER:** business logic in middleware; a second auth implementation in any surface client.

## §2 Response Envelope (LOCKED)

Every JSON response from the API and MCP workers uses one envelope. Surfaces parse this and nothing else:

```ts
interface Envelope {
  ok: boolean;
  data?: unknown;                 // handler payload on success
  error?: { code: string; message: string; field?: string; upgrade_url?: string; resets_at?: string };
  warnings?: string[];            // e.g. ["quota_80"]
  quota?: { base: number; boost: number; effective: number; remaining: number; resets_at: string };
  meta: { request_id: string; version: string; ts: number };  // version imported from src/version.ts
}
```

**MUST:** `meta.version` is `import { VERSION } from 'src/version.ts'` (VOL-00 §0.7) — it appears in every response, and the DoD proves a response header/meta and `/health` never disagree. **MUST:** the `quota` block renders `base`, `boost`, `effective` separately so ad-boost headroom is always honest (VOL-01 §4.3). **NEVER:** a bare-body response outside this envelope (static assets exempt).

## §3 The `/api/v1/*` Data Plane — the PAT Surface (LOCKED, D-03)

The data plane is the **only** surface a PAT can touch. It exists so a user can pull and manage **their own data** from a terminal, script, or CI with one credential. Auth: `Authorization: Bearer jx_pat_…`; kind check first (any other bearer → `403 TOKEN_KIND_MISMATCH` with `data_plane_only: true`).

### §3.1 Route Table

| Method & path | Reads/Writes | Purpose |
|---|---|---|
| `GET /api/v1/me` | R | identity, tier, window, consent state, PAT last4 |
| `GET /api/v1/quota` | R | same counters block as the envelope, plus MCP monthly |
| `GET /api/v1/export/history?format=json\|csv&since=&until=&cursor=` | R | history rows within tier retention (Free: empty — 0-day horizon) |
| `GET /api/v1/export/presets` | R | all presets, JSON |
| `GET /api/v1/export/results?since=&cursor=` · `GET /api/v1/results/{id}` | R | saved result bodies (R2-streamed when large) |
| `POST /api/v1/presets` · `PUT/DELETE /api/v1/presets/{id}` | W | preset CRUD (limits per VOL-01 §4.2) |
| `DELETE /api/v1/history/{id}` · `DELETE /api/v1/results/{id}` | W | targeted deletion (purges R2 body too) |
| `PATCH /api/v1/settings` | W | non-security settings only (`settings_json` allowlist: theme, locale, default export format) |
| `GET /api/v1/tokens` · `POST /api/v1/tokens` · `PATCH /api/v1/tokens/{id}` · `DELETE /api/v1/tokens/{id}` · `POST /api/v1/tokens/pat/rotate` | **session only** | the token factory (§6) — a PAT bearer here gets `403 TOKEN_KIND_MISMATCH` |

### §3.2 Behavior Rules

**MUST:** pagination is cursor-based, page size 100, `next_cursor` in `data`; exports are stable-sorted by `created_at, id` so a re-run is diffable. **MUST:** CSV export emits a header row and quotes per RFC 4180. **MUST:** PAT writes draw from the same daily server-call quota as app writes (`check-and-increment`, VOL-01 §4.3); PAT **reads** are unmetered but burst-limited at 10 req/10 s with a 2,000 req/day PAT ceiling (`pat_YYYYMMDD` counter) — D1 reads are cheap, runaway loops are not. **NEVER:** password/email change, billing, subscription, token management, account deletion, or consent changes over the PAT (control plane = browser session only, D-03/D-04); a request to any such capability via PAT returns `403 CONTROL_PLANE_LOCKED`. **NEVER:** cross-user access — every query is `WHERE user_id = <token owner>`; there is no admin flag, no impersonation (the founder's own access is the seeded `grant` account + session, C8).

## §4 App-Facing REST (session-authenticated)

Same worker, same envelope, session cookie auth (VOL-06 §2). Routes: `GET /api/me`, `GET /api/quota`, `POST /api/jonts/{id}/run` (server-side Jonts only — dispatch per VOL-11 §4; client-side Jonts never call this), `POST/GET/PUT/DELETE /api/presets…`, `GET/DELETE /api/results…`, `GET/DELETE /api/history…`, `PATCH /api/settings`, `POST /api/consent` (§8), `POST /api/account/delete` (dashboard only; enqueues VOL-04 §3 tombstone + purge). **MUST:** every metered route goes through the entitlements middleware; **NEVER** a surface-side bypass — the PWA, Mini App, and extension call these routes like any other client (VOL-01 §2.2).

## §5 Rate Limiter, Cache, Burst (LOCKED)

Burst: sliding 10-request/10-second window per bearer/session, keyed in KV `BURST` with 10 s TTL (two KV writes worst-case per call — inside the 1k/day cap because burst entries exist only for active tokens; VOL-01 §4.3). Tier caps: the entitlements middleware performs **one atomic check-and-increment** (D1) per metered call; 80% → `warnings:["quota_80"]`; 100% → `402 QUOTA_EXCEEDED` + `upgrade_url` + `resets_at`; burst → `429 RATE_LIMITED` + `Retry-After`. Cache: KV `ENT` holds the entitlement projection ≤ 60 s, invalidated by `version` bump on every mutating event (VOL-04 §4); **no per-request KV writes, ever**; conservative/read-only brake modes (VOL-01 §6) are flags read from KV `STATE` at request start — flipping them is a watchdog write, not a deploy.

## §6 The Token Factory — `/api/v1/tokens` (LOCKED, D-04)

The dashboard (session cookie only) is the sole factory. Contract (binding for VOL-10 §4.4):

| Route | Rules |
|---|---|
| `GET /api/v1/tokens` | list own tokens: `id, kind, name, prefix, last4, status, scopes, expires_at, last_used_at` — never secrets |
| `POST /api/v1/tokens` | `{"kind":"aat","name":…,"scopes":{…TokenScopes…}}` → `201` with secret shown **exactly once**; enforces `mcp_aats_max` (422, tier named); `max_calls_per_day` clamped to tier (422 on over-clamp) |
| `POST /api/v1/tokens/pat/rotate` | **PAT rotate:** new secret issued + shown once; old secret marked `rotated` and dead ≤ 60 s; audit `token.rotated`; body `{"confirm":"ROTATE"}` required (UI makes old-secret death explicit) |
| `DELETE /api/v1/tokens/{id}` | revoke any own token; audit `token.revoked`; revoking the PAT leaves the user PAT-less until they create one again (dashboard asks twice) |
| `PATCH /api/v1/tokens/{id}` | rename or edit AAT scopes → **issues a replacement token** (scope edits never mutate a live secret); old row `rotated` |

**MUST:** creation/rotation responses carry a one-line "this is shown once" warning; **NEVER:** any endpoint here accepts a PAT or AAT bearer (kind check rejects with `403 TOKEN_KIND_MISMATCH`), and no route outside this table mints tokens (VOL-10 §3.1 device-approval page calls `POST /api/v1/tokens` with the user's session cookie — it is a dashboard surface, not a separate API).

## §7 Health, Version, Utility Endpoints (LOCKED)

`GET /health` → `200 {"status":"ok","version":VERSION,"deps":{"d1":"ok","kv":"ok","r2":"ok"}}` (deps checked with 1 cheap op each; any failure still 200 with `degraded` — the watchdog reads the body, VOL-14 §6). `GET /health/deep` (founder token only) adds row-counts and last-cron timestamps. `GET /robots.txt`, `GET /sitemap.xml` (generated from `jonts.seo_slug`, VOL-07 §5). **MUST:** `/health` and every envelope `meta.version` import the same `VERSION` — a build-time grep proves no other version literal exists (VOL-00 §0.7).

## §8 Consent and Settings Endpoints (LOCKED, D-05)

`POST /api/consent` (session only): `{"consent":"granted"|"denied","policy_version":N,"surface":"onboarding"|"settings"|"re-ask"}` → updates `users.ai_training_consent` + writes `consent_events` in one transaction (VOL-04 §5) and returns the new state. `GET /api/consent` returns current state + current published policy version (VOL-16 §6). **MUST:** onboarding surfaces show the consent card once (`consent_asked_at IS NULL`); "decide later" leaves state `denied` and re-prompts after 7 days; a published policy bump (`policy_version` > user's `consent_version`) triggers the re-ask banner on next visit — never an automatic flip. **NEVER:** training-pipeline queries (VOL-16 §6) read any row whose owner's consent ≠ `granted` at export time; consent data is excluded from PAT exports (it is account state, not user content — `/api/v1/me` shows it read-only).

## §9 Error Taxonomy (LOCKED)

| HTTP | `code` | Meaning / notes |
|---|---|---|
| 400 | `BAD_REQUEST` | malformed JSON/query; message names the field |
| 401 | `AUTH_REQUIRED` / `AUTH_INVALID` | missing bearer/cookie · unknown, revoked, rotated, or expired credential |
| 402 | `TIER_LOCKED` + `upgrade_url` | tool exists, tier does not unlock (VOL-01 §4.2) |
| 402 | `QUOTA_EXCEEDED` + `upgrade_url` + `resets_at` | cap reached — tier cap, never burst |
| 403 | `TOKEN_KIND_MISMATCH` | right secret, wrong surface (PAT on MCP, PAT on token factory) |
| 403 | `CONTROL_PLANE_LOCKED` | PAT attempted a control-plane action (§3.2) |
| 403 | `FORBIDDEN_TOOL` | AAT scope deny (VOL-10) |
| 404 | `NOT_FOUND` / `UNKNOWN_TOOL` | generic / catalog miss |
| 409 | `CONFLICT_IDEMPOTENCY` | replay during in-flight execution (VOL-10 §4.6) |
| 422 | `ARGUMENTS_INVALID` + field | schema validation failure |
| 422 | `LIMIT_REACHED` | preset/AAT count caps (message names tier) |
| 429 | `RATE_LIMITED` + `Retry-After` | burst window or read-only brake mode |
| 5xx | `TOOL_FAILED` / `TOOL_UNAVAILABLE` / `INTERNAL` | execution, upstream, or bug (trace id in `meta.request_id`) |

**MUST:** every 4xx/5xx is loggable without payloads (VOL-04 §5 audit rule); **NEVER** a 500 for a user error — if it can be caused by input, it is 4xx.

## §10 AI Router (FALLBACK wiring only)

The API exposes the AI fallback the runtime (VOL-11 §1) may call for fuzzy steps: provider order is a static list in config (deterministic-first is the runtime's law; AI is a capped fallback), keys live in Worker secrets, calls are cached by `(prompt-hash, model)` in KV `STATE` with 30-day TTL, and each call check-and-increments `ai_YYYYMM` against the tier's `ai_fallback_calls_per_month` (0 on Free — the middleware refuses before any provider contact). Provider ToS discipline is C7; no provider is called when the cache hits. Full provider table and pricing guards: VOL-15 §5.

## §11 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T5.1 | Any endpoint | inspect envelope | `meta.version` == `VERSION` from `src/version.ts`; `/health` matches byte-for-byte |
| T5.2 | U-PRO PAT | `GET /api/v1/export/history?cursor=…` | 100-row pages, stable order, `next_cursor` terminates; Free account gets empty `data` + honest copy |
| T5.3 | U-FREE PAT | 3rd Boost-less day, 13th PAT write | 402 `QUOTA_EXCEEDED` with `resets_at` (writes share daily quota); reads still 200 |
| T5.4 | PAT | `POST /api/v1/tokens` | `403 TOKEN_KIND_MISMATCH`; audit row written |
| T5.5 | Session | rotate PAT | new secret shown once; old secret `AUTH_INVALID` ≤ 60 s later; `token.rotated` audited |
| T5.6 | U-MAX AAT clamp 100/day | 101st AAT call | 402 with `aat_clamp` named; tier quota unchanged |
| T5.7 | Free user | `POST /api/jonts/{id}/run` on MAX-fit tool | 402 `TIER_LOCKED` + `upgrade_url`; no metering |
| T5.8 | Consent flow | grant → deny → policy bump → re-ask | state transitions audited; export pipeline sees denied; re-ask banner shows; no auto-flip |
| T5.9 | Any user | quota envelope | `base`/`boost`/`effective` reported; after 2 boost grants effective = 45 on Free |
| T5.10 | AI fallback on Free | fuzzy step requests AI | refused before provider contact (`ai_fallback_calls_per_month = 0`); deterministic path or clean error |

**DoD hooks (VOL-14):** "envelope + version hygiene proven" (G-05), "data-plane isolation (PAT vs session vs AAT) green" (G-13), "consent endpoints + audit green" (G-22), "brake modes flip without deploy" (G-14).
