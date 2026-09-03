# Volume 4 — Data Layer: Schema, Migrations & Seeds

**Document:** JONTRIX Build Specification — VOL-04
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED
**Depends on:** VOL-01 §4 (plans/limits), VOL-10 §6 (MCP tables). Referenced by: VOL-00 §0.1 (usage_ledger example), Phase 1, VOL-05 (middleware), VOL-06 (billing).

---

## §1 Conventions (LOCKED)

All timestamps are `INTEGER` Unix epoch **seconds, UTC** — no mixed formats, no timezone-bearing strings in columns. All money is integer minor units: USD in **cents** (`499` = $4.99), Stars as whole **Stars** (`400`) — floats never touch money. All ids are `TEXT` (prefixed: `usr_`, `tok_`, `inv_`, `call_`, `res_`), generated server-side as random 128-bit values; user-facing entities never expose sequential integers. All booleans are `INTEGER 0/1` (SQLite has no boolean). Every table carries `created_at`; soft-state uses explicit status enums in CHECK constraints, never magic numbers. JSON blobs are `TEXT` with the shape contracted in this volume (they are contracts, not dumps). Table/column names are `snake_case`; no column is ever named with a SQL keyword. The D1 free budget (VOL-01 §6) shapes everything: every hot-path query is a **single-row primary-key or composite-key lookup**, JOINs are bounded to two tables, and any query the middleware can answer without (VOL-05 §6 cache) must.

## §2 Table Inventory (authoritative; DDL = column definitions only)

| Table | Purpose | Key columns (contract) |
|-------|---------|------------------------|
| `users` | one row per account | `id TEXT PK` · `handle TEXT UNIQUE` · `display_name TEXT` · `status TEXT CHECK(active,suspended) DEFAULT 'active'` · `signup_source TEXT` · `created_at INTEGER NOT NULL` |
| `identities` | one row per login identity | `id TEXT PK` · `user_id TEXT NOT NULL` · `kind TEXT CHECK(telegram,email_otp) NOT NULL` · `external_id TEXT UNIQUE` (telegram id) · `email_hash TEXT UNIQUE` (SHA-256; raw email never stored) · `last_login_at INTEGER` |
| `plans` | VOL-01 §4.1 `Plan` rows, seeded | `tier TEXT PK CHECK(free,pro,studio,max)` · `price_usd_cents INTEGER` · `price_usd_annual_cents INTEGER` · `price_stars INTEGER` · `limits_json TEXT NOT NULL` (the `Limits` contract, verbatim) |
| `entitlements` | the live authority per user | `user_id TEXT PK` · `tier TEXT NOT NULL` · `source TEXT CHECK(stars,usdt,grant)` · `window_start INTEGER` · `window_end INTEGER` · `version INTEGER NOT NULL DEFAULT 1` (bumped on every change; VOL-01 §4.1) · `updated_at INTEGER NOT NULL` |
| `usage_counters` | daily + monthly counters (atomic check-and-increment target) | `(user_id TEXT, period TEXT) PK` where `period` = `d:YYYY-MM-DD` or `m:YYYY-MM` · `server_calls INTEGER DEFAULT 0` · `ai_calls INTEGER DEFAULT 0` · `mcp_calls INTEGER DEFAULT 0` — one row per user per period, upserted by the middleware inside the same transaction as the check (VOL-01 §4.3) |
| `jont_usage` | **per-Jont-call ledger** (append-only; Phase-8 metering target) | `id TEXT PK` · `user_id TEXT` (nullable for anonymous) · `jont_id TEXT NOT NULL` · `source TEXT CHECK(pwa,miniapp,extension,mcp) NOT NULL` · `token_id TEXT` (mcp) · `ms INTEGER` · `bytes_in INTEGER` · `bytes_out INTEGER` · `status INTEGER` (HTTP class) · `created_at INTEGER NOT NULL` — index `(user_id, created_at)`, `(jont_id, created_at)` |
| `usage_ledger` | **platform event ledger** (append-only; audits auth, billing, admin, quota-brake events — not Jont calls, which live in `jont_usage`) | `id TEXT PK` · `actor TEXT` (user id, token id, or `system`) · `event TEXT NOT NULL` (e.g. `login`, `stars_paid`, `ipn_verified`, `token_revoked`, `brake_80`, `brake_95`, `downgrade`) · `detail_json TEXT` · `created_at INTEGER NOT NULL` — index `(actor, created_at)`, `(event, created_at)` |
| `jonts` | the Jont registry (seeded from `spec/catalog/jonts.seed.json`) | `jont_id TEXT PK` (e.g. `J001`) · `src_id TEXT` (opportunities.json row id) · `slug TEXT UNIQUE` · `name TEXT` · `pattern TEXT CHECK(converter,validator,generator,extractor,fixer)` · `context TEXT CHECK(client,server)` · `tier_fit TEXT CHECK(FREE,PRO,MAX)` · `platform_role TEXT` · `score REAL` · `mcp_exposed INTEGER DEFAULT 1` · `status TEXT CHECK(planned,beta,live) DEFAULT 'planned'` · `seo_json TEXT` (slug/canonical/description contract, VOL-07 §5) |
| `presets` | saved Jont configurations | `(user_id TEXT, jont_id TEXT, name TEXT) PK` · `config_json TEXT NOT NULL` · `frozen INTEGER DEFAULT 0` (downgrade keeps rows, marks frozen — VOL-01 §4.4) · `updated_at INTEGER` |
| `results` | metadata for saved results (bodies in R2, VOL-04 §4) | `id TEXT PK` · `user_id TEXT NOT NULL` · `jont_id TEXT NOT NULL` · `r2_key TEXT NOT NULL` · `bytes INTEGER` · `expires_at INTEGER` (tier retention from `Limits.history_days`) · `created_at INTEGER NOT NULL` |
| `invoices` | USDT-rail invoices (NOWPayments) | `id TEXT PK` · `user_id TEXT NOT NULL` · `tier TEXT NOT NULL` · `plan TEXT CHECK(monthly,annual)` · `usd_cents INTEGER NOT NULL` · `np_invoice_id TEXT UNIQUE` · `pay_address TEXT` · `status TEXT CHECK(new,waiting,confirming,paid,expired,failed)` · `window_end_granted INTEGER` (set only on verified IPN — VOL-01 §5.3) · `created_at INTEGER NOT NULL` |
| `stars_purchases` | Stars-rail grants | `id TEXT PK` · `user_id TEXT NOT NULL` · `tier TEXT NOT NULL` · `stars INTEGER NOT NULL` · `telegram_payment_charge_id TEXT UNIQUE` (idempotency anchor) · `window_end INTEGER NOT NULL` · `created_at INTEGER NOT NULL` |
| `webhook_events` | webhook idempotency + audit for all providers | `id TEXT PK` · `provider TEXT CHECK(telegram,nowpayments)` · `external_event_id TEXT` · `payload_hash TEXT NOT NULL` · `status TEXT CHECK(received,processed,rejected,duplicate)` · `received_at INTEGER NOT NULL` — UNIQUE `(provider, payload_hash)` |
| `kv_state` | *inventory only* — KV keys are catalogued here, not stored in D1 | see §3 |

MCP-side tables (`mcp_tokens`, `mcp_device_codes`, `mcp_usage_daily`, `mcp_idempotency`) are contracted in **VOL-10 §6** and are part of migration `0002_mcp.sql` below; this volume does not redefine them.

## §3 KV/R2 Layout (contract)

**KV namespace `state`** (the only KV namespace; reads are free-heavy, writes rationed to ≪ 1,000/day per VOL-01 §6): `ent:{user_id}` → cached `Entitlement` JSON with `version` (TTL 60 s; write only on change) · `burst:{token_or_session}` → burst-window counter (TTL 10 s; the ≤2-writes-per-call exception VOL-01 §4.3 allows) · `brake` → platform mode (`normal|conservative|read_only`, written hourly at most) · `catalog:etag` → tool-catalog hash for MCP ETags. Nothing else is ever written to KV; new keys require a decision-ledger entry (VOL-15 §1). **R2 bucket `results`**: keys `res/{user_id}/{YYYY/MM}/{result_id}` with per-object `expires_at` metadata enforced by monthly cleanup cron; public access disabled, reads only through the API with an entitlement check. **R2 bucket `engines`**: content-hashed WASM/JS engine bundles served with immutable cache headers via the Pages/Worker proxy; a new engine build produces a new hash, never an overwrite.

## §4 Migrations (LOCKED list)

Exactly two migrations exist at launch; both are idempotent and re-runnable. `migrations/0001_init.sql` creates: `users`, `identities`, `plans`, `entitlements`, `usage_counters`, `jont_usage`, `usage_ledger`, `jonts`, `presets`, `results`, `invoices`, `stars_purchases`, `webhook_events`, plus every index named in §2. `migrations/0002_mcp.sql` creates the four VOL-10 §6 tables and their indexes. Migration files contain **column definitions and indexes only** — no triggers, no application logic, no backfilled data (seeds are scripts, not DDL). New migrations after launch append sequentially (`0003_…`) and are one-line entries in `docs/decisions.md`; editing an applied migration is forbidden. The migration runner is `wrangler d1 migrations apply` in the deploy workflow (VOL-14 §3.2), preview-first per VOL-03 §1.

## §5 Seeds (Phase-1 exit target)

Two seed scripts run after migrations, both idempotent (upsert by natural key). **`npm run db:seed`** loads: the four `plans` rows with the exact VOL-01 §4.1 numbers (0/499/999/1999 cents monthly; 0/4990/9990/19990 annual; 0/400/750/1500 Stars; `Limits` per VOL-01 §4.2 — write the JSON, do not compute it), and the `jonts` registry from `spec/catalog/jonts.seed.json` (247 rows generated per VOL-13 §1: `jont_id`, `src_id`, `slug`, `name`, `pattern`, `context`, `tier_fit`, `platform_role`, `score`, `mcp_exposed`, `seo_json`). **`npm run db:seed -- --users`** (dev/preview only) inserts the test fixtures: U-FREE, U-PRO, U-STUDIO, U-MAX, the AAT fixtures of VOL-10 §10, and a grant-tier user. **NEVER:** a seed that mutates production entitlements; the users seed refuses to run when the D1 binding is the production database (binding name check).

## §6 Verification Contract (`scripts/verify-db.ts`)

`npm run db:verify` is the Phase-1 exit condition and a permanent CI gate. It asserts, in order: (1) every §2 table exists with every §2 column; (2) the four `plans` rows match the VOL-01 §4.1 numbers byte-for-byte; (3) the `jonts` table has 247 rows whose `jont_id` set equals the seed's, with zero `slug` collisions and zero context mismatches against the source rows' `client_side` flag **except** rows carrying the seed's explicit `context_note` (exactly two: DV-B3, DV-B5 — Phase-7 server-side mandates, VOL-12 §1); (4) the tier-fit distribution of the registry equals 155/79/13 (FREE/PRO/MAX) — if the counts drift from the frozen file, the seed is wrong, not the matrix; (5) the MCP tables of VOL-10 §6 exist with their UNIQUE constraints intact. Output is a one-line PASS/FAIL per assertion plus a final line `db:verify OK (n checks)`; any FAIL exits non-zero and blocks deploy.
