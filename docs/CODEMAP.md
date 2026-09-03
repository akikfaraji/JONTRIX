# Code Map — where everything actually lives

One Next.js app carries the whole platform (per VOL-03 the api, mcp worker and PWA share
one deployable). Nothing is hidden, but the layout is not obvious from the top level, so:

## The Telegram bot

| What | File |
|------|------|
| InitData validation + user provisioning (VOL-06 §2) | `src/lib/telegram.ts` |
| Every command handler (`/start /catalog /jont /me /quota /buy /mcp /help`) | `src/lib/bot/commands.ts` |
| Webhook entry (secret-guarded, reply-only, idempotent) | `src/app/api/telegram/webhook/route.ts` |
| Boost ceremony (AdsGram reward → +10 calls, cap 2/day) | `src/app/api/boost/claim/route.ts` |
| Dev long-poll runner (no public URL needed) | `scripts/dev-poll.ts` |
| Acceptance sweep (15 tests) | `scripts/test-bot.ts` |

The bot is a webhook bot inside the main app, not a separate process: set
`TELEGRAM_BOT_TOKEN` + `TELEGRAM_WEBHOOK_SECRET` and point the webhook at
`/api/telegram/webhook`, or run `tsx scripts/dev-poll.ts` locally.

## The MiniApp

There is no second app. **The MiniApp is this dashboard** (`src/app/page.tsx` and the
views in `src/components/site/`), opened inside Telegram's WebView. The Telegram-specific
surface is `src/components/site/boost-button.tsx` (detects the Telegram WebView, loads the
AdsGram SDK only there, claims Boost). PWA and extension builds never load ad code.

## The MCP gateway (server side)

| What | File |
|------|------|
| Auth, kind isolation (PAT vs AAT), scopes, sessions, rate limit | `src/lib/mcp/*` |
| Device flow, approval front door, tools/call, quota | `src/app/api/mcp/*` |
| Discovery document | `public/.well-known/jontrix-mcp.json` |
| Acceptance sweep (20 tests) | `scripts/test-mcp.sh` |

## The MCP gateway (agent side, CLI)

`packages/gateway/` — the `jontrix-gateway` npm package: stdio MCP server, device flow,
paste flows, config writers for six agent hosts. Its own README is in that folder.

## The Jont runtime (the actual tools)

| What | File |
|------|------|
| Types, manifests, result envelope (VOL-11 §2/§3) | `src/lib/jont-runtime/types.ts` |
| Dispatch pipeline (preflight → validate → concurrency → timeout → meter) | `src/lib/jont-runtime/dispatch.ts` |
| Server engines (run on the server, consume quota) | `src/lib/jont-runtime/engines/*` |
| Client engines (run in your browser, files never leave) | `src/lib/jont-runtime/client-engines/*` |
| Deterministic helpers (RFC4180 CSV, hashing, PRNG) | `src/lib/jont-runtime/util.ts` |
| Run route (session or PAT auth, refusals never consume quota) | `src/app/api/jonts/[id]/run/route.ts` |

Which tools are built is decided by code, never by the database: the seed stamps
`status='built'` from the engine registries (`BUILT_JONT_IDS` + `CLIENT_BUILT_JONT_IDS`).

## The browser extension

`apps/extension/` — MV3 service worker, popup, content overlay. Load unpacked; its README
has the contracts.

## Data, plans, entitlements

| What | File |
|------|------|
| Prisma schema + seed (247 Jonts) | `prisma/schema.prisma`, `prisma/seed.ts` |
| Tier ladder, prices, Stars packs | `src/lib/plans.ts` |
| Tool entitlements per tier (155/234/247 unlock ladder) | `src/lib/entitlements.ts` |
| Quota math, UTC reset windows, burst | `src/lib/utc.ts`, `src/lib/burst.ts` |
| Response envelope + error codes | `src/lib/envelope.ts` |

## Honest status of the tool catalog

The catalog has 247 Jonts. Built tools are the ones listed in the two engine registries —
40 today (25 server engines + 15 client engines); everything else shows "planned" and
refuses to pretend. That honesty rule (C5, VOL-11) is why most cards look like placeholders:
they are placeholders that say so out loud, and each build batch promotes real engines,
never fake ones. Client engines run in the browser through the run panel's form; server
engines consume quota and are also reachable by agents through MCP.
