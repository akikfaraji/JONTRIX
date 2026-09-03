# Volume 10 — MCP Server & jontrix-gateway

**Document:** JONTRIX Build Specification — VOL-10
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 (constraints), VOL-01 §4.2 (MCP quotas/AAT limits), VOL-04 (schema), VOL-05 (middleware, error taxonomy), VOL-06 (auth identity). Referenced by: VOL-12/13 (tool exposure flags), VOL-14 (DoD, CI).

---

## §1 Architecture and the Reason the Gateway Exists (LOCKED)

JONTRIX exposes its catalog to AI agents over **MCP (Model Context Protocol)**. The founder-mandated shape is fixed and appears here verbatim as the acceptance lens for this whole volume: the MCP API's front door is **`/api/mcp/login`**, which asks the AI agent or the user for a **Personal Access Token (PAT)** or an **Agent Access Token (AAT)**; the user installs a small piece of software named **`jontrix-gateway`** (from npm, pip, or standalone binaries), gives their login information to that gateway **once**, and from then on **the gateway does all the talking to MCP**. No MCP client ever handles a JONTRIX token directly, and no JONTRIX endpoint ever talks to a raw MCP client that has not come through a gateway or an explicit advanced-path opt-in (§1.3).

```
┌─────────────────────┐         stdio (JSON-RPC 2.0)        ┌──────────────────────┐        HTTPS          ┌─────────────────────────┐
│ MCP client           │ ◄──────────────────────────────────► │ jontrix-gateway       │ ◄────────────────────► │ mcp.jontrix.app Worker   │
│ Claude/Cursor/Cline  │      local process, spawned by       │ (npm / pip / binary)  │   Bearer PAT/AAT/     │ /api/mcp/*  +  /mcp      │
│ …any MCP host        │      the client's mcpServers config  │ keyring, cache,       │   session tokens      │ D1: tokens, devices,     │
└─────────────────────┘                                      │ pre-flight quota      │                       │ usage (VOL-04/§6)        │
                                                             └──────────────────────┘                       └─────────────────────────┘
```

The gateway is not an extra hop for its own sake; it carries six load-bearing jobs. **(1) Universal transport:** every MCP host speaks stdio reliably, while remote-HTTP auth support varies wildly across clients — one local bridge makes JONTRIX work everywhere the same way. **(2) Credential hygiene:** tokens live in the OS keyring (with a 0600-file fallback), so the user's `claude_desktop_config.json` contains only `jontrix-gateway mcp`, never a secret. **(3) Scoped blast radius:** an agent gets its own AAT; revoking a misbehaving agent touches nothing else. **(4) Quota pre-flight:** the gateway caches the entitlement snapshot (60 s TTL) and can refuse a call locally that would only burn a round-trip to be rejected. **(5) Version shielding:** the gateway absorbs transport and schema drift (retries, backoff, `Retry-After`, catalog ETags) so old client configs keep working across API revisions. **(6) Headless mode:** CI and cron agents authenticate via environment variable with zero interaction (§3.3).

### §1.1 Component Boundaries (LOCKED)

The **remote worker** (`apps/mcp`, `mcp.jontrix.app`) owns: token validation, scopes, entitlements, quotas, metering, tool dispatch into the platform core (VOL-05), and the `/api/mcp/*` contracts in §4. The **gateway** (`packages/gateway`) owns: login UX (§3), keyring storage, stdio MCP serving, caches, retries, client-config writing, and update checks. **MUST:** the gateway is untrusted by design — every authorization decision is re-made server-side on every call; the gateway's caches are conveniences, never authorities. **NEVER:** business logic (pricing, tier checks, transformations) in the gateway; telemetry of any kind out of the gateway (C8); a second implementation of tool logic anywhere — both ends derive tool metadata from the same `jonts` registry (VOL-04).

### §1.2 Protocol Version (LOCKED)

MCP protocol baseline: the version current at build time, pinned in `/.well-known/jontrix-mcp.json` (§4.9); the gateway advertises the same pinned version in its `initialize` response. Transport v1: stdio only (gateway) and Streamable HTTP (remote, advanced path §1.3). Opaque bearer tokens only — **NEVER** JWTs in v1 (revocation-before-expiry with JWTs requires infrastructure C1 forbids; opaque + D1 lookup is one primary-key read).

### §1.3 Advanced Path: Direct Remote MCP (AGENT CHOICE to expose)

Clients with native Streamable-HTTP + bearer support may connect straight to `https://mcp.jontrix.app/mcp` using a PAT/AAT; the same §4 contracts guard it. This path is optional to document publicly, costs nothing extra to maintain, and must never be presented as the primary flow — all onboarding copy funnels through `jontrix-gateway`.

## §2 Token Taxonomy (LOCKED)

Three token kinds, all opaque random 32-byte values, all stored server-side as SHA-256 hashes with prefix + last-4 display remnants. Format contract (the only "code" this taxonomy needs):

```
^jx_(pat|aat|sess)_[A-Za-z0-9]{32}$        # jx_pat_… human · jx_aat_… agent · jx_sess_… device-flow session
```

| Kind | Bearer | Owner | Created via | Default expiry | Can manage tokens? | Purpose |
|------|--------|-------|-------------|----------------|--------------------|---------|
| **PAT** — Personal Access Token | `Authorization: Bearer jx_pat_…` | a human user | `/api/mcp/login` page while signed in; or PWA settings page | never (revocable) | **yes** (create/revoke AATs, list, self-revoke) | the user's master credential for MCP; one per device/person is recommended |
| **AAT** — Agent Access Token | `Authorization: Bearer jx_aat_…` | one named agent (e.g. `cursor-main`) | by a PAT (API §4.4) or auto-created during login when `--agent NAME` is given | **90 days** (renewable on refresh) | **no** — hard scope boundary | per-agent credential with narrow scopes so revoking one agent is cheap and attribution in usage rows is exact |
| **session** (internal) | `Authorization: Bearer jx_sess_…` | one gateway installation | device flow (§3.1) | access 15 min / refresh 30 d rotating | no | short-lived pairwise credential the gateway uses so a long-lived PAT/AAT need not sit in the gateway's memory on shared machines |

Scope contract, binding for the server's scope engine and the gateway's UI:

```ts
interface TokenScopes {
  tools: 'all' | { allow?: string[]; deny?: string[] };  // tool ids like "jont_j001_pdf-table-extractor"
  max_calls_per_day?: number;   // AAT-level clamp; MUST be ≤ the owner tier's daily server limit
  expires_at?: string;          // AAT default: created_at + 90d
  cascade?: boolean;            // AATs created by this PAT die with it (default true)
}
```

**MUST:** an AAT can never create, list, or revoke tokens — the server rejects any token-management route when authenticated by an AAT regardless of scopes. **MUST:** every `/api/mcp/*` route accepts any of the three bearers (except the login/refresh routes, which accept what §4 specifies); resolution is a single hash lookup, then status check, then scope check, then quota — in that order, mapped to the error taxonomy in §4.10. **NEVER:** two tokens share a row, scopes widen on refresh, or a revoked token keeps working past 60 seconds (§8).

## §3 Login Flows (LOCKED)

Three flows cover every actor: a human with a browser (recommended), a human or agent pasting an existing token, and headless CI. All three end in the same state: the gateway holds a valid credential in the keyring under the active profile and `jontrix-gateway whoami` prints identity, tier, and remaining MCP quota.

### §3.1 Human + Browser — the Device Flow (primary)

Behavioral sequence, binding in order: **(1)** `jontrix-gateway login [--agent NAME]` calls `POST /api/mcp/login/device` and receives a `device_code`, a human-friendly `user_code` (format `JX-XXXX-XXXX`, ambiguous characters excluded), the `verify_url`, a poll `interval` (5 s) and `expires_in` (900 s). **(2)** The CLI prints the code and URL and opens the default browser unless `--no-browser` / `JONTRIX_NO_BROWSER` is set. **(3)** The browser lands on **`GET /api/mcp/login`** — the founder-specified front door. The page, in this order: asks the visitor to **sign in** (Telegram Login or email OTP, VOL-06) *or* to **paste an existing PAT or AAT**; then shows what the requesting device is asking for (device fingerprint, IP suffix, requested agent name); then offers to **create a fresh PAT** (default name from hostname) or **create an AAT** named `--agent` (when the CLI passed an agent name) or to approve with the pasted token. **(4)** Approval is `POST /api/mcp/login` with the `user_code` plus either the signed-in session cookie or the pasted PAT/AAT bearer — one click ("Approve") after credentials are on the page. **(5)** The CLI polls `POST /api/mcp/login/device/poll` at `interval`, honoring `slow_down` (server bumps interval +5 s); the poll returns `authorization_pending`, `slow_down`, `denied`, or on success `{access_token, refresh_token, token_type: "Bearer", expires_in, scope}`. **(6)** The gateway stores the pair in the keyring (profile-scoped), prints `whoami` + quota one-liner, and, if a supported MCP host is detected or `--connect` was passed, offers to write the client config (§9).

**MUST:** the pasted-token path on the login page works with **either** kind — the page copy literally says "paste your Personal Access Token (PAT) or Agent Access Token (AAT)" per founder directive; the page must also carry a "what is this?" one-paragraph explanation for users who arrived via a terminal prompt. **NEVER:** the device flow requires an account for approval-by-pasted-AAT (an agent operator may approve a device with only an AAT); the poll endpoint reveals whether a code was approved to anyone holding only the `user_code` — success payloads require the `device_code`.

### §3.2 Paste-the-Token Flow (no browser)

`jontrix-gateway login --token` (or piped input: `jontrix-gateway login --token-stdin`) accepts a PAT or AAT, validates it against `GET /api/mcp/quota` before storing, and refuses to persist an invalid or revoked token with exit code 2 and a one-line reason. This is the flow an AI agent performs on behalf of a user who relays the token in chat, and the flow CI uses with secrets (though CI prefers §3.3). The gateway stores the PAT/AAT directly (no session pair) and sends it as the bearer on every call; nothing else changes downstream.

### §3.3 Headless / CI Flow

`JONTRIX_TOKEN=jx_aat_… jontrix-gateway mcp --non-interactive` serves stdio MCP with zero prompts: no keyring write (env token used in-memory), no browser, no update check. **MUST:** `--non-interactive` makes every command fail fast (exit 2) instead of prompting, so CI never hangs. **NEVER:** the gateway logs or echoes the env token, in any log level.

## §4 HTTP API Contracts (LOCKED)

All routes live on `mcp.jontrix.app`, JSON bodies, UTF-8, errors per VOL-05 taxonomy (§4.10 maps them). Auth is `Authorization: Bearer <token>` where noted. All contracts below are binding; request/response examples are illustrative shapes, not implementations.

### §4.1 Route Table

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/mcp/login` | none (or session cookie if signed in) | HTML front door: asks for PAT/AAT paste **or** sign-in, then device approval |
| `POST /api/mcp/login` | session cookie **or** PAT/AAT bearer | approve a pending device (`user_code`); create-and-attach a new PAT/AAT when asked |
| `POST /api/mcp/login/device` | none | issue `device_code` + `user_code` (rate-limited per IP) |
| `POST /api/mcp/login/device/poll` | none (`device_code` in body) | CLI poll: pending / slow_down / denied / token pair |
| `POST /api/mcp/refresh` | refresh bearer (`jx_sess_…`) | rotate session; single-use refresh, theft detection (§8) |
| `GET /api/mcp/tools` | PAT/AAT/session | tool catalog filtered to scopes + tier; ETag-cached |
| `POST /api/mcp/call` | PAT/AAT/session | execute one tool; metered (§7) |
| `GET /api/mcp/quota` | PAT/AAT/session | entitlement + counter snapshot for pre-flight |
| `GET /api/mcp/tokens` | **PAT only** | list the user's tokens (metadata only, never secrets) |
| `POST /api/mcp/tokens` | **PAT only** (or signed-in session on the web) | create PAT or AAT; secret returned exactly once |
| `DELETE /api/mcp/tokens/{id}` | **PAT only** | revoke (self-revoke allowed; `cascade` per §2) |
| `GET /.well-known/jontrix-mcp.json` | none | discovery manifest (§4.9) |

### §4.2 Device Issue — `POST /api/mcp/login/device`

Request `{}` (empty body; the CLI may include `{"agent_name": "cursor-main"}` and `{"client_hint": "claude-desktop/1.2"}` for display only). Response `201`:

```json
{ "device_code": "dvc_43-char-url-safe", "user_code": "JX-7K2M-9QPD",
  "verify_url": "https://mcp.jontrix.app/api/mcp/login",
  "interval": 5, "expires_in": 900 }
```

**MUST:** `device_code` is single-use and server-stored hashed; `user_code` draws from a 31-character unambiguous set; 20 issue-requests/minute/IP cap; codes expire at `expires_in` exactly.

### §4.3 Device Poll — `POST /api/mcp/login/device/poll`

Request `{"device_code": "…"}`. Responses: `200 {"status":"pending"}` · `200 {"status":"slow_down","interval":10}` · `403 {"error":"denied"}` (user clicked deny) · `410 {"error":"expired"}` · `200` with the session pair on success: `{"access_token":"jx_sess_…","refresh_token":"jx_sess_…","token_type":"Bearer","expires_in":900,"scope":"…"}`. **MUST:** success burns the `device_code` (second poll → `410`); the pair is returned once, never re-readable.

### §4.4 Token Create — `POST /api/mcp/tokens`

Request (PAT bearer or signed-in web session): `{"kind":"aat","name":"cursor-main","scopes":{"tools":{"allow":["jont_j001_pdf-table-extractor","jont_dv_b1_json-rescue"]},"max_calls_per_day":200}}` or `{"kind":"pat","name":"work-laptop"}`. Response `201`: `{"id":"tok_…","kind":"aat","name":"cursor-main","token":"jx_aat_…","token_last4":"9f2c","scopes":{…},"expires_at":"…","created_at":"…"}`. **MUST:** `token` appears exactly once, here, and never again from any endpoint (list endpoints return prefix/last4/name/status only). **MUST:** AAT creation validates `max_calls_per_day` against the owner's tier (VOL-01 §4.1) and rejects over-clamps with 422. **MUST:** AAT count enforcement uses the tier's `mcp_aats_max` (VOL-01 §4.2) — at the limit, 422 with a tier-name-bearing message.

### §4.5 Tool Catalog — `GET /api/mcp/tools`

Response `200`: `{"protocol_version":"…","tools":[ToolSpec…]}` where `ToolSpec = {"name":"jont_j001_pdf-table-extractor","title":"PDF Table Extractor","description":"<the Jont's evidence-cited one-liner>","inputSchema":{…JSON Schema from jont.manifest…},"tier_fit":"PRO","mcp_exposed":true}`. **MUST:** the list is the intersection of (`mcp_exposed = true` in the `jonts` registry) ∧ (caller's tier unlocks per VOL-01 §4.2 mapping) ∧ (caller's AAT `tools` scope, if scoped); a scoped-out tool is *omitted*, not listed-and-refused. **MUST:** ETag = hash of the filtered list; `304` on match; `Cache-Control: private, max-age=300`.

### §4.6 Tool Call — `POST /api/mcp/call`

Request: `{"tool":"jont_j001_pdf-table-extractor","arguments":{…manifest-validated…},"idempotency_key":"opt-uuid-≤128"}`. Success `200`: `{"result":{…pattern-shaped output per VOL-11…},"usage":{"call_id":"…","ms":812,"quota_remaining":{"daily":493,"monthly":1941}}}`. Failure: the §4.10 mapping. **MUST:** pipeline order is auth → token status → scope → tier check → monthly MCP quota → burst window → argument validation against `inputSchema` → dispatch (VOL-05) → meter (§7); a failure at any stage never executes the tool. **MUST:** `idempotency_key` replay within 24 h returns the original response with `{"replayed": true}` and does not re-execute or re-meter.

### §4.7 Quota Snapshot — `GET /api/mcp/quota`

Response `200`: `{"tier":"pro","mcp":{"calls_made_month":412,"calls_limit_month":2000,"resets_at":"2026-10-01T00:00:00Z"},"server":{"calls_made_today":37,"calls_limit_today":500,"resets_at":"2026-09-04T00:00:00Z"},"aat_clamp":null}`. This is the pre-flight truth the gateway caches for ≤60 s.

### §4.8 Refresh — `POST /api/mcp/refresh`

Bearer = the refresh token. Response `200` with a **new pair**. **MUST:** single-use rotation — presenting a refresh token that was already rotated revokes the whole session family (theft signal), returning `401 {"error":"session_revoked"}`. **NEVER:** access-token lifetimes extend by refreshing; scopes never widen.

### §4.9 Discovery — `GET /.well-known/jontrix-mcp.json`

`{"jontrix_mcp":{"version":1,"protocol_version":"<pinned MCP>","endpoints":{"login":"…/api/mcp/login","tools":"…","call":"…","quota":"…","refresh":"…","remote_mcp":"https://mcp.jontrix.app/mcp"},"gateway":{"npm":"jontrix-gateway","pypi":"jontrix-gateway","binaries":"https://github.com/fraziym/jontrix/releases"},"auth":{"kinds":["pat","aat"],"bearer_scheme":"Authorization: Bearer"}}}` — the gateway reads this once per day to learn about endpoint moves; VOL-14's DoD checks it renders.

### §4.10 Error Mapping (LOCKED)

| Condition | HTTP | `error` code (VOL-05 taxonomy) | Notes |
|---|---|---|---|
| missing/malformed bearer | 401 | `AUTH_REQUIRED` | gateway prompts re-login |
| unknown/revoked/expired token | 401 | `AUTH_INVALID` | gateway clears keyring entry for that profile |
| token valid, tool denied by AAT scope | 403 | `FORBIDDEN_TOOL` | names the AAT, never the owner |
| tier does not unlock tool | 402 | `TIER_LOCKED` + `upgrade_url` | VOL-01 §4.2 mapping |
| monthly MCP quota exhausted | 402 | `QUOTA_EXCEEDED` + `upgrade_url` + `resets_at` | pre-flight usually catches this first (§7) |
| burst window tripped | 429 | `RATE_LIMITED` + `Retry-After` | 10 calls / 10 s per bearer |
| unknown tool name | 404 | `UNKNOWN_TOOL` | |
| arguments fail `inputSchema` | 422 | `ARGUMENTS_INVALID` + field paths | |
| upstream/tool execution failure | 500/503 | `TOOL_FAILED` / `TOOL_UNAVAILABLE` | retried per gateway policy (§5.6) |

## §5 The `jontrix-gateway` Package Contract (LOCKED)

### §5.1 Distribution (LOCKED)

Three first-class channels, all $0 to publish (C1): **npm** package `jontrix-gateway` (Node ≥ 18; the canonical, TypeScript implementation in `packages/gateway`); **PyPI** package `jontrix-gateway` (Python ≥ 3.9; native implementation of the same CLI surface); **standalone binaries** (`jontrix-gateway-{os}-{arch}`, darwin/linux/win × x64/arm64) attached to GitHub Releases for users with neither runtime. Parity is contractual, not aspirational: verbs marked **P0** below MUST behave identically in npm, PyPI, and binaries and are enforced by a shared conformance test-suite (input/expectation tables from this volume, run in CI against all three builds — VOL-14 §3). The npm package additionally exposes `jontrix-gateway mcp` as an MCP-server command so hosts can spawn it directly.

### §5.2 CLI Verb Table (LOCKED)

| Verb | Parity | Behavior contract |
|------|--------|-------------------|
| `login [--agent NAME] [--token\|--token-stdin] [--no-browser] [--connect CLIENT]` | P0 | flows of §3; on success prints identity + tier + MCP quota remaining |
| `logout [--profile P]` | P0 | revokes the stored session via the API when possible, deletes keyring entries, leaves client configs untouched |
| `status` / `whoami [--json]` | P0 | profile, endpoint, identity, tier, quota remaining, token kind + last4, cache state |
| `mcp [--profile P] [--non-interactive]` | P0 | run the stdio MCP server (§5.5) — the command MCP hosts spawn |
| `tools [list\|call NAME --args JSON]` | P0 | human/agent smoke-testing of the catalog without a host; `call` runs the same §4.6 path |
| `quota [--watch]` | P0 | prints §4.7 snapshot; `--watch` re-renders every 60 s until Ctrl-C |
| `tokens list\|create\|revoke` | P0 | thin, safe wrappers over §4.4/§4.8; **PAT required** — an AAT gets a one-line "AATs cannot manage tokens" refusal |
| `connect <client>` | P0 | writes the MCP config entry for §9's supported hosts, backing up the file first, refusing to clobber non-JONTRIX entries |
| `update` | P1 | checks latest published versions on all channels, prints the exact install command; **NEVER** self-installs |
| `doctor` | P1 | keyring availability, network reach, config validity, version skew vs `/.well-known` — one line each |

Global flags: `--profile NAME` (default `default`), `--endpoint URL` (default from `/.well-known`), `--json` (machine output on P0 verbs), `--no-browser`, `--non-interactive`. Exit codes are contractual for CI: `0` success · `2` auth required / invalid token · `3` network unreachable · `4` quota exhausted · `5` usage error (bad flags, unknown tool) · `6` internal error (bug — includes a trace id, never payload contents).

### §5.3 Configuration and Secrets (LOCKED)

Config root: `$JONTRIX_CONFIG_DIR` or `~/.jontrix/`. Human-editable `config.toml` holds profiles; secrets NEVER live there.

```toml
[profile.default]
endpoint = "https://mcp.jontrix.app"   # read-only after login; overwritten only by re-login
agent_name = "cursor-main"             # display + AAT naming hint
```

Secret storage order: OS keyring first (macOS Keychain / Windows Credential Manager / libsecret), fallback `~/.jontrix/secrets.json` with `0600` permissions **plus** a permanent one-line warning printed on `status` until the keyring works. Environment overrides: `JONTRIX_TOKEN` (§3.3), `JONTRIX_PROFILE`, `JONTRIX_ENDPOINT`, `JONTRIX_NO_BROWSER=1`, `JONTRIX_LOG_LEVEL=error|warn|info` (default `warn`). **MUST:** keyring entries are namespaced `jontrix/<profile>/<kind>`; logout and token-rotation remove exactly their own entries. **NEVER:** the config or logs contain a full token; `whoami` prints last4 only.

### §5.4 Caches (LOCKED)

Three caches, all in-memory + keyring-adjacent on disk (`~/.jontrix/cache/<profile>/`), all TTL-bounded: **catalog** (TTL 1 h + ETag revalidation, backs `tools/list` offline), **quota snapshot** (TTL 60 s, backs pre-flight), **protocol manifest** (TTL 24 h). **MUST:** every served cache item carries `stale: true` when past TTL and the gateway tells the host honestly in `tools/list` metadata. **NEVER:** request/response payloads cached beyond the life of one call — no user content ever touches disk (privacy wedge, C6/C8).

### §5.5 stdio MCP Server Contract (LOCKED)

`jontrix-gateway mcp` speaks JSON-RPC 2.0 over stdio per the MCP spec. Supported methods: `initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`. Everything else (`resources/*`, `prompts/*`, sampling) answers the spec's method-not-found error — v1 is a **tools-only** server. `tools/list` serves the cached catalog (§5.4) filtered by the stored token's scopes; `tools/call` runs the §4.6 pipeline with pre-flight (§7) and maps server errors into MCP error responses carrying the VOL-05 codes from §4.10 verbatim. **MUST:** the process starts in < 300 ms cold (hosts time out slow servers); a crashed gateway exits non-zero without poisoning stdin. **NEVER:** the stdio server prompts, writes to stdout anything that is not a JSON-RPC frame, or blocks on network at startup (lazy auth: first call may return `AUTH_REQUIRED` while `initialize` still succeeds).

### §5.6 Network Policy (LOCKED)

Retries: only on `429` (honor `Retry-After` exactly) and idempotent `GET`s on network errors — max 2 retries, exponential backoff 1 s → 4 s, then surface the error upstream. Timeouts: 60 s per `tools/call`, 10 s for everything else. TLS certificate errors are fatal, never bypassable. Base URL comes from `--endpoint`/profile; the gateway pins the URL it logged in against and refuses silent redirects to different origins. **NEVER:** proxy environment variables are honored for egress but the gateway never terminates TLS through a user-installed CA without `--insecure-ok-if-you-say-so` (a flag that prints a full-screen warning; ships because corporate MITM proxies exist, default off).

### §5.7 Telemetry and Updates (LOCKED)

Zero telemetry: no analytics, no crash reporting, no phone-home beyond the API calls the user's own actions cause (C8). Update check: once per 24 h, against the three published channels; result is one printed line on `status`/`login` — "update available: run npm i -g jontrix-gateway" — and nothing else. Auto-update is forbidden.

## §6 Data Model (LOCKED)

Four D1 tables join VOL-04's schema; all single-row PK lookups (C1/D1 budget, VOL-01 §6). Column lists are contracts — types per VOL-04 conventions.

**`mcp_tokens`** — `id TEXT PK` · `user_id TEXT NOT NULL` · `kind TEXT CHECK(kind IN ('pat','aat'))` · `name TEXT` · `hash_sha256 TEXT UNIQUE NOT NULL` · `prefix TEXT NOT NULL` · `last4 TEXT NOT NULL` · `scopes_json TEXT NOT NULL DEFAULT '{}'` · `status TEXT CHECK(status IN ('active','revoked')) NOT NULL DEFAULT 'active'` · `created_by_token_id TEXT` · `expires_at INTEGER` · `last_used_at INTEGER` · `created_at INTEGER NOT NULL` · `revoked_at INTEGER`. Index: `(user_id, kind, status)`.

**`mcp_device_codes`** — `device_hash TEXT PK` · `user_code TEXT UNIQUE NOT NULL` · `status TEXT CHECK(status IN ('pending','approved','denied','consumed','expired')) NOT NULL` · `agent_name TEXT` · `client_hint TEXT` · `issued_ip TEXT` · `token_id TEXT` · `issued_at INTEGER NOT NULL` · `expires_at INTEGER NOT NULL` · `poll_count INTEGER DEFAULT 0`. Cleanup cron: purge rows older than 24 h (KV-free, one D1 delete per hour — budget-safe).

**`mcp_usage_daily`** — `(token_id TEXT, day TEXT) PK` · `calls INTEGER DEFAULT 0` · `ms_total INTEGER DEFAULT 0` · `bytes_in INTEGER DEFAULT 0` · `bytes_out INTEGER DEFAULT 0` · `error_4xx INTEGER DEFAULT 0` · `error_5xx INTEGER DEFAULT 0`. This table is the MCP-side rollup; the per-call ledger remains `jont_usage` (VOL-04) with `source='mcp'` and `token_id` — two writes per call total, inside the D1 daily write budget at S2 (VOL-01 §6).

**`mcp_idempotency`** — `(token_id TEXT, idem_key TEXT) PK` · `call_id TEXT NOT NULL` · `status INTEGER NOT NULL` · `response_ref TEXT` (R2 key for large bodies; inline JSON ≤ 4 KB) · `created_at INTEGER NOT NULL`. TTL: 24 h, purged by the same hourly cron. **MUST:** a replay hit returns the stored status/body without dispatch; a replay *during* in-flight execution returns 409 `CONFLICT_IDEMPOTENCY`.

## §7 Metering and Quota Pre-Flight (LOCKED)

Server side (authoritative): every `POST /api/mcp/call` increments the monthly MCP counter and the `mcp_usage_daily` rollup in the same transaction as the dispatch decision, so a crashed Worker cannot lose a billable unit; the call ledger row lands in `jont_usage` with `source='mcp'`, `token_id`, `tool`, `ms`, and bytes — attribution to the exact AAT is the point of the taxonomy (§2). Tier caps come from VOL-01 §4.1 (`mcp_calls_per_month`), AAT clamps from `max_calls_per_day` when present; the *smaller* of the two governs, and the response `quota_remaining` block reports both so agents can self-throttle.

Gateway side (advisory pre-flight): before sending a `tools/call`, the gateway consults its ≤60 s quota cache; if `remaining = 0` it fails the call **locally** with a `QUOTA_EXCEEDED` MCP error carrying `resets_at` and the upgrade URL — no round-trip, per §1 job (4). Pre-flight never *permits* anything the server would refuse; it only short-circuits known-rejected calls. **MUST:** a cache older than TTL is treated as unknown and the call proceeds to the server. **NEVER:** the gateway rounds quotas in the user's favor dishonestly (no "one more call" grace invented client-side).

## §8 Security Invariants (LOCKED)

Each line is a MUST or NEVER the DoD sweep (VOL-14) tests individually:

1. Secrets are shown once at creation (§4.4) and stored only as SHA-256 hashes server-side; lookups compare in constant time.
2. Revocation takes effect in ≤ 60 s everywhere: token status flips in D1, the gateway's next call receives `AUTH_INVALID`, and any cached quota for the dead token is dropped.
3. `user_code` approval requires possession of the `device_code`-approved page state; guessing a `user_code` grants nothing (it only lets a phisher *display* a pending device — the login page must state this and show the requesting device's fingerprint + IP suffix prominently).
4. Poll endpoint: ≤ 20 requests/minute/IP, `slow_down` enforced, `device_code` burned on first success.
5. Refresh tokens are single-use; reuse of a rotated refresh revokes the session family (theft signal) and requires re-login.
6. AATs can never manage tokens, never see their owner's identity beyond the agent name, and never widen scopes on refresh or renewal; renewal re-reads scopes from the parent PAT's current state (a narrowed PAT narrows its children).
7. CORS on `/api/mcp/*` allows only the app origin for browser flows; the API routes themselves are same-origin/CLI-only (no cookies on `/api/mcp/call` — bearer only).
8. No request/response payload bodies are logged anywhere (Worker logs carry ids, codes, timings; gateway logs the same); log level `debug` on the gateway still redacts token values to last4.
9. All storage of user content stays in the call pipeline's memory; nothing user-generated persists to gateway disk (§5.4) or beyond the `jont_usage` metadata row.
10. Brute-force resistance: token space is 62³² (≈ 10⁵⁷); rate limits per IP on all unauthenticated routes; account-level lockout is unnecessary at these entropies but `AUTH_INVALID` responses are uniformly delayed by 100 ms to blunt timing oracles.

## §9 Client Onboarding — `connect` and the Config Writers (LOCKED)

`jontrix-gateway connect <client>` writes the host's MCP config entry pointing at the gateway binary — never at JONTRIX endpoints, never embedding tokens. Supported hosts at v1: `claude-desktop`, `cursor`, `vscode`, `cline`, `windsurf`, `gemini-cli`. The writer MUST back up the target file (`*.jontrix-backup`), merge (never clobber) existing `mcpServers` entries, and refuse to edit files it cannot parse. The canonical entry shape all writers produce:

```json
"jontrix": { "command": "jontrix-gateway", "args": ["mcp", "--profile", "default"] }
```

Onboarding copy contract (PWA settings → "Connect your agent", and the bot's `/mcp` command): three steps, three sentences — install (`npm i -g jontrix-gateway` or `pip install jontrix-gateway` or binaries), `jontrix-gateway login` (opens `/api/mcp/login`, which asks for your PAT/AAT or sign-in), `jontrix-gateway connect claude-desktop` (or any host). No step may reference the advanced remote path (§1.3) — that page exists for framework authors and is linked once, in small print, from the docs footer only.

## §10 Acceptance Tests & DoD Hooks (LOCKED)

Fixtures: user U-PRO (tier `pro`), agents A1 (AAT, `tools: all`), A2 (AAT, deny-listed tool), expired device code D-EXP, revoked token R. All rows run in CI against all three gateway builds (§5.1 parity).

| # | Given | When | Then |
|---|-------|------|------|
| T10.1 | U-PRO, browser | full §3.1 device flow | session pair stored in keyring; `whoami` shows tier, quota, last4; zero tokens in config files |
| T10.2 | Signed-out browser on `/api/mcp/login` | paste valid PAT + approve device | device approved; gateway session issued; page never required sign-in |
| T10.3 | Same page | paste valid **AAT** + approve | approved per founder rule §3.1; AAT cannot create further tokens afterward |
| T10.4 | D-EXP | CLI polls after expiry | `410 expired`; gateway prompts one-line re-login, exit code 2 |
| T10.5 | A2 in a host | `tools/call` on deny-listed tool | MCP error `FORBIDDEN_TOOL`; identical call via A1 succeeds |
| T10.6 | U-PRO at 2000/2000 monthly MCP calls | `tools/call` | gateway refuses locally (§7) with `resets_at`; forced direct API call returns 402 `QUOTA_EXCEEDED` |
| T10.7 | Any active session | refresh, then replay old refresh | first refresh 200; replay → 401 `session_revoked`; family dead; re-login required |
| T10.8 | CI env `JONTRIX_TOKEN=AAT` | `mcp --non-interactive` | serves stdio; `tools/call` succeeds; keyring untouched; token absent from all logs |
| T10.9 | Offline gateway, warm catalog | `tools/list` | served from cache with `stale: true`; `tools/call` errors `3` cleanly |
| T10.10 | `connect claude-desktop` on a host | launch host, chat "list JONTRIX tools" | handshake < 300 ms spawn; catalog visible; one call metered in `jont_usage` + `mcp_usage_daily` same UTC day |
| T10.11 | R (revoked AAT) | next gateway call | `AUTH_INVALID`; gateway deletes keyring entry, prints re-login instruction; repeat calls do not loop (single failure, then prompt) |
| T10.12 | PAT with `cascade: true`, 3 AATs | `DELETE /api/mcp/tokens/{pat_id}` | PAT + all 3 AATs revoked ≤ 60 s; devices approved by them keep serving until their next call fails auth (no silent success) |
| T10.13 | Three builds (npm/pypi/binary) | shared conformance suite | all P0 verbs byte-identical outputs (`--json` mode); exit codes per §5.2 |
| T10.14 | `POST /api/mcp/call` twice, same `idempotency_key` | within 24 h | second response `replayed: true`, original body, no new metering row |

**DoD hooks (VOL-14):** Phase-8 exit (VOL-00 §0.3) = T10.1 + T10.5 + T10.10 green on the npm build with a reference MCP client. Global DoD additions: "gateway published to npm + PyPI with binaries attached" (check G-31), "zero-telemetry audit of gateway passed" (G-32, grep-based), "T10.6 quota honesty verified on all tiers" (G-33).
