# JONTRIX

A subscription-based toolbox of 247 small, sharp, single-purpose tools ("Jonts") by Fraziym Soft.
Four tiers — Free, Pro, Studio, Max — plus an MCP gateway so any AI agent can call the same tools.

This repository is contracts-first: every surface is implemented against the volumes in `spec/`,
which are the normative source of truth. Where code and spec disagree, the spec wins and the code
is corrected.

## Status

- Contracts: VOL-00 through VOL-16 complete. Legal review G-35 CLEARED (2026-09-03).
- Platform: dashboard (PWA), tool runtime, MCP gateway server, Telegram bot + Boost,
  browser extension, gateway CLI, ledger and DoD tooling — built and acceptance-tested.
- Tools: 40 of 247 Jonts have real engines today (25 server + 15 in-browser client
  engines), including the CSV/JSON data-repair core, curl-to-code, the API error
  decoder, the merchant-feed fixer, and the deterministic quiz generator. Every
  unbuilt card says "planned" and refuses to pretend — build batches keep promoting
  real engines.
- Not yet live: npm/PyPI publication of the gateway (needs founder registry accounts),
  billing rails (Paddle/Stars are FALLBACK swap points per the decision register),
  production deployment, AI-dependent tools (need a provider key).

## Layout

A full map of every surface (bot, MiniApp, MCP, runtime, extension) is in
[docs/CODEMAP.md](docs/CODEMAP.md).

```
spec/            Normative volumes VOL-00..16 + jonts.seed.json catalog
src/             Next.js app: dashboard (PWA), API routes (/api/v1, /api/mcp, /api/jonts),
                 Jont runtime engines (src/lib/jont-runtime), MCP server logic (src/lib/mcp)
src/version.ts   Single authoritative version source (VOL-00 §0.7, LOCKED)
prisma/          Schema + seed (247 Jonts)
packages/gateway jontrix-gateway CLI: stdio MCP server, device flow, agent config writers
apps/extension   MV3 browser extension: service worker, popup, selection overlay
scripts/         Verification harness: verify-db, test-runtime, test-mcp, test-bot,
                 ledger, dod-check, version-hygiene
research/        Read-only evidence corpus
docs/            Decision register, ledger statements
```

## Getting started

Requires Node.js 18+ and npm.

```bash
npm install
cp .env.example .env   # then fill what your deployment needs
npm run db:push        # create schema
npm run db:seed        # load all 247 Jonts (also auto-runs on boot if missing)
npm run dev            # dashboard on http://localhost:3000
```

The server self-heals: if the database is empty or wiped, an idempotent seed
runs at boot (Next.js instrumentation hook) before the first request.

## Accounts, sessions, and email

- **Sign-up / sign-in**: email + password (scrypt hashes, OWASP parameters,
  breach-list guard) or a 6-digit email code. Sessions: HttpOnly `jx_sess`
  cookie, 15-minute HMAC access payload, 30-day single-use refresh with
  family revocation on replay.
- **OAuth**: Google and GitHub, authorization-code flow with single-use
  state (CSRF). Unverified-email conflicts refuse; ownership proof links.
- **Email**: real SMTP via nodemailer (Gmail app-password, Resend, Brevo,
  Mailgun, or self-hosted Postfix — all free at dev scale). Without SMTP
  env vars the honest `log` driver prints mails to the server log and every
  response reports it; nothing fakes delivery.
- **Anti-abuse**: per-IP burst windows, 5 OTP sends / address / day with a
  30 s resend interval, 5 password attempts / account / day (cleared by an
  emailed reset — the reset link IS ownership proof), single-use reset and
  verification tokens, enumeration-safe forgot-password responses.

## Environment configuration

Copy `.env.example` to `.env`. Everything degrades honestly: an unset
provider returns a 503 with a clear message instead of faking success.
Human setup that code cannot do: SMTP credentials + from-domain (SPF/DKIM),
Google/GitHub OAuth client credentials with the documented callback URLs,
Telegram bot token + webhook secret, AdsGram verify key, billing keys.

## Commands

| Command            | Purpose                                    |
|--------------------|--------------------------------------------|
| `npm run dev`      | Run the app in development                 |
| `npm run build`    | Production build (standalone output)       |
| `npm start`        | Serve the production build (plain Node)    |
| `npm run lint`     | ESLint                                     |
| `npm run db:push`  | Sync Prisma schema to the database         |
| `npm run db:seed`  | Seed the 247-Jont catalog                  |
| `npm run db:verify`| Verify DB against the seed contract        |
| `npm run verify:version` | Version-hygiene check (VOL-00 §0.7)  |

Gateway CLI lives in `packages/gateway` (own `package.json`, `npm link` to try it locally).
The extension is load-unpacked from `apps/extension` per its README.

## Versioning

FRAZIYM format `VPP.FF.BBB-STAGE-RR`. Defined exactly once in `src/version.ts`
(the current value is recorded in `CHANGELOG.md`); every surface imports it. `CHANGELOG.md` is the only
file allowed to repeat the literal. `npm run verify:version` enforces this.

## Principles

- Honest states: unbuilt tools say "planned"; refusals never consume quota; no dark patterns.
- Tokens: PAT for humans (all of `/api/v1`), Agent Access Tokens for agents (`/api/mcp` only),
  strict kind isolation. The dashboard is the only token factory.
- Ads: rewarded Boost only, MiniApp only, capped at 2/day. Paid tiers, PWA and extension
  never see ads.
- Neutral, minimal interface: light and dark themes, no gradients, no neon, no emoji.
