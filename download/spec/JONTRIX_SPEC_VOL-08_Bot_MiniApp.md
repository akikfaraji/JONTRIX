# Volume 8 — Telegram Bot & Mini App

**Document:** JONTRIX Build Specification — VOL-08
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED
**Depends on:** VOL-01 §2/§5 (surfaces, Stars ladder), VOL-05 (envelope), VOL-06 §3/§5 (Stars checkout, sync), VOL-07 (PWA host). Referenced by: Phase 6.

---

## §1 Bot Identity and Command Surface

`@JONTRIX_bot` is the Telegram-rail identity: it authenticates Mini App users (VOL-06 §1), sells Stars subscriptions, delivers receipts, sends renewal reminders (VOL-06 §5), posts the monthly payout summary to the founder (VOL-06 §7), and is the re-engagement channel. The webhook handler (`POST /api/telegram/webhook`, secret-token protected per VOL-06 §6) processes updates inside the VOL-05 envelope with the 25-second budget and queue offload for anything slow. Command surface (LOCKED — small on purpose):

| Command | Scope | Behavior contract |
|---------|-------|-------------------|
| `/start` | anyone | identity link or creation (VOL-06 §1), welcome card, Mini App button |
| `/jonts [query]` | anyone | paginated catalog from the registry (name, one-line problem, tier badge); `query` filters name/cluster; each row deep-links into the Mini App Jont page |
| `/jont {slug}` | anyone | one Jont card: problem statement, execution context label, tier, "Open in Mini App" |
| `/quota` | signed-in | daily + monthly counters and reset times (reads VOL-05 §4 state; honest numbers only) |
| `/buy` | signed-in | pricing card with the Stars ladder and dual-price note (VOL-01 §5.2), buttons → Mini App pricing |
| `/mcp` | signed-in | the VOL-10 §9 three-step agent onboarding, verbatim |
| `/help` | anyone | the command list + the status link (VOL-05 §7) |

**MUST:** every reply carries the bot's keyboard (Mini App + catalog) — Telegram is a distribution surface (C3), not a chat toy; group messages respect the 20 msg/min and broadcasts the 30 msg/s cap (research/infra.md), enforced by the send-queue. **NEVER:** a command that writes during read paths, an unhandled update type (unknown updates get a one-line ack, not silence), or a broadcast that isn't deduplicated per user (VOL-06 §5 reminder dedupe rule applies to every send).

## §2 Mini App Host

The Mini App is the same PWA bundle (VOL-07) running inside Telegram's WebView, initialized through the official `@telegram-apps/sdk` with `initData` validated server-side: the Worker recomputes the HMAC-SHA256 (`WebAppData` key material per Bot API), rejects payloads older than 86400 s, and issues the platform session — one code path shared with VOL-06 §1 so identity semantics never fork. Theme adapts to Telegram's color scheme; back button closes to the bot chat; the app declares `bot_command` menu entries mirroring §1. The Mini App adds exactly one Telegram-specific surface on top of the PWA: **the pricing/purchase section (§3)** — everything else (catalog, workbench, engine loader, gates) is the stock PWA, which is why Phase 6 is small after Phase 4. **MUST:** `initData` validation happens on every session issuance (never client-side trust); the app works at Telegram's WebView baseline (no bleeding-edge JS without a transpile target). **NEVER:** a second UI codebase for Telegram, or a Mini App feature that hides its tier gating differently than the PWA does (C8 parity).

## §3 Stars Purchase UX (the impulse rail)

The pricing section renders the ladder from `/api/config` (400/750/1500 Stars for Pro/Studio/Max, VOL-01 §5.2) with the honest dual price per row ("≈ $8.00 in-app · ≈ $5.33 on web") and the plain sentence: "Stars subscriptions renew monthly; cancel anytime in Telegram." Purchase = VOL-06 §3's four steps driven from this UI: `POST /api/billing/stars/invoice` → `openInvoice` → the bot's pre-checkout/successful_payment handlers → receipt. The UI states the three states honestly: pending (invoice open), granted (window + renewal date shown, entitlement meter updates within 60 s), failed (one-line reason + retry). Cancellation is Telegram's subscription management surface — the bot's `/buy` reply includes the manage-subscription link Telegram provides, because a cancel flow the user can't find is a dark pattern (C8). **MUST:** the purchase button is disabled with a reason when a same-source active window exists (no double-selling a month). **NEVER:** a discount timer, a "only 2 left" fabrication, or a price rendered from anything but `plans.price_stars`.

## §4 Receipts, Reminders and Broadcasts

Every successful purchase triggers a **receipt message** within 60 s: tier, amount in Stars, window end, the renewal date, and the deep link back into the Mini App — this is the Phase-6 exit artifact. Reminders (VOL-06 §5): D-3 and D-1 before `window_end` for Stars and USDT renewals, expiry+1 with the re-subscribe link; each deduplicated per `(user, tier, window_end, kind)`. Broadcasts (catalog launches, version notes) are founder-initiated through a single admin command (`/announce` to the bot from the founder's account, confirmed once), rate-queued at ≤ 25 msg/s against the 30 cap, and chunked 500 users/batch with resume-on-failure — the queue state lives in D1, so a crashed broadcast continues, never double-sends. **MUST:** every send passes the dedupe table; broadcast copy states the version (`VERSION`) it announces. **NEVER:** a broadcast to users who set the bot's mute (Telegram handles it, but the queue still retries failures honestly), a receipt without the renewal terms, or reminder copy that feigns urgency.

## §5 Acceptance Tests — Bot & Mini App (Phase-6 exit gate)

| # | Given | When | Then |
|---|-------|------|------|
| T8.1 | New Telegram user | `/start` | identity linked, session issued, welcome card + Mini App button, `login` ledger event |
| T8.2 | Signed-in user | `/jonts json` | filtered catalog ≤ 2 s; rows deep-link to Mini App pages |
| T8.3 | U-FREE | Stars purchase 400 Stars (T6.3 fixtures) | receipt ≤ 60 s; `/quota` shows pro window; Mini App entitlement meter flips ≤ 60 s |
| T8.4 | U-PRO | opens Mini App pricing mid-window | purchase button disabled with the honest reason; manage-subscription link present |
| T8.5 | Any user | initData replayed after 24 h | rejected (86400 s window), session not issued |
| T8.6 | 1,200-user broadcast | founder `/announce` | queued at ≤ 25 msg/s, chunked, resumable; zero duplicates on crash-restart |
| T8.7 | Forged update | posts to webhook without secret token | 403; `webhook_events(status='rejected')`; no processing |
| T8.8 | Unknown update type | arrives at webhook | one-line ack; no error to the user; type logged in `usage_ledger` |
