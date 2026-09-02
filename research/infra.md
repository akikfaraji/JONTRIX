# Free Infrastructure Tiers — Verification Report (Task 2-e)

**Prepared:** 2026-09-02 · **Method:** Official docs/pricing pages + corroborating sources via web search (~30 queries)
**Context:** $0-budget solo dev in Bangladesh building micro web tools + APIs + Telegram bots.

Confidence: ✅ = verified against official docs/pricing page · 🟡 = multiple credible secondary sources, official page not directly fetched · ⚠️ = changed recently / contested.

---

## 1. Cloudflare (Workers / Pages / KV / D1 / R2 / Queues / Cron)

| Item | What's free | Limits | Card required? | Gotchas |
|---|---|---|---|---|
| **Workers Free** | 100,000 requests/day (reset 00:00 UTC), 10ms CPU per invocation, 128MB memory, up to 100 Worker scripts | Daily hard cap — after exceeding, requests fail (HTTP 429-ish errors) until reset | ❌ No card | 10ms CPU is strict; DB/network I/O doesn't count but JSON parsing/crypto does. No Cron triggers quotas issue (see below); no Durable Objects w/ SQLite? (DO limited). Subrequest limits (50/req on Free). |
| **Pages** | Unlimited static requests/bandwidth; 500 builds/month, 1 concurrent build; Functions share Workers Free 100k req/day | 100 projects/account, 20k files, 25MB/file | ❌ No card | 500 builds/mo is the real constraint for CI-heavy workflows. Unlimited *bandwidth* officially (ToS §2.8 no video/proxy abuse). New users: Pages & Workers merged in dashboard. |
| **Workers KV** | 1,000 writes/day, 100,000 reads/day, 1GB storage (Free plan) | Daily resets | ❌ | Extremely low write allotment (1k/day) — never use KV for counters/state churn. |
| **D1 (SQLite)** | 5M rows read/day, 100k rows written/day, 5GB total storage/account (500MB per-DB max noted in some sources) | Daily resets | ❌ | JOINS multiply "rows read" fast — users have hit 5M/day just browsing their own site (Reddit). Design around single-row PK lookups. |
| **R2** | 10GB storage/mo, 1M Class A ops (writes/list)/mo, 10M Class B ops (reads)/mo, **$0 egress** | Free tier applies to Standard storage only | ❌ | Best free object storage anywhere due to zero egress; need card? No — but R2 requires enabling via dashboard with a payment method on some account states (🟡 verify at signup). |
| **Cron Triggers** | Included on Workers Free | Each run consumes the 100k req/day | ❌ | Minute-level granularity, reliable (unlike GH Actions cron). | 
| **Queues** ⚠️ UPDATED | **NOW FREE as of Feb 4, 2026**: 10,000 operations/day on Workers Free (was paid-only until then) | 10k ops/day; Paid: 1M ops/mo + $0.40/M | ❌ | Official changelog Feb 4, 2026. Before that (and per June 2025 community posts) Queues required Workers Paid — old blog posts are outdated. |
| **Web Analytics** | Free, unlimited, cookieless, no card | — | ❌ | Requires a JS beacon or CF proxy. No UTM-level funnels; basic but fine for micro-tools. |

**Sources:** developers.cloudflare.com/workers/platform/limits (checked 2026-09-02, doc dated Jul 2026); developers.cloudflare.com/d1/platform/pricing & /limits (Apr 2026); developers.cloudflare.com/r2/pricing (Aug 2026); developers.cloudflare.com/kv/platform/pricing & /limits (Apr 2026); developers.cloudflare.com/changelog/post/2026-02-04-queues-free-plan (Queues on Free!); cloudflare.com/plans/developer-platform; blazingcdn.com 2026 breakdown; eastondev.com CF checklist (May 2026); zerocoststartup.com (Oct 2025).

---

## 2. Vercel (Hobby)

| Item | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Hobby plan** | 100GB bandwidth/mo; 1M function invocations/mo (new "Custom Function Invocations" model); ~4 active CPU-hours; 1M edge requests; 360 GB-hr provisioned memory | Monthly | ❌ No card | **Non-commercial use only** — ToS forbids commercial projects on Hobby (they do enforce for obvious commercial sites). |
| **Cron Jobs** | Included but **Hobby: max once per day — hourly/minute expressions fail** (official docs, Jul 2026) | 2 cron jobs | ❌ | For sub-daily crons use GitHub Actions or external cron hitting a Worker/endpoint. |
| Deploy limits | 100MB max source upload via CLI (Hobby), 6000 deployments... build concurrency 1 | — | ❌ | Fluid Compute default now; invocations billing changed 2025. |

**Sources:** vercel.com/pricing; vercel.com/docs/plans/hobby (Aug 2026); vercel.com/docs/cron-jobs/usage-and-pricing (Jul 2026); temps.sh Vercel 2026; schematichq.com (Mar 2026). **Date checked:** 2026-09-02. ✅/🟡

---

## 3. Render / Fly.io / Railway (long-running app hosts)

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Render** | 750 free instance-hours/mo/workspace; free web services (512MB RAM, 0.1 CPU); free static sites; free Postgres **expires after 30 days** | Bandwidth on free tier cut to ~5GB/mo (2026 change ⚠️) | ❌ | **Spin-down after 15 min idle → cold start ~30-60s+**; free Postgres is throwaway (30-day expiry). Reddit: some free apps permanently suspended for low usage. |
| **Fly.io** | **No free tier** (removed 2024). New orgs = Pay As You Go; brief trial (🟡 ~2h trial compute or a small trial period) then billing | — | ✅ Card required for continued use | Effectively out of a $0 stack. Docs still reference legacy free allowances — ignore. |
| **Railway** | Trial: one-time **$5 credit / 30 days**, then must upgrade to Hobby ($5/mo) to deploy (trial reverts to limited Free plan without deployments) | ~500 execution hours equivalent; 512MB RAM/vCPU-shared services | ❌ no card for trial | Not sustainable free — good for 1-month burst only. |

**Sources:** render.com/docs/free; render.com pricing; render.com "real free tier" blog (Apr 2026); codecapsules.io Render 2026 changes (Jun 2026); fly.io/docs/about/pricing; community.fly.io threads; docs.railway.com/pricing/free-trial; railway.com/pricing; temps.sh Railway 2026. **Date checked:** 2026-09-02.

---

## 4. Serverless Databases

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Supabase** | 2 active projects; 500MB DB; 5GB egress; 50k MAU auth; 1GB file storage; 2 free edge-function invocations... | **Pause after 7 days of inactivity** (API requests reset the clock; paused projects keep data, manual restore) | ❌ | Biggest operational trap: a quiet side-project goes dark weekly. Fix: GitHub Actions heartbeat every ~3 days (officially acknowledged pattern). Paused projects don't count toward the 2-project limit. |
| **Neon** | ~100 CU-hrs/mo per project (doubled from 50 in Oct 2025), 0.5GB storage/project, up to ~10 projects, autoscale to 2 CU | **Autosuspend after 5 min inactivity → ~500ms-2s cold start** | ❌ | 0.25 CU × 24/7 ≈ 180 CU-hrs — a 24/7 always-on small instance **exceeds** 100 CU-hr allotment; keep autosuspend on, only pay compute while awake. GitHub discussion: compute not always fully zero when suspended. |
| **Turso** | 100 databases, 5GB total storage, **500M row reads/mo, 10M row writes/mo** (generous); 3 locations/DB | Monthly | ❌ | March 2025 "Developer plan" post kept free tier at 500M reads/10M writes. Some third-party 2026 pages show conflicting higher numbers (9GB/1B reads) — trust turso.tech/pricing: 100 DBs / 5GB / 500M reads / 10M writes. |
| **MongoDB Atlas M0** | Permanently free shared cluster: **512MB storage**, shared vCPU/RAM, up to 500 connections, 500 collections/100 DBs, 10GB-in/10GB-out rate limit window | No time limit, no pause | ❌ No card | No automated backups on M0; shared tier is slow under load; ops limits (~100 ops/sec practical on shared). |
| **Cloudflare Hyperdrive** | Included free with Workers (caching/pooling for external Postgres) | — | ❌ | Pairs well: Neon free + Hyperdrive from Workers. |

**Sources:** supabase.com/pricing; supabase.com/docs/guides/platform/free-project-pausing; neon.com/docs/introduction/plans; simplyblock.io Neon pricing (Jun 2026); turso.tech/pricing + turso blog (Mar 2025); mongodb.com/pricing + mongodb.com/docs/atlas/reference/free-shared-limitations; oneuptime.com (Mar 2026). **Date checked:** 2026-09-02.

---

## 5. GitHub (Actions / Pages / raw / API / Codespaces)

| Item | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Actions** | Public repos: **unlimited** minutes (standard runners). Private: **2,000 min/mo** (Free plan) | Linux 1x multiplier; macOS 10x, Windows 2x burn minutes faster | ❌ | 2026 change: $0.002/min platform fee on **self-hosted** runners (irrelevant at $0 scale). Scheduled workflows = free compute/cron engine for public repos. |
| **Actions as cron** | schedule: cron syntax, min interval **5 minutes** | ⚠️ OFFICIAL docs: schedule event "can be delayed during periods of high loads... high load times include the start of every hour." Community: 20-40 min delays common, drops & 8-14h drift reported; public-repo schedules disabled after 60 days of repo inactivity | ❌ | Best-effort only. Avoid :00 timestamps (offset crons), add retry/jitter; never use for precision (Telegram bots should use webhooks, not polling loops). |
| **Pages** | Free static hosting from repo: 1GB site, **100GB/mo soft bandwidth**, 10 builds/hr soft | Public repos free; private needs Pro | ❌ | "Soft" limits = email warning before throttle. Can't run server-side; use for docs/landing/tools. |
| **raw.githubusercontent.com** | Free file/JSON hosting w/ correct content-type issues (text/plain default — use jsDelivr CDN for proper types) | Rate limits apply to raw domain (🟡 dynamic/undocumented); jsDelivr (free, unlimited-ish, serves npm/GitHub w/ 50MB file cap) is the reliable front | ❌ | Don't build an API on raw — it's a file server, not a CDN API. |
| **REST API** | Unauthenticated: **60 req/hr per IP**; authenticated (PAT): **5,000 req/hr**; GitHub Apps: 15,000/hr (org) | Search API much lower (10/min auth) | ❌ | 60/hr unauth is brutal — always ship a PAT for backend scripts. |
| **Codespaces** | **120 core-hours/mo** (= 60 hrs on 2-core) + **15GB-month storage** for personal accounts | Storage billed while stopped | ❌ | Stops auto after 30 min idle; delete idle codespaces to save storage quota. |
| **Bot APIs / secrets** | Actions secrets, dependabot, issue bots free on public repos | — | ❌ | — |

**Sources:** docs.github.com/en/billing/concepts/product-billing/github-actions; github.com/pricing; github.blog changelog (Dec 16, 2025 — self-hosted runner fee Mar 1, 2026); docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits; docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api; docs.github.com/billing/.../about-billing-for-github-codespaces; github.com/features/codespaces. **Date checked:** 2026-09-02. ✅

---

## 6. Static Hosting (others)

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Netlify** ⚠️ | **300 credits/mo** (changed from legacy 100GB/300 build-min model). Bandwidth = 20 credits/GB → **~15GB effective bandwidth**; ~20 deploys | **Hard limit — sites pause/suspend when credits exhausted** until next cycle | ❌ | Major 2026 downgrade (netli.fyi Jul 2026; official docs "How credits work" Aug 2026). Users report sites staying paused even after reset. No longer viable as primary host for anything with real traffic. Legacy "100GB free" claims are outdated. |
| **Cloudflare Pages** | Unlimited bandwidth, unlimited requests (static), 500 builds/mo | See §1 | ❌ | Best free static host right now. |
| **GitHub Pages** | 100GB soft bandwidth | 1GB site | ❌ | Fine secondary. |
| **surge.sh** | Free unlimited publishes incl. custom domains on surge subdomain | SSL on custom domains paid; service in "limited preview" mode for pro ($30/mo) | ❌ | Long-neglected product; fine as a quick-deploy utility, not a pillar. |
| **itch.io** | Free game hosting — **not** suitable for web tools (games-focused, no custom domains) | — | ❌ | Skip. |

**Sources:** netlify.com/pricing; docs.netlify.com "How credits work" (Aug 2026); netli.fyi (Jul 2026); flexprice.io (Aug 2026); answers.netlify.com suspension threads (Jun-Jul 2026); surge.sh. **Date checked:** 2026-09-02.

---

## 7. Transactional Email

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Resend** | **3,000 emails/mo, 100/day**, 1 custom domain (🟡 some pages say 3 domains), 1 webhook | Daily cap is the real constraint | ❌ | Best DX for devs; onboarding/verification emails fit easily in 100/day. |
| **Brevo (ex-Sendinblue)** | **300 emails/day** (~9,000/mo), unlimited contacts | Daily only, no rollover | ❌ | Marketing+transactional in one; higher volume ceiling than Resend but weaker API/SMTP reputation historically. |
| **SendGrid** | ⚠️ **FREE PLAN RETIRED July 26-27, 2025** (was 100/day). Now 60-day trial only | — | ✅ | Legacy blog posts still recommending it are wrong. |
| **Mailgun** | ⚠️ Free tier (5000/mo legacy) discontinued for new signups; 30-day trial; from $15/mo | — | ✅ | Skip for $0 stack. |
| **EmailJS** | Free: **200 requests/mo, 2 templates** (client-side send, no server needed) | Small | ❌ | Only for static-site contact forms; not an API workhorse. |
| **SMTP2GO** | Free: 1,000 emails/mo, 200/day (their 2025 pitch as SendGrid replacement) | — | ❌ | 🟡 Decent backup sender. |
| **Amazon SES** | 3,000 msgs/mo free for 12 months from EC2/Lambda; otherwise $0.10/1k | Needs AWS account + card | ✅ card | Not truly $0-forever after 12 months, but effectively free for year 1. |

**Sources:** resend.com/pricing + resend.com/docs/knowledge-base/account-quotas-and-limits; help.brevo.com Free plan FAQ; twilio.com changelog (SendGrid free plan retirement, May 27, 2025 announcement; ended Jul 26-27 2025); mailercloud.com; lemmalegal.com (Aug 2025); smtp2go.com blog (Sep 2025). **Date checked:** 2026-09-02.

---

## 8. Cron / Scheduling

| Service | What's free | Limits | Gotchas |
|---|---|---|---|
| **GitHub Actions schedule** | Unlimited on public repos; 5-min min interval | High-load delays/drops; disabled after 60d repo inactivity; min 5 min | The best free cron for public repos; wrap critical jobs in retry + external watchdog. |
| **Cloudflare Cron Triggers** | Included free with Workers | Consumes the 100k req/day | Reliable (Cloudflare infra), minute-level. Preferred over GH Actions for bot heartbeats. |
| **cron-job.org** | Free: **unlimited number of cronjobs**, up to **once per minute** (official FAQ) | HTTP GET/POST to any URL | Beloved free external cron — good as an independent watchdog pinging your Workers. |
| **Upstash QStash** | Free: **1,000 messages/day** (raised 500→1000 at GA, Oct 2025 official blog); max 7-day delay on free | Scheduling + retries + callbacks as a service | The missing "queue/cron-as-API-call" for serverless. Some Apr 2026 articles still say 500/day — official GA blog says 1000. |
| **Vercel Cron** | Hobby: **once per day max** | 2 cron jobs | Too weak for real scheduling. |

**Sources:** docs.github.com/actions/using-workflows/events-that-trigger-workflows (schedule delay caveat); cron-job.org/en/faq; upstash.com/blog/qstash-qa (Oct 2025); upstash.com/blog/redis-new-pricing (Mar 2025); vercel.com/docs/cron-jobs/usage-and-pricing (Jul 2026). **Date checked:** 2026-09-02. ✅

---

## 9. Monitoring / Uptime

| Service | What's free | Limits | Gotchas |
|---|---|---|---|
| **UptimeRobot** | **50 monitors, 5-min interval**, HTTP/keyword/ping/port, status pages, no card | ✅ verified | ⚠️ Free plan positioned for "hobby and non-profit" — non-commercial wording (like Vercel). |
| **Better Stack** | **10 monitors**, free status page (pricing page verified) | ✅ | Nicer UI, fewer monitors. |
| **healthchecks.io** | **20 checks free**; Business plan free for OSS/nonprofits | ✅ | *Inverse* uptime (dead-man's switch): alerts when YOUR cron silently dies — pairs with GH Actions cron. |

**Sources:** uptimerobot.com/pricing + help.uptimerobot.com (Jun 2026); betterstack.com/pricing; healthchecks.io/pricing. **Date checked:** 2026-09-02. ✅

---

## 10. Auth

| Service | What's free | Limits | Gotchas |
|---|---|---|---|
| **Clerk** | **10,000 MAU free** (stable since Nov 2023; a Feb 2026 report claims 50k MAU free — 🟡 unconfirmed, treat 10k as safe planning number) | Pro $25/mo then $0.02/MAU | Best DX, generous free; verify current MAU at signup. |
| **Auth0** | **25,000 MAU free** (raised from 7,500 in Sep 2024, official blog) | Custom domains need card verification | Historically volatile pricing — re-check before committing. |
| **Supabase Auth** | **50,000 MAU** on free tier | Included with project (2 projects) | Best bundled value; shares the 7-day-pause gotcha. |
| **Firebase Auth** | **50,000 MAU free** (email/social/anonymous; Spark & Blaze) | Phone/SMS auth billed | Rock solid, forever-free, no pause risk; Google-backed. |

**Sources:** clerk.com pricing announcement (Nov 2023; saasprices.net Feb 2026 claims 50k); auth0.com/pricing + auth0.com/blog Sep 24, 2024; firebase.google.com/pricing + blog.logto.io (Jul 2026); supabase.com/pricing. **Date checked:** 2026-09-02. ✅/🟡(Clerk)

---

## 11. Analytics

| Service | What's free | Limits | Gotchas |
|---|---|---|---|
| **Cloudflare Web Analytics** | Free unlimited page views, cookieless | — | One beacon script per site; zero effort if already on CF. |
| **Google Analytics 4** | Free (360 is the paid tier) | — | GDPR/adblock friction; fine for BD audience. |
| **PostHog** | **1M analytics events/mo free** + 5,000 session replays + 1M feature-flag requests + 1,500 survey responses (official pricing page) | ✅ | Generous; usage-based after. |
| **Umami** | Self-host free (on Vercel/CF + free Postgres/MySQL) | Your infra's limits | Great GA alternative at $0; beware DB row limits (Neon 0.5GB / Supabase pause). |
| **Plausible** | ❌ No free tier (starts ~$9/mo) | — | Skip at $0. |

**Sources:** posthog.com/pricing; userpilot.com (Aug 2026); flexprice.io (Aug 2026). **Date checked:** 2026-09-02. ✅

---

## 12. Domains & DNS

| Option | Cost | Notes |
|---|---|---|
| **eu.org** | Free subdomain (yourname.eu.org) | Long-running, respected; approval takes **weeks-months**. |
| **is-a.dev** | Free subdomain via GitHub PR | Community-run, popular with devs; ~200k+ registrations. |
| **js.org** | Free subdomain for JS projects | Requires a real project/site first; manual review. |
| **DigitalPlat FreeDomain** (.dpdns.org / .us.kg / .qzz.io / .xx.kg) | **Free, open-source domain registry**, works with Cloudflare DNS (verified Aug-Oct 2025 buzz + Cloudflare community) | us.kg was shut down to new registrations at one point, then relaunched under domain.digitalplat.org. GitHub-profile KYC required. Reports of intermittent DNS delegation issues (May 2026). **Treat as bonus, never load-bearing.** |
| **.xyz / .top / .sbs first-year promos** | **~$1-2 first year**, then $10-15/yr renewal | Cheapest credible path: pay ~$1-2/yr; renewal is the real cost. |
| **Cloudflare Registrar** | At-cost (≈$10/yr .com) — no markup, **free DNS forever on any plan** | Requires using CF nameservers; card needed to buy, not to use DNS. |
| **SEO/trust risk of free subdomains?** | Minor for tools audience | Free subdomains (is-a.dev etc.) occasionally flagged in spam filters & some APIs reject them; **custom domain strongly recommended for anything handling OAuth callbacks, email sending (SPF/DKIM), or ad networks.** Email senders MUST have own domain (Resend/Brevo require custom domain for decent deliverability). |

**Sources:** domain.digitalplat.org; w3era.com (Aug 2025); themenonlab.blog (Jul 2026); community.cloudflare.com dpdns delegation thread (May 2026); reddit (Aug 2025). **Date checked:** 2026-09-02. 🟡

---

## 13. Telegram Bot API

| Item | What's free | Limits | Notes |
|---|---|---|---|
| **Bot API** | 100% free, no card, unlimited bots | **Official FAQ: ~30 messages/sec broadcast to different chats; 20 messages/min per group; 1 msg/sec per private chat** (429 + retry_after when hit) | Official core.telegram.org/bots/faq, stable for years. Note: one tdlib maintainer disputes a hard "30/sec" — treat as pacing guidance, honor retry_after. |
| **File API** | Download up to **20MB** via standard Bot API | Bots can't download >20MB (upload to bots 50MB) | For bigger files: proxy via R2 or use MTProto (user sessions). |
| **Webhooks vs polling** | Both free | Webhook needs HTTPS endpoint (CF Worker/Pages Function = perfect, free SSL); polling needs an always-on process — bad fit for serverless | Webhook on a Cloudflare Worker = the canonical $0 Telegram bot stack. |
| **Mini Apps** | Free; **HTTPS static hosting is sufficient** (initData validated client-side + server signature check) | — | Host Mini App frontends on CF Pages; validate Telegram initData HMAC in a Worker. |
| **Payments/stars** | Free to integrate | Revenue share on Stars | — |

**Sources:** core.telegram.org/bots/faq (official, checked 2026-09-02); grammy.dev flood-limit guide (Nov 2024). Confidence: high (limits stable for years). ✅

---

## 14. Edge data / queues (Upstash, CF)

| Service | What's free | Limits | Card | Gotchas |
|---|---|---|---|---|
| **Upstash Redis** | Free: **500,000 commands/month** (changed Mar 2025 from 10k/day), 256MB, 1 region, 10GB bandwidth | Monthly cap ≈ 16k commands/day avg | ❌ | Official blog Mar 2025. Cache-friendly design required; use CF KV for read-heavy, Redis for rate-limits/locks. |
| **Upstash Kafka** | Free tier exists (🟡 limited topics/partitions) | Small | ❌ | Rarely needed at $0 scale; QStash simpler. |
| **Upstash QStash** | Free: **1,000 messages/day** (GA Oct 2025), 7-day max delay | Schedules + retries + callbacks | ❌ | The missing "queue" for serverless. |
| **Cloudflare Queues** | ✅ **FREE since Feb 4, 2026**: 10,000 ops/day | Paid: 1M ops/mo included | ❌ | Verified via official changelog. |
| **Durable Objects** | Free tier includes DOs w/ SQLite storage (limited) 🟡 | — | ❌ | Great for rate limiters/coordination. |

---

## The $0 Reference Stack (synthesis)

- **Compute/API/Bots:** Cloudflare Workers (100k req/day) + Cron Triggers; GitHub Actions for heavy batch (public repos, unlimited).
- **Static/Mini Apps:** Cloudflare Pages (unlimited bandwidth) + GitHub Pages fallback.
- **DB:** D1 (5M reads/day) for edge SQL · Turso (500M reads/mo) for scale · Neon for real Postgres · Supabase only if auth+storage bundle needed (heartbeat cron mandatory) · Atlas M0 for Mongo.
- **Email:** Resend (100/day) + Brevo (300/day) as overflow — both need a custom domain for deliverability.
- **Cron:** CF Cron (reliable) > cron-job.org (external watchdog) > GH Actions scheduled (best-effort, unreliable timing).
- **Monitoring:** UptimeRobot (50 monitors, out) + healthchecks.io (20 checks, in, dead-man switch).
- **Queue:** CF Queues (10k ops/day, NEW free Feb 2026) or QStash (1k msgs/day).
- **Auth:** Supabase Auth (50k MAU) or Firebase Auth; Clerk for polish.
- **Analytics:** CF Web Analytics + self-hosted Umami.
- **Domain:** spend the $1-2/yr on a .xyz/.top — it unlocks email deliverability + OAuth + trust.

---
## Verification Ledger (searches run 2026-09-02)

| # | Topic | Status |
|---|---|---|
| 1 | Cloudflare Workers/Pages/KV/D1/R2/Queues/Cron/Web Analytics | ✅ official docs verified |
| 2 | Vercel Hobby (invocations, 100GB bw, cron 1/day, non-commercial) | ✅ |
| 3 | Render 750h/15-min spin-down/5GB bw (2026) / Fly no-free / Railway $5-30d trial | ✅ |
| 4 | Supabase (2 projects, 500MB, 7-day pause) / Neon (100 CU-hr, 5-min autosuspend) / Turso (500M reads, 10M writes, 5GB) / Atlas M0 (512MB, no card) | ✅ |
| 5 | GitHub Actions 2000 min private/unlimited public; schedule delays (official docs); Pages 100GB soft; API 60/5000 per hr; Codespaces 120 core-hrs + 15GB | ✅ |
| 6 | Netlify 300-credit hard cap (~15GB) ⚠️ / surge.sh free / CF Pages best | ✅ |
| 7 | Resend 100/day+3000/mo; Brevo 300/day; SendGrid free RETIRED Jul 2025; Mailgun trial-only; EmailJS 200/mo; SMTP2GO 1000/mo | ✅ |
| 8 | GH Actions cron unreliable; cron-job.org unlimited jobs/1-min; QStash 1000/day; Vercel cron 1/day | ✅ |
| 9 | UptimeRobot 50×5min; Better Stack 10; healthchecks.io 20 | ✅ |
| 10 | Clerk 10k MAU (50k claim 🟡); Auth0 25k; Supabase 50k; Firebase 50k | ✅/🟡 |
| 11 | CF Web Analytics free; PostHog 1M events; GA free; Umami self-host; Plausible paid-only | ✅ |
| 12 | DigitalPlat (.dpdns.org/.us.kg) free w/ Cloudflare; eu.org slow; is-a.dev/js.org; .xyz/.top $1-2 yr-1; CF registrar at-cost | 🟡 |
| 13 | Telegram: 30 msg/sec broadcast, 20/min group, 20MB bot download, webhook on Workers, Mini Apps = HTTPS static OK | ✅ |
| 14 | Upstash Redis 500k cmd/mo (Mar 2025 change); QStash 1000/day; CF Queues FREE 10k ops/day (Feb 2026) | ✅ |

*(~30 web searches; 3 failed/retried due to API 429 rate-limiting mid-session. All numbers dated 2026-09-02.)*
