# Volume 8 — Telegram Bot & Mini App (S2)

**Document:** JONTRIX Build Specification — VOL-08
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 (constraints), VOL-01 §5.5 (ads contract), VOL-04 §5 (boost_ledger), VOL-05 (routes), VOL-06 §3 (Stars), VOL-07 (shell reuse). Referenced by: VOL-15 §4 (ad revenue), VOL-14 (DoD).

---

## §1 The Bot (LOCKED)

`@JONTRIX_bot` is the SMB Operator's front door and the account's command line. Long-polling in dev, webhook in prod (`SECRET_TOKEN` path guard); every update is processed idempotently by `update_id`. Command set (anything else → one-line help, never a menu maze):

| Command | Behavior |
|---|---|
| `/start` | identity link (VOL-06 §2), 3-line value pitch, button → Mini App |
| `/catalog` | family list → top Jonts per family (inline buttons, paginated) |
| `/jont <id-or-slug>` | card summary + "Open in Mini App" button (execution happens in the Mini App/PWA, never in chat) |
| `/me` | tier, window ends, quota block (base/boost/effective), consent state |
| `/quota` | same as `/me` quota section with reset times |
| `/buy` | plan buttons → Stars invoice (VOL-06 §3); dual price stated in the message (C8) |
| `/mcp` | the 3-step gateway onboarding copy (VOL-10 §9) + link to `/connect-agent` |
| `/help` | one screen, every command, nothing else |

**MUST:** receipts (VOL-06 §3), reminders (VOL-06 §6.2), and the daily digest are the only proactive messages the bot ever sends; **NEVER** a broadcast to non-opted users, a "daily nudge," or any growth-hack message (C8 — the bot's silence is a feature).

## §2 The Mini App (LOCKED)

The Mini App is the PWA shell (VOL-07 §2 routes) running inside Telegram's WebView, authenticated by `initData` HMAC validation (VOL-06 §2) — no second auth system. Differences from the browser PWA, exhaustively: **(1)** the **Boost button exists here and only here** (§5); **(2)** Stars checkout is native here (VOL-06 §3); **(3)** the theme follows Telegram's color scheme via `packages/ui` tokens; **(4)** back-button behavior uses Telegram's navigation affordance. Everything else — catalog, Jont pages, engine loader, dashboard, consent card — is the same code (VOL-03 §1 ownership rule). **MUST:** the Mini App states its quota honestly on first paint; **NEVER** a second implementation of a Jont or of entitlement logic.

## §3 Stars Checkout UX (LOCKED)

Checkout screen (Mini App): plan cards rendered from `plans` with the **dual price line verbatim** ("400 Stars ≈ $8.00 in-app · ≈ $5.33 on web", VOL-01 §5.2), the "what you get" list pulled from the tier matrix, and the cancel/renewal fact ("Telegram handles renewal; cancel anytime in Telegram"). Tap → invoice → payment → receipt message + entitlement flip ≤ 60 s (VOL-06 T6.2). **MUST:** failure states (user cancel, insufficient Stars, timeout) are three distinct honest messages with a retry that re-prices from `plans`; **NEVER** a price hard-coded in the bot or the app.

## §4 Re-engagement (LOCKED)

Transactional set: receipts, reminders (D-3/D-1/+1), webhook-failure notice to the *founder* only. Optional digest: a weekly "what's new in the catalog" message, **opt-in at first /start** (checkbox inline button, default OFF), one message per week max, one-tap unsubscribe that is honored immediately. That is the entire notification universe (C4/C8).

## §5 AdsGram Boost (LOCKED, D-02 — the only ad integration in the product)

**Placement:** one "⚡ Boost +10 calls today" button on the Mini App's quota card (Free tier and anonymous users only; paid tiers never see it — VOL-01 §5.5). **Flow:** tap → consent line restating the exact exchange ("Watch a short ad → +10 server calls for today. Max 2 per day.") → AdsGram rewarded video → **reward callback** → grant. **Grant endpoint:** `POST /api/boost/claim` (Mini App session or anonymous identity) — verifies the AdsGram callback signature server-side against the ad session id, checks the day's grant count on `boost_ledger (user_id, utc_day)` (max 2), inserts the ledger row (+10), and returns the new quota block. The effective cap becomes base 25 → 45 (anonymous 12 → 32 with the same +10/2-grant rules). **MUST:** the grant lands only on the network's reward callback — never on ad start, never on client-side claims of completion; **MUST:** the third attempt same-day returns `429 boost_cap` with honest copy ("that's today's max — resets 00:00 UTC"); **MUST:** boost counters reset with the daily UTC rollover like every other counter (VOL-01 §4.3). **NEVER:** boost granted for anything other than the ad watch, an interstitial/banner/auto-play anywhere in the Mini App, boost sold for Stars (it is an *earn* mechanic, not an upsell), or ad code in the PWA/extension builds (VOL-07 §1, VOL-09). Fraud rules: one grant per ad session id (unique in ledger), callback replay refused, anonymous grants keyed to the salted IP+UA identity (VOL-01 §4.3) so farm rotation cannot stack. Revenue from AdsGram statements is recorded monthly into the VOL-15 §4 ledger — the runtime never sees ad money.

## §6 Gating and Honesty in the Mini App (LOCKED)

Same entitlements as every surface (VOL-01 §2.2): server-side gates hard, client-side gates UI-level; the execution label (browser vs server) renders identically here; the quota card shows the tier cap truth and, for Free, the Boost affordance as *surplus*. **MUST:** the consent card (VOL-05 §8) renders in the Mini App onboarding identically; **NEVER** a Telegram-only "premium Jont" that the PWA lacks — the catalog is one catalog.

## §7 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T8.1 | New Telegram user | `/start` | account linked in ≤ 5 s; Mini App opens pre-authenticated via `initData` |
| T8.2 | Free Mini App user | `/buy` → 400 ⭐ Pro | dual price shown; receipt ≤ 1 min; tier flips ≤ 60 s (T6.2) |
| T8.3 | Free Mini App user | Boost ×3 in a day | +10, +10, then `429 boost_cap` honest copy; ledger shows exactly 2 rows; effective cap 45 |
| T8.4 | Boost grant | inspect request handling | grant only after AdsGram callback verification; replayed callback refused; no KV write |
| T8.5 | Pro user | opens Mini App quota card | no Boost button exists anywhere; quota shows base only |
| T8.6 | PWA/extension bundles | grep for AdsGram SDK | zero occurrences (D-02 surface lock) |
| T8.7 | Bot | unknown text to bot | one-line help; no menu loops; nothing logged beyond ids |
| T8.8 | Digest opt-out | tap unsubscribe | honored immediately; no further digests; `/start` again re-offers opt-in |
| T8.9 | Anonymous Mini App user | Boost ×2 then 13th server call | anonymous cap 12 + 20 boost = 32; 33rd call → 402 with sign-in prompt (signing in still doubles the *base*, boost persists for the day) |

**DoD hooks (VOL-14):** "Stars purchase + receipt E2E" (G-16 shared), "Boost ceremony verified incl. cap + replay refusal" (G-24), "ad SDK absent from PWA/extension bundles" (G-25), "bot message universe = receipts + reminders + opted digest" (G-26).
