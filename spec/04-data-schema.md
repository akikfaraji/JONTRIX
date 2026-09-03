# Volume 4 — Data Schema (D1, KV, R2)

**Document:** JONTRIX Build Specification — VOL-04
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 (constraints), VOL-01 §4 (limits), VOL-10 §6 (MCP tables). Referenced by: VOL-05, VOL-06, VOL-07/08/09, VOL-11, VOL-14, VOL-15.

---

## §1 Conventions (LOCKED)

One **D1 database** serves both workers (`api.jontrix.app` and `mcp.jontrix.app` bind the same database). Rules that every table obeys:

1. **Types:** identifiers are `TEXT` (prefixed: `usr_`, `tok_`, `pay_`, `use_`, `prs_`, `res_`, `evt_`); timestamps are `INTEGER` Unix-epoch seconds, always UTC; all user-visible times are rendered UTC with the reset rules of VOL-01 §4.3. Money is stored as integer **cents** (`price_usd_cents`) or integer **Stars** — never floats.
2. **Write budget discipline (C1):** every table exists because a row-read or row-write is *necessary*; there is no event-sourcing, no ORM magic, no redundant denormalization beyond the counters VOL-01 §6 needs. The D1 free caps (100k writes/day) are a design input, not an afterthought.
3. **Deletes are rare:** history/results expiry runs as a daily cron that deletes only rows past the tier retention horizon; consent-withdrawal purges are the only other bulk delete (§5). Every bulk delete logs a count to the audit log.
4. **No secrets in D1:** tokens are SHA-256 hashes (VOL-10 §2); OAuth states and OTP codes are hashed too; the only plaintext is display remnants (`prefix`, `last4`).
5. **Migrations are append-only files** in `apps/api/migrations/`, numbered `0001_init.sql` upward, applied by `wrangler d1 migrations apply`; a migration never edits a prior file. `npm run db:verify` (VOL-00 Phase 1) asserts tables, indexes, and seed rows exist.

## §2 Table Map

| Table | Purpose | Primary writer |
|-------|---------|----------------|
| `users` | account root + consent + settings | VOL-06 auth |
| `auth_identities` | Telegram / email identity links | VOL-06 auth |
| `sessions` | browser sessions (PWA/dashboard/Mini App) | VOL-06 auth |
| `tokens` | unified token registry: PAT / AAT / gateway sess (VOL-10 §6) | VOL-05 §6 (dashboard factory) |
| `plans` | seeded tier ladder (VOL-01 §4.1) | Phase-1 seed only |
| `entitlements` | live tier + window + counters | VOL-05 middleware, VOL-06 |
| `webhook_events` | provider webhook idempotency | VOL-06 |
| `payments` | one row per successful charge (both rails) | VOL-06 |
| `invoices` | USDT NOWPayments invoices | VOL-06 |
| `jonts` | catalog registry (seeded from VOL-13) | Phase-1 seed only |
| `jont_usage` | per-call ledger (all surfaces) | VOL-05 middleware |
| `presets` | saved tool inputs | VOL-05 §4 |
| `results` | saved result metadata (bodies in R2) | VOL-05 §4 |
| `mcp_device_codes`, `mcp_usage_daily`, `mcp_idempotency` | VOL-10 §6 verbatim | MCP worker |
| `boost_ledger` | rewarded-ad quota grants (D-02) | VOL-08 §5 |
| `consent_events` | AI-training consent audit (D-05) | VOL-05 §8 |
| `audit_log` | security/compliance events | VOL-05 §7 |

## §3 Identity and Access

**`users`** — `id TEXT PK` · `handle TEXT UNIQUE NOT NULL` · `display_name TEXT` · `email TEXT UNIQUE` (nullable; email-OTP path) · `telegram_user_id TEXT UNIQUE` (nullable) · `locale TEXT DEFAULT 'en'` · `country_hint TEXT` (from Telegram/email, display only) · `ai_training_consent TEXT CHECK(ai_training_consent IN ('granted','denied')) NOT NULL DEFAULT 'denied'` (D-05) · `consent_version INTEGER NOT NULL DEFAULT 0` · `consent_asked_at INTEGER` · `settings_json TEXT NOT NULL DEFAULT '{}'` (non-security prefs: theme, default export format) · `status TEXT CHECK(status IN ('active','suspended','deleted')) NOT NULL DEFAULT 'active'` · `created_at INTEGER NOT NULL` · `last_seen_at INTEGER`. **MUST:** account deletion (dashboard, session-only) nulls email/telegram, strips `settings_json`, and enqueues the purge of §5 data; the row is kept as a tombstone so usage aggregates stay honest.

**`auth_identities`** — `id TEXT PK` · `user_id TEXT NOT NULL` · `provider TEXT CHECK(provider IN ('telegram','email')) NOT NULL` · `provider_uid TEXT NOT NULL` (telegram id or normalized email) · `meta_json TEXT` · `created_at INTEGER NOT NULL`. Index: `(provider, provider_uid) UNIQUE`.

**`sessions`** — `id TEXT PK` · `user_id TEXT NOT NULL` · `kind TEXT CHECK(kind IN ('pwa','miniapp','dashboard')) NOT NULL` · `hash_sha256 TEXT UNIQUE NOT NULL` · `created_ip TEXT` · `user_agent TEXT` · `refresh_family TEXT NOT NULL` · `expires_at INTEGER NOT NULL` · `created_at INTEGER NOT NULL` · `revoked_at INTEGER`. Cookie contract (VOL-06 §2): `jx_sess` HttpOnly, Secure, SameSite=Lax; access 15 min inside a signed payload bound to this row, refresh 30 d single-use rotation with family revocation on replay (VOL-10 §4.8 semantics apply verbatim).

**`tokens`** — as specified in VOL-10 §6 (single registry, kinds `pat|aat|sess`, PAT unique per user enforced by a partial unique index on `(user_id) WHERE kind='pat' AND status='active'`). **MUST:** creating a second active PAT is impossible at the schema level; rotation marks the old row `rotated` and inserts the new row in one transaction.

## §4 Billing, Catalog, Usage

**`plans`** — `tier TEXT PK` · `price_usd_cents INTEGER NOT NULL` · `price_usd_annual_cents INTEGER` · `price_stars INTEGER` · `limits_json TEXT NOT NULL` (the `Limits` contract of VOL-01 §4.1, verbatim) · `active INTEGER NOT NULL DEFAULT 1`. Seeded once; VOL-01 §5.6 honesty rules govern changes.

**`entitlements`** — `user_id TEXT PK` · `tier TEXT NOT NULL DEFAULT 'free'` · `source TEXT CHECK(source IN ('stars','usdt','grant'))` · `window_starts INTEGER` · `window_expires INTEGER` · `counters_json TEXT NOT NULL DEFAULT '{}'` (keys: `srv_YYYYMMDD`, `mcp_YYYYMM`, `ai_YYYYMM`, `boost_YYYYMMDD`) · `version INTEGER NOT NULL DEFAULT 1` · `updated_at INTEGER NOT NULL`. **MUST:** counter keys carry their window in the key itself so UTC reset is a new key, never a mutation scan (VOL-01 §4.3); the check-and-increment middleware is the only writer of `counters_json`.

**`webhook_events`** — `id TEXT PK` (provider event id) · `provider TEXT CHECK(provider IN ('nowpayments','telegram','adsgram','paddle')) NOT NULL` · `payload_hash TEXT NOT NULL` · `status TEXT CHECK(status IN ('received','processed','ignored','failed')) NOT NULL` · `error TEXT` · `received_at INTEGER NOT NULL`. Unique on `(provider, id)` — **this is the idempotency gate**: a replayed webhook hits the unique index and is acknowledged without reprocessing (VOL-06 §4).

**`payments`** — `id TEXT PK` · `user_id TEXT NOT NULL` · `rail TEXT CHECK(rail IN ('stars','usdt')) NOT NULL` · `plan_tier TEXT NOT NULL` · `billing_period TEXT CHECK(billing_period IN ('monthly','annual')) NOT NULL` · `amount INTEGER NOT NULL` (Stars or cents) · `currency TEXT NOT NULL` · `processor_fee_est_cents INTEGER` · `net_est_cents INTEGER` (for VOL-15) · `window_expires INTEGER NOT NULL` · `webhook_event_id TEXT` · `created_at INTEGER NOT NULL`.

**`invoices`** (USDT rail) — `id TEXT PK` · `user_id TEXT NOT NULL` · `plan_tier TEXT NOT NULL` · `billing_period TEXT NOT NULL` · `np_invoice_id TEXT UNIQUE` · `amount_usd_cents INTEGER NOT NULL` · `pay_address TEXT` · `network TEXT` · `status TEXT CHECK(status IN ('pending','confirmed','expired','failed')) NOT NULL DEFAULT 'pending'` · `expires_at INTEGER` · `created_at INTEGER NOT NULL`.

**`jonts`** — `id TEXT PK` (e.g. `jont_j001_pdf-table-extractor`) · `family TEXT NOT NULL` (VOL-13 family id) · `title TEXT NOT NULL` · `score REAL NOT NULL` (from `research/opportunities.json`) · `tier_fit TEXT CHECK(tier_fit IN ('FREE','PRO','MAX')) NOT NULL` · `platform_role TEXT` · `context TEXT CHECK(context IN ('client','server','hybrid')) NOT NULL` · `manifest_json TEXT NOT NULL` (VOL-11 §2) · `mcp_exposed INTEGER NOT NULL DEFAULT 1` · `seo_slug TEXT UNIQUE NOT NULL` · `status TEXT CHECK(status IN ('planned','built','disabled')) NOT NULL DEFAULT 'planned'` · `version TEXT NOT NULL DEFAULT 'V00.00.000-beta-01'` (copied from `src/version.ts` at build — never a second source, VOL-00 §0.7). Index: `(family, score DESC)`.

**`jont_usage`** — `id TEXT PK` · `user_id TEXT NOT NULL` · `tool_id TEXT NOT NULL` · `source TEXT CHECK(source IN ('pwa','miniapp','extension','mcp','api_v1')) NOT NULL` · `token_id TEXT` (AAT when `source='mcp'`) · `ms INTEGER` · `bytes_in INTEGER DEFAULT 0` · `bytes_out INTEGER DEFAULT 0` · `status TEXT CHECK(status IN ('ok','client_error','server_error')) NOT NULL` · `created_at INTEGER NOT NULL`. Index: `(user_id, created_at)`. This is the meter of record for VOL-15; one insert per server-side call, client-side runs do not write it (they never hit the server — C6).

**`presets`** — `id TEXT PK` · `user_id TEXT NOT NULL` · `tool_id TEXT NOT NULL` · `name TEXT NOT NULL` · `payload_json TEXT NOT NULL` · `created_at INTEGER NOT NULL` · `updated_at INTEGER NOT NULL`. Count enforcement (3/50/∞) happens in VOL-05 §4, not by query.

**`results`** — `id TEXT PK` · `user_id TEXT NOT NULL` · `tool_id TEXT NOT NULL` · `r2_key TEXT` (body > 64 KB lives in R2 `results/` bucket; smaller bodies inline `body_text TEXT`) · `body_sha256 TEXT` · `bytes INTEGER` · `expires_at INTEGER NOT NULL` (tier horizon; Free rows expire at creation — history_days=0 means *do not store*, enforced before insert) · `created_at INTEGER NOT NULL`. Index: `(user_id, expires_at)` — the daily expiry cron walks exactly this index.

## §5 Compliance, Boost, Audit (D-02 / D-05)

**`boost_ledger`** — `id TEXT PK` · `user_id TEXT NOT NULL` (or `anon_<hash>` for anonymous) · `ad_session_id TEXT NOT NULL` (AdsGram callback id) · `amount INTEGER NOT NULL DEFAULT 10` · `utc_day TEXT NOT NULL` (`YYYYMMDD`) · `granted_at INTEGER NOT NULL`. **MUST:** the VOL-08 §5 reward endpoint inserts only after verifying the AdsGram reward callback signature; the daily cap (2 grants) is one indexed count on `(user_id, utc_day)` before insert — a third insert is refused, never truncated.

**`consent_events`** — `id TEXT PK` · `user_id TEXT NOT NULL` · `from_state TEXT` · `to_state TEXT CHECK(to_state IN ('granted','denied')) NOT NULL` · `policy_version INTEGER NOT NULL` · `surface TEXT CHECK(surface IN ('onboarding','settings','re-ask')) NOT NULL` · `at INTEGER NOT NULL`. **MUST:** every change to `users.ai_training_consent` writes exactly one row here in the same transaction; `policy_version` comes from the current published policy (VOL-16 §6); a policy bump triggers the re-ask banner, not an automatic consent change.

**`audit_log`** — `id TEXT PK` · `actor_kind TEXT CHECK(actor_kind IN ('user_session','pat','aat','system','founder')) NOT NULL` · `actor_id TEXT` · `event TEXT NOT NULL` (closed set: `token.created`, `token.revoked`, `token.rotated`, `session.family_revoked`, `consent.changed`, `account.deleted`, `grant.revoked`, `boost.granted`, `billing.webhook_failed`, `mode.brake_flipped`) · `subject TEXT` (object id) · `meta_json TEXT` · `at INTEGER NOT NULL`. Index: `(subject, at)`. **NEVER:** request bodies, file contents, or result payloads in `meta_json` — ids and codes only (VOL-10 §8.8 applies platform-wide).

## §6 KV and R2 Namespaces

**KV `BURST`** — key `b:<bearer-hash-prefix>` → burst window counter, TTL 10 s (VOL-05 §5). **KV `ENT`** — key `e:<user_id>` → cached `Entitlement` projection with `version`, TTL ≤ 60 s. **KV `STATE`** — OAuth/OTP one-time states, TTL ≤ 10 min. The only KV writes in the system are burst-window bookkeeping, entitlement-version invalidations, and state issuance — all other traffic is read-only or D1 (VOL-01 §4.3 rule).

**R2** — bucket `jontrix-results` (paid-tier saved results, key `res/<user_id>/<result_id>`); bucket `jontrix-training` (exists only when D-05 consent data is exported for training; key convention `batches/<policy_version>/<date>/`, written by the VOL-16 §6 pipeline, never by request handlers). **NEVER:** user uploads at rest — server-side Jont inputs are streamed and discarded within the request (C6).

## §7 Seeding and Verification

Phase-1 seeds: 4 `plans` rows (VOL-01 §4.1 values verbatim), 247 `jonts` rows from `spec/catalog/jonts.seed.json` (generated from VOL-13), and the FRAZIYM version row `meta.version = src/version.ts` in a one-row `meta` table — so even SQL reports read the version from the single source. `scripts/verify-db.ts` MUST assert: every table/index of this volume exists, 4 plan rows match the contract byte-for-byte, 247 jonts rows load, and no view/trigger exists that D1 free tier would tax on every request.

## §8 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T4.1 | Fresh D1 | migrations applied; `npm run db:verify` | all §2 tables + indexes exist; 4 plans; 247 jonts; exits 0 |
| T4.2 | U-FREE | 26th server call writes `counters_json` | key `srv_YYYYMMDD` incremented once; no new row; UTC rollover reads key `srv_<next-day>` = 0 |
| T4.3 | Same webhook delivered twice (NOWPayments) | second delivery hits `webhook_events` unique index | acked `ignored`, no second `payments` row (VOL-06 T6.5) |
| T4.4 | U-PRO with active PAT | dashboard rotate | old token row `rotated`, new row `active`, same transaction; partial unique index holds exactly one active PAT |
| T4.5 | U-FREE, `history_days = 0` | server Jont run with "save result" | no `results` row inserted (refused pre-insert); `jont_usage` row still written |
| T4.6 | Consent granted then denied (U-PRO) | pipeline export runs | export query returns zero rows for U-PRO; two `consent_events` rows exist; `users.consent_version` = current policy |
| T4.7 | Boost grant ×3 in one UTC day (U-FREE) | third AdsGram callback verified | first two rows in `boost_ledger`; third refused with `boost_cap` error; no KV write |
| T4.8 | Any audit event | inspect `meta_json` | contains ids/codes only — a grep over 24h of rows finds no payload substring |

**DoD hooks (VOL-14):** "schema verified + seeds loaded" (G-04), "idempotency gates proven on all four webhook providers" (G-12), "consent columns + audit trail present and enforced" (G-21).
