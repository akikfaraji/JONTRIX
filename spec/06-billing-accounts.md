# Volume 6 — Accounts, Billing & Entitlement Sync

**Document:** JONTRIX Build Specification — VOL-06
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 (constraints), VOL-01 §4–5 (tiers, rails), VOL-04 (schema), VOL-05 (envelope, middleware). Referenced by: VOL-08 (Mini App checkout), VOL-10 (auth identity), VOL-14 (DoD), VOL-15 (ledger).

---

## §1 Scope and the Two Rails (LOCKED)

This volume owns three things: **identity** (how a human becomes a `users` row), **money-in** (Stars and USDT checkouts), and **entitlement sync** (the state machine that turns a confirmed payment into a tier window within 60 seconds). Ad revenue is *not* billed here — AdsGram payouts are recorded from provider statements into the VOL-15 ledger, and the Boost *reward* side lives in VOL-08 §5. Paddle is a documented FALLBACK (§7), built never. Every money-path rule below is written against the verified economics in `research/payments.md` (E1/E2) and the honesty contract VOL-01 §5.6.

## §2 Authentication (LOCKED)

Two identity providers, both passwordless: **Telegram Login** (Login Widget on PWA/extension settings; `initData` validation inside the Mini App — HMAC check against the bot token, `auth_date` freshness ≤ 1 day) and **email OTP** (6-digit code, hashed at rest in KV `STATE`, TTL 10 min, ≤ 5 attempts). First login creates `users` + `auth_identities` (VOL-04 §3); linking a second provider attaches it to the existing account via signed intent (no account-merging heuristics). Session issue: 15-minute access payload + 30-day rotating refresh bound to the `sessions` row, single-use refresh, replay revokes the family (VOL-10 §4.8 semantics). **MUST:** every session names its surface (`pwa|miniapp|dashboard`); **NEVER** passwords, social OAuth beyond Telegram, or a third identity provider; **NEVER** an email stored unverified — an OTP-verified address only.

## §3 Stars Rail (LOCKED)

Surface: Mini App + bot only (VOL-01 §5.2; monthly plans only — 400/750/1500 ⭐). Flow: Mini App checkout page (prices rendered from `plans`, dual in-app/web price shown per C8) → `sendInvoice`-style Stars invoice via Bot API → user pays → Telegram delivers the successful-payment update → webhook handler (§5) verifies the payload against the bot token, records `webhook_events` + `payments` (amount in Stars), and activates the 31-day window (§6). **MUST:** the bot sends a receipt message (plan, amount, window end, reset dates) within one minute; the Mini App shows the same data from `/api/me`. **MUST:** Telegram's native subscription mechanics handle renewal/cancellation — JONTRIX never asks for a Stars card mandate of its own. **NEVER:** annual Stars plans (VOL-01 §5.2), a Stars price whose net undercuts USDT parity, or a silent price mismatch between `plans` and the invoice.

## §4 USDT Rail (LOCKED)

Processor: **NOWPayments**, fixed-price invoices, USDT on TRC20/TON (VOL-01 §5.3). Flow: checkout page → `POST /api/billing/invoice` (session) creates an `invoices` row + NOWPayments invoice via API → user pays on-chain → NOWPayments **IPN** lands on `POST /api/billing/ipn` → handler verifies the HMAC signature (salt in Worker secrets), re-fetches invoice status server-side (never trusts the payload alone), records idempotently (VOL-04 §4 unique gate), activates the window. Statuses map: `waiting/confirming` → invoice stays `pending`; `confirmed/sending` → treat as **confirmed** (window starts); `expired/failed` → invoice closed, user may re-invoice. **MUST:** the checkout viewport states "crypto payments are final, no refunds" beside the pay button (C8); **MUST:** invoices expire in 60 minutes and re-pricing follows the `plans` rows; **NEVER:** window granted on invoice *creation* or on an unverified IPN; **NEVER** an auto-renew mandate (reminders instead, §6.2).

## §5 Webhook Intake (both rails)

One intake shape: raw body → `webhook_events` insert (unique `(provider, id)`) → signature/validity check → business handler → row marked `processed` (or `ignored` with reason). Failures retry via provider redelivery; a `failed` row older than 24 h pages the founder through the watchdog digest (VOL-14 §6). **MUST:** handlers are idempotent end-to-end — the unique gate plus the state machine's own guards (§6) make double-delivery a no-op; **NEVER** a webhook processed from an unverified source, and **NEVER** a business decision inside the intake before the signature check.

## §6 The Entitlement Sync State Machine (LOCKED)

State per `entitlements` row: `free → active(monthly|annual) → expiring → free` (with `active → renewed` self-loop). Transitions, all driven by events, all bumping `version` (VOL-01 §4.1):

| From | Event | To | Effects |
|---|---|---|---|
| free | payment confirmed (§3/§4) | active | `tier`, `source`, `window_starts = confirmed_at`, `window_expires = starts + 31d` (monthly) or `+ 366d` (annual); purge nothing; restore hidden data (VOL-01 §4.4) |
| active | later payment confirmed while active | active (extended) | `window_expires = max(current expiry, payment time) + window` — stacking is time-extended, never lost |
| active | hourly cron sees `now > expires − 72h` | expiring | reminder flags (§6.2); tier unchanged |
| active/expiring | `now > expires` (hourly cron) | free | tier → `free` ≤ 60 s past the check; data hidden-not-deleted (90-day grace); AATs keep working but the tier's MCP quota now applies at Free (40/mo, D-01) |
| any | grant script (founder) | active | `source='grant'`, same windows; audited |

**MUST:** the cron path and the webhook path converge on one transition function — two writers, one state machine, no divergence; **MUST:** every transition writes the audit event and bumps `version` so all surfaces re-fetch within their 60 s cache (VOL-01 T1.4's 60-second rule is this row); **NEVER** a downgrade that deletes data, and **NEVER** a tier flip without an event row to point at.

### §6.2 Renewal Reminders (no auto-renew on USDT)

Cron-generated, D-3 / D-1 / expiry+1, each carrying a one-tap invoice link: bot message always, email when the account has one. Copy contract: state the price, the expiry fact, and nothing else — no countdown widgets, no fake urgency (C8). Stars subscriptions rely on Telegram's own renewal notices; JONTRIX sends no parallel Stars reminder.

## §7 Paddle FALLBACK Contract (documented, not built)

If a high-value segment ever demands card payment, Paddle is the documented path (merchant of record, 3% + $1, Payoneer payout — the only mainstream rail open to a Bangladesh founder per research). The contract is frozen so activation is a phase, not a redesign: Paddle sits beside the rails as provider `paddle` in `webhook_events`; plans/prices mirror §4.1 rows 1:1; entitlement activation reuses §6 verbatim with `source='usdt'`-style window semantics but its own `source` value; the checkout honors the same honesty rules. **NEVER** built in the one-shot engagement (VOL-00 Phase 5); activation requires a founder decision recorded in `docs/decisions.md`.

## §8 Payout Path (founder money-out, C2)

Money-in lands with processors; money-out is the founder's manual, documented routine (C2 — no bank, no card): **Stars** → Fragment → GRAM → USDT (21-day hold, 1,000 ⭐ minimum withdrawal ≈ $13); **NOWPayments** → auto-sweep to the founder's self-custody USDT wallet (TRC20/TON) → P2P sale → bKash/Nagad. VOL-15 §3 records the ledger view and the fee model (0.5–1.5% processor, ~2% P2P, −2.3% Stars net) so the payout runbook (VOL-14 §7) is arithmetic, not guesswork. **MUST:** the payout runbook exists as a doc at launch even though payouts are manual; **NEVER** an automated withdrawal — key material never touches the Workers.

## §9 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T6.1 | Fresh user | email OTP login, 6 wrong codes | locked for the day (KV counter), no user row created, honest error |
| T6.2 | Mini App user | pays 400 ⭐ for Pro | webhook verified → `payments` row → tier `pro` ≤ 60 s → receipt message; dual price was shown pre-purchase |
| T6.3 | PWA user | NOWPayments invoice, $4.99 confirmed via IPN | window 31 d; replayed IPN → `ignored`, no second row |
| T6.4 | U-PRO active, pays again day 20 | second confirmation | expiry extends to day 51, not day 31; audit row |
| T6.5 | U-PRO, window ends | hourly cron past expiry | tier `free` ≤ 60 s past check; history hidden; resubscribe restores |
| T6.6 | U-PRO (Stars), D-3 | reminder cron | bot reminder with price + expiry, exactly one per stage |
| T6.7 | Downgraded user's AAT | MCP call after downgrade | works, metered against Free 40/mo (D-01); envelope shows new tier honestly |
| T6.8 | Webhook with bad signature | intake | `failed` row, no business effect, no state change |
| T6.9 | Anonymous Boost reward (VOL-08 §5) | grant lands | no `payments` row — boost is quota, never money; VOL-15 sees only the provider statement line |

**DoD hooks (VOL-14):** "test purchase each tier × each rail flips entitlements ≤ 60 s" (G-16), "webhook idempotency proven on all providers" (G-12 shared), "downgrade = hide-not-delete proven" (G-17), "reminders fire once per stage" (G-18).
