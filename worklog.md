---
Task ID: 1
Agent: main (Super Z)
Task: FRAZIYM $1/day ecosystem — deep research & strategy mission. Executive PDF + XLSX opportunity database.

Work Log:
- Clarified requirements: Executive-depth PDF + full XLSX database; focus zones = repair/data, dev tools, e-commerce, underserved; safe-mix monetization; numbered citations; full visuals; rev-max selection bias; unlimited build hours.
- Loaded skills: pdf, xlsx, charts, web-search.
- Created research/ and scripts/ dirs.

Stage Summary:
- Plan: 7 parallel research agents -> synthesize 200+ problems -> XLSX -> charts/diagrams -> executive PDF -> QA -> deliver.
---
Task ID: 2-g
Agent: research-distribution-weird
Task: Research distribution channels (always-on) + evidence-based weird/neglected micro-tool markets for $0-budget BD solo dev.
Work Log:
- 30 successful z-ai web_search calls across both streams (~5 extra attempts failed with 429 rate limits; retried after cooldowns). All claims URL-sourced; weak signals marked E3.
Stage Summary:
- Wrote research/distribution-weird.md: Stream A = 10 channel fact blocks (pSEO case studies + 2024 HCU/site-reputation-abuse risk; PH one-day spike reality 487/500-dead counterpoint; 260+ free directories; CWS review delays + weak discovery; Telegram Mini Apps: 75k apps, $1B volume, Stars + AdsGram/Monetag, tap-to-earn churn lesson; GitHub/Pages/awesome-lists; Reddit 9:1 rule; Kapwing watermark case study; embeddable-widget backlink pattern (Keywords Everywhere); new-domain SEO 3-12mo reality; student word-of-mouth via free/no-signup).
- Stream B = 25 rows (G1-G25, 21 evidence-backed E1/E2 + 4 labeled E3 hypotheses): top weird-gold = G4 hallucinated-citation batch verifier (sev 9, no free incumbent), G9 irregular-payment rent ledger w/ court-ready PDF (template sales prove WTP), G5 student writing-provenance trail vs AI-detector false positives (sev 9), G11 church announcement-slide generator (weekly recurring, output projected publicly = viral loop; mosque adjacent E3), G17 Telegram BCS quiz bot for BD, G6 AI-slop linter, G8 ChatGPT export cleaner. Cross-cutting: G20 spreadsheets-as-products meta-pattern (Etsy template sales = validated WTP).
---
Task ID: 2-d
Agent: research-ai-providers
Task: Verify 2025-2026 free tiers/limits/ToS of AI inference providers for $0 multi-provider router.
Work Log:
- ~22 web searches (z-ai CLI; several 429-throttled, retried with backoff) + ~15 direct page fetches (page_reader + curl fallback) of official docs.
- Official pages parsed: Groq rate-limits/billing-FAQ, Gemini rate-limits + pricing, OpenRouter limits + FAQ, Cerebras pricing + rate-limits, Together serverless models, HF Inference Providers pricing, Cloudflare Workers AI pricing, Cohere rate-limits, SambaNova rate-limits, DeepSeek pricing, GitHub Models docs.
- Output written to research/ai-providers.md (all 15 items + cost-economics table + ToS flags), date-checked 2026-09-02.
Stage Summary:
- Verified-official: Groq free (30 RPM/1K RPD/8K TPM gpt-oss+qwen, whisper 2K RPD & 28.8K audio-sec/day, no card); OpenRouter :free (20 RPM, 50 RPD, 1000 RPD after $10 credits); Cloudflare Workers AI 10,000 Neurons/day free; Cohere trial 1,000 calls/mo @20 RPM; SambaNova free 20 RPM/20 RPD/200K TPD (no card needed); Gemini free tier exists but data-used-for-training=YES and limits no longer public.
- Biggest surprises: (1) GitHub Models fully RETIRED July 30, 2026; (2) Cerebras killed permanent free tier — now $5/30-day trial credits; (3) Together AI $25 signup credit retired, min $5 prepay, free Llama endpoints dead; (4) Gemini free RPD slashed ~250→20 (Dec 2025, no public table anymore); (5) HF free now only $0.10/mo credits; (6) Groq free lineup swapped Llama→gpt-oss/Qwen. Paid floor for comparison: DeepSeek V4 Flash $0.22/$0.66 per 1M (off-peak), Gemini Flash-Lite $0.25/$1.50, GPT-4o-mini $0.15/$0.60.
- Next actions: treat free providers as disposable (failover), single account per provider (multi-accounting prohibited/futtle), prefer caching (Groq/Cerebras exclude cached tokens from limits), verify Gemini exact RPD inside AI Studio at build time.

---
Task ID: 2-a
Agent: research-data-repair
Task: Research real, evidence-backed user pain in file/data/document repair & conversion domain for solo-dev micro-tools strategy.
Work Log:
- Read worklog (prior: main agent plan for 7 parallel research agents).
- Ran 20 z-ai web_search queries (2 rate-limit retries): CSV misalignment/encoding/row-limit, Shopify+WooCommerce import failures, JSON repair + large JSON/JSONL, PDF table extraction / OCR / Acrobat pricing / form-flatten, subtitle sync/encoding/VTT-dedup/QC (CPS-CPL), bank statement PDF→CSV/QBO/OFX, invoice extraction pricing (Docsumo/Rossum/Parseur/Lido), FBI converter-malware warning, fuzzy duplicates, merged cells, JSON↔CSV flatten, receipt entry.
- Wrote /home/z/my-project/research/data-repair.md (28 problem rows + 18 verified FACTS + pattern notes + method note).
Stage Summary:
- 28 rows found (7 E2-backed pricing/limit facts; 26 rows E1 direct community evidence; 2 E3 partial-inference rows marked as such).
- Highest-pain: (1) bank statement PDF→CSV/QBO — desperate posts, whole subreddit r/AccountingFiles, price umbrella $40–$300/mo (DocuClipper $49.95/mo, MoneyThumb $299.95) but needs-AI; (2) Shopify "CSV import hell" 2-3h per supplier update; (3) Excel 1,048,576-row silent data dump on big CSVs; (4) Excel silently stripping leading zeros/dates from CSVs; (5) PDF→Excel table scrambles; (6) FBI-verified fear of online converters = "client-side, files never uploaded" trust wedge.
- Key discovery: biggest $0-infra opportunity = deterministic client-side (WASM/JS) repair tools (CSV delimiter/encoding/rowsplit, JSON repair, VTT dedup, SRT offset, PDF flatten/split) + programmatic SEO on exact error messages; avoid AI-heavy document AI (cost floor).

---
Task ID: 2-e
Agent: research-infra
Task: Verify 2025-26 free tiers of hosting/infra services for $0 stack (hosting, DB, email, cron, monitoring, auth, analytics, domains, Telegram, queues).
Work Log:
- ~30 web searches via z-ai CLI (3 failed/retried on 429 rate-limit; spaced out with waits). Official docs/pricing pages prioritized; all findings dated 2026-09-02.
- Wrote research/infra.md: 14 verified sections + confidence ledger + $0 reference stack.
Stage Summary:
- KEY VERIFIED LIMITS: CF Workers 100k req/day 10ms CPU; Pages unlimited bandwidth/500 builds; KV 1k writes/day; D1 5M reads/day 100k writes/day 5GB; R2 10GB/1M ClassA/10M ClassB $0 egress; Queues NOW FREE 10k ops/day (Feb 2026 changelog). Vercel Hobby 100GB + 1M invocations but NON-COMMERCIAL + cron max 1/day. Render 750h + 15-min spin-down + free PG 30-day expiry; Fly.io NO free tier; Railway $5/30-day trial only. Supabase 2 projects/500MB + PAUSE after 7 days idle (heartbeat cron mandatory); Neon 100 CU-hr/mo + 5-min autosuspend (24/7 0.25CU would exceed); Turso 500M reads/10M writes/5GB/100 DBs; Atlas M0 512MB no-card. GitHub: Actions unlimited public/2000 min private, scheduled workflows BEST-EFFORT (official delay warning, 60-day disable), Pages 100GB soft, API 60/5000 per hr, Codespaces 120 core-hrs+15GB. Netlify DOWNGRADED to 300 credits (~15GB) hard cap — dropped from $0 stack. Email: Resend 100/day+3000/mo, Brevo 300/day, SendGrid free RETIRED Jul 2025, Mailgun trial-only, EmailJS 200/mo. Cron: cron-job.org unlimited jobs @1-min, QStash 1000 msgs/day, CF Cron reliable. Monitoring: UptimeRobot 50x5min (non-commercial wording), Better Stack 10, healthchecks.io 20 (dead-man switch). Auth: Clerk 10k MAU (50k claim unverified), Auth0 25k, Supabase/Firebase 50k MAU. Analytics: CF Web Analytics free, PostHog 1M events. Telegram: 30 msg/sec broadcast, 20/min per group, 20MB bot download, webhook-on-Worker canonical, Mini Apps = HTTPS static OK. Upstash Redis 500k cmd/mo (Mar 2025 change). Domains: DigitalPlat (.dpdns.org/.us.kg) free w/ CF DNS; .xyz/.top $1-2 yr-1; custom domain REQUIRED for email deliverability/OAuth trust.
- Architecture impact: anchor everything on Cloudflare (Workers+Pages+D1+R2+KV+Queues+Cron, no card), Turso/Neon as DB depth, Resend+Brevo dual email, healthchecks.io as watchdog, GH Actions only for tolerant batch jobs.

---
Task ID: 2-c
Agent: research-ecom-smb
Task: Research evidence-backed pain in e-commerce product data + SMB document workflows for $0-budget BD solo dev.
Work Log:
- Read worklog (prior: main plan; agents 2-g, 2-d, 2-a, 2-e done; avoided duplicating 2-a's bank-statement depth, cross-referenced instead).
- Ran 23 z-ai web_search calls (0 hard failures; no 429 encountered) covering: Shopify CSV variants/images/encoding/metafields, supplier-feed sync apps, Amazon flat files + 8541, Etsy bulk-upload limits + Etsy→Shopify migration, eBay/Walmart/TikTok templates, Google Merchant Center + Meta catalog disapprovals, feed-tool pricing, background-removal costs, listing translation, multichannel inventory, invoices/QBO/Wave/Zoho/Dext/receipts, payment↔order reconciliation, invoice chasing, WhatsApp/BKash Global-South commerce, trades quoting tools.
- Wrote /home/z/my-project/research/ecom-smb.md: 31 problem rows (C1-C31; 24 E1-backed, 6 E2/E1-mixed, 1 E3-labeled) + 14 FACTS (F1-F14) + 6 cross-cutting patterns + honesty notes.
Stage Summary:
- Highest-severity finds: C21 subset-sum invoice↔payment matching ("47 invoices on a Saturday", UPI angle) = deterministic solver, no incumbent free tool; C29 WhatsApp-order chaos (20-30 msgs/day, notebook/Excel) = chat-export→orders-CSV tool avoids WhatsApp-API ban/cost issues entirely; C1 supplier-CSV→Shopify hell (2-4h per restock, multiple E1 threads); C9 "Amazon flat file formatting is hell" (own thread title); C7 multichannel overselling (tools want $50+/mo); C15 GMC mass disapprovals (530 products misflagged).
- Key discoveries: (1) every marketplace's rigid template spawns a validator/fixer niche — one client-side pre-flight engine × 6 platform profiles = programmatic-SEO goldmine (pairs with 2-a pattern); (2) Zoho Invoice is free-forever + Wave free (US/CA) → generic invoice generation is a DEAD end; only local-format (VAT/Mushak/GST/e-invoice) angles live; (3) "shady converter websites" trust quote = privacy/client-side wedge re-confirmed; (4) Etsy CSV export lacks variant prices — official Etsy→Shopify migration breaks pricing (E1) = sharp deterministic tool; (5) price umbrellas: DataFeedWatch $59-64/mo, Matrixify $20-200/mo, WP All Import $99-229/yr, Dext $13-20.50/mo or $0.32/doc (official), remove.bg ~$12/40cr (reported).
- Next actions: synthesis should merge C-rows with 2-a's A/B-rows under "deterministic client-side data toolkit" umbrella; flag C21+C29 as top product candidates; C28 marked E3 (BD bKash gap inferred, needs validation).
---
Task ID: 2-f
Agent: research-payments
Task: Verify 2025-26 monetization/payout rails for BD dev with no bank/card (bKash/Nagad/Rocket/crypto only); fees, minimums, KYC, legality.
Work Log:
- ~38 z-ai web_search queries (a few 429s; retried with sleeps via scripts/search.sh) + reuse of 9 cached prior searches in scripts/s_*.txt; all claims URL-sourced and dated 2026-09-02.
- Verified official/first-party pages: telegram.org (ads rev-share), bkash.com (Payoneer integration, remittance, cash-out fees), payoneer.com, adsgram.ai/monetization, nowpayments.io/pricing, coingate.com/pricing, docs.lemonsqueezy.com, help.ko-fi.com, help.buymeacoffee.com, gumroad.com/help, stripe.com/global, okx/bybit/binance P2P + affiliate pages, ezoic support KB, adsterra blog.
- Wrote research/payments.md: legal baseline + 12-rail ledger (Works?/KYC/mins/fees/timeline/risk/sources/confidence) + 6 fee chains + ranked verdict.
Stage Summary:
- WORKS (no bank/card): crypto affiliate USDT (Bybit/OKX/Binance, ~2% total via P2P→bKash = cheapest chain); Telegram Stars→Fragment→GRAM→USDT→P2P→bKash (~4-5%, 21-day hold, 1,000-Star/$13 min, $0.013/Star payout rate); AdsGram mini-app ads (USDT-TON, $100 min); Adsterra USDT-TRC20 ($100 min crypto — the famous $5 min is WebMoney/Paxum only, NOT crypto); Paddle→Payoneer→bKash (3%+$1, min BDT 1000, cap BDT 250k/tx — only mainstream SaaS checkout open to BD); NOWPayments (0.5-1.5%, 0% withdrawal) / BTCPay (free, BTC-only) as accept-payment rails; direct MTO remittance→bKash (WU/MoneyGram/ACE/Taptap, +2.5% govt incentive, 0.7% ATM cash-out — cheapest per-dollar but compliance grey area for client fees).
- BROKEN: Google AdSense (BD = wire-to-bank only; WU Quick Cash dead), Stripe & PayPal (BD unsupported), Gumroad (needs BD bank or PayPal), Payhip/Ko-fi/BuyMeACoffee/Patreon/LemonSqueezy (Stripe/PayPal dependent), Payoneer→bank (no bank).
- Biggest gotchas: crypto is a Bangladesh Bank grey zone (FERA 1947; real risk = MFS wallet freezes from many small P2P credits, not prosecution); Binance lists BD restricted (Mar 2025 stricter P2P KYC, Cash Zone closed) — prefer Bybit/OKX P2P (0% fee, bKash/Nagad/Rocket listed); Fragment KYC mandatory for purchases since Nov 2024, withdrawal-KYC reports mixed; USDT/BDT P2P rate 122-124 vs official 119.9 = +2-3.5% FX bonus; Toncoin renamed GRAM 1:1 (Jun 15, 2026); Telegram channel-ads 50% rev share (≥1k subs) NOT officially confirmed for BD — check in-app toggle, AdsGram is fallback.
---
Task ID: 3
Agent: main (Super Z)
Task: Export phase-1 research findings; developer-tooling stream deferred to next session.

Work Log:
- Verified all 6 research files intact after session restart (1828 lines total).
- Read ai-providers.md + data-repair.md in full; confirmed row formats in all other files.
- Assembled consolidated export: download/FRAZIYM_Research_Export_Phase1.md (1791 lines, all 6 streams + header/evidence legend).

Stage Summary:
- Phase-1 research corpus: 28 problems (data-repair) + 31 (ecom-smb) + 25 (distribution-weird) + 15 AI providers + 16 infra sections + 12 payment rails, all evidence-graded with URLs.
- Next: developer tooling research (2-b), then synthesis -> 200+ problem XLSX + executive PDF.
---
Task ID: 4
Agent: main (Super Z)
Task: Developer tooling research (Task 2-b) — completed via direct atomic batch execution.

Work Log:
- 17 web searches total (6 pre-degradation + 11 via scripts/devtools_batch.sh atomic batch with retries).
- Wrote research/devtools.md: 20 problem rows (B1-B20, 12 E1, 6 E2, 2 E3-labeled needing validation) + 14 verified pricing facts + cluster synthesis.
- Regenerated download/FRAZIYM_Research_Export_Phase1.md including Section 7 (devtools).

Stage Summary:
- KEY FINDS: Postman free-tier gutting (Feb 2026) = timed migration-search window; SQL dialect conversion = paying high-stakes audience (rev-max candidate); large-JSON crash pain = client-side WASM wedge; MCP tooling gaps = early explosive upside; CORS pain = biggest traffic pool.
- Downgrades recorded: tunnels (bandwidth cost), regex head-on (regex101 moat), JWT (saturated).
- ALL 7 RESEARCH STREAMS NOW COMPLETE. Next: synthesis into 200+ problem database -> XLSX -> PDF.
---
Task ID: 5
Agent: main (Super Z)
Task: Record NEW STRATEGIC DIRECTIVE from founder + begin synthesis phase.

Work Log:
- Founder directive (verbatim intent): "This infrastructure the whole system will be one product. With many tools as many as we can so if a person needs a tool even if that tools has one use a month or less he gets it. And you should also plan the pricing and profit based on user plan or subscription and things plus not undersell or underprise any tools."
- Decision locked: ONE PRODUCT, MANY TOOLS (mega-toolbox platform model):
  (1) Tool count maximized — long-tail tools with <=1 use/month are INCLUDED (long-tail aggregation economics, not per-tool ROI);
  (2) Pricing/profit planned per USER PLAN / SUBSCRIPTION TIERS, not per-tool sales;
  (3) NO UNDERPRICING — value-anchored pricing: per-tool replacement cost (DocuClipper $49.95/mo, DataFeedWatch $59/mo, Postman $14/user/mo, iLovePDF/PDF class $4-12/mo) justifies bundle price at market-mid; free tier = hooks only, real work behind PRO.
- Impact on synthesis: scoring now evaluates each tool's contribution to the PLATFORM (hook/glue/pro/ltv role + tier_fit) IN ADDITION to the fixed 10-dim weighted score (Demand 20/Pain 15/Freq 10/Automation 15/Monetization 10/Distribution 10/Competition 5/Infra 5/Ecosystem 5/Defensibility 5).
- Impact on deliverables: XLSX gains tier_fit + platform_role columns; PDF restructured as "One Product, N Tools" subscription platform plan with pricing/profit tiers; revenue scenarios modeled on subscriber counts x tiers, not per-tool sales.

Stage Summary:
- Product model = subscription mega-toolbox. All downstream artifacts (opportunities DB, XLSX, charts, PDF) must follow this frame.

---
Task ID: 5-b
Agent: main (Super Z)
Task: Synthesis — build 200+ opportunity database with 10-dim weighted scoring under One-Product model.

Work Log:
- scripts/parse_research.py: parsed 4 problem streams (2 formats) -> research/base_rows.json (104 rows; DR-*/EC-*/DV-*/WG-* prefixes to avoid ID collisions; field aliases + combined EvidenceLevel|Frequency|Severity lines handled).
- scripts/gen_catalog.py: 144 generated long-tail tool rows across 16 families (JSON/CSV/PDF/SUB/FIN/MKT/OPS/API/SQL/CFG/TXT/SEC/IMG/EDU/WG/TG) per "One Product, Many Tools" directive (even <=1 use/month tools included).
- scripts/build_opportunities.py: 10-dim weighted scoring (Demand .20/Pain .15/Freq .10/Automation .15/Monetization .10/Distribution .10/Competition .05/Infra .05/Ecosystem .05/Defensibility .05) + ~85 curated overrides mapped after verifying base-row titles; platform_role (HOOK/GLUE/PRO/LTV) + tier_fit (FREE/PRO/MAX) per subscription model.
- Output: research/opportunities.json = 247 rows x 38 fields (79 E1 / 15 E2 / 153 E3-inherited).

Stage Summary:
- TOP ROWS: DR-C3 Acrobat-subscription outrage 8.20 (= toolbox thesis evidence); DR-F1 bank-statement PDF->CSV 8.03 (flagship LTV); GT PDF-table-extractor 7.75; DR-D2 tool-stitching meta-pain 7.67 (= toolbox thesis); WG-G4 citation verifier 7.60; EC-C21 invoice matcher 7.58; DV-B1 large JSON 7.58; EC-C29 WhatsApp orders 7.55; DV-B10 SQL dialect 7.40.
- Cluster averages: Data&Repair 6.87 > Ecom 6.44 > DevTools 6.23 > Telegram/BD 6.09 > WeirdGold 5.94 > Media 5.87 > Text 5.77.
- Role mix: HOOK 53 / GLUE 97 / PRO 65 / LTV 32. Tier mix: FREE 155 / PRO 79 / MAX 13.
- Next: XLSX -> charts -> executive PDF (all under One-Product-Many-Tools subscription frame).

---
Task ID: 6
Agent: main (Super Z)
Task: Produce and QA all final deliverables (XLSX + charts + executive PDF).

Work Log:
- XLSX: scripts/build_xlsx.py -> download/FRAZIYM_Opportunity_Database.xlsx (10 sheets: README, Opportunities 247 rows filterable w/ color scales + autofilter, Top 50, Clusters, Pricing Model, Revenue Scenarios w/ live formulas, Payment Rails, Free Infra, AI Providers, Review). QA: recalc 0 errors, audit 0, scan 0, validate exit 0; Review sheet ALL PASS (fixed 3 caught bugs: price-row offset, Clusters ref, scenario ref; zone taxonomy canon to 7 zones).
- Charts: scripts/make_charts.py (top20_ranking, zone_stats, revenue_scenarios, pricing_value) + Playwright+CSS Layout C diagrams (ai_router, ecosystem_map) + 2 PDF-specific variants with enlarged fonts for A4 legibility. All visually verified zero-overlap, titles fixed after clipping check.
- PDF: full skill chain read (report.md + fonts.md + cover.md + overflow/pagination/typography/palette/charts/fill-engine). Cover = Template 07 Crystal Blue (html2poster.js, cover_validate PASS). Body = ReportLab TocDocTemplate multiBuild, FreeSerif 10.5pt, roman TOC + arabic body numbering, safe tables (Paragraph-wrapped, proportional widths), 6 embedded figures, 48 numbered references. Fixes during QA: font paths (variable NotoSansSC skipped), cover page-size normalize (<0.1pt tolerance), em-dash line-start binding, T_weird ID column width. Final: pdf_qa --skip-cover = PASS all checks, font.check 0, toc.check clean.

Stage Summary:
- FINAL DELIVERABLES in /home/z/my-project/download/:
  1. FRAZIYM_Executive_Report.pdf (22 pages, 18 sections, One-Product-Many-Tools subscription model, 4-tier pricing $0/$4.99/$9.99/$19.99, 5 revenue scenarios, 90-day roadmap, brutal-honesty verdict, 48 refs)
  2. FRAZIYM_Opportunity_Database.xlsx (10 sheets, 247 scored rows)
  3. charts/ (8 PNGs)
  4. FRAZIYM_Research_Export_Phase1.md (2,106 lines, 7 streams)
- MISSION COMPLETE.

---
Task ID: 7
Agent: main (Super Z)
Task: Project naming — propose a super-unique name, collision-verified via live search + DNS probes.

Work Log:
- Ran 4 z-ai web_search collision checks via scripts/search.sh (JONTRIX, TOOLDEX, EKTAKA, AUTODHAN; 1 batch timed out on retries, evidence still sufficient).
- DNS-probed jontrix.com/.app/.io, autodhan.com — all NXDOMAIN (unregistered).

Stage Summary:
- VERDICT: JONTRIX (from Bengali যন্ত্র "jontro" = machine) = recommended product brand. Zero SaaS/tech collision (only a SoundCloud account + transient KPop-Demon-Hunters fan-trend noise); all 3 TLDs unregistered.
- REJECTED with evidence: TOOLDEX (tooldex.org/.co/.io all live, same exact concept), EKTAKA (ektaka.com live in BD launch market + Bidyanondo charity phrase). AUTODHAN = clean runner-up (search engine couldn't even resolve the term; domain unregistered).
- Proposed architecture: FRAZIYM = founder/maker brand -> JONTRIX = product -> each micro-tool = a "Jont" -> tiers JONTRIX Free/Pro/Studio.
- Deliverables NOT rebranded yet (awaiting founder confirmation). Rebrand path: persisted scripts (build_pdf.py, build_xlsx.py, make_charts.py, build_export.sh) make it a one-pass rename.

---
Task ID: 8
Agent: main (Super Z)
Task: Apply founder corrections to JONTRIX spec — (1) contracts-only style, (2) MCP redesign around /api/mcp/login + jontrix-gateway with PAT/AAT; write VOL-01 and VOL-10.

Work Log:
- VOL-00 (spec/00-agent-protocol.md) edited: "Reference implementations / complete code listings" file type REPLACED with behavioral-spec + LOCKED "contracts, not code" writing rule (snippets capped at 5 lines); Phase 5 rewritten to Stars+USDT hard-wired (Paddle = documented FALLBACK only); Phase 8 rewritten to gateway-based exit (PAT + AAT through jontrix-gateway); packages/gateway/ added to LOCKED repo layout.
- VOL-01 (spec/01-product.md, 196 lines) written: §1 product definition (247-Jont mega-toolbox, tier ladder Free/$0·Pro/$4.99·Studio/$9.99·Max/$19.99 matching published report); §2 personas + 4 LOCKED surfaces (PWA, Mini App, Extension, MCP-via-gateway); §3 five product invariants; §4 entitlements: Plan/Limits/Entitlement TS contracts, §4.2 tier matrix (155/234/234/247 Jont unlocking, MCP quotas 100/2k/10k/100k per month, AAT limits 1/3/10/∞), §4.3 UTC quota semantics + atomic check-and-increment, §4.4 honest client-side gating + downgrade keeps data; §5 rails: Stars ladder 400/750/1500 (net $0.013/Star math, monthly-only) + USDT via NOWPayments (monthly+annual ×10) HARD-WIRED, Paddle=FALLBACK, AdsGram default-OFF; §6 load model S0/S1/S2 vs CF free caps + 80%/95% hard-brake contract; §7 non-goals; §8 twelve acceptance tests (T1.1–T1.12).
- VOL-10 (spec/10-mcp-gateway.md, 273 lines) written to founder's new architecture: /api/mcp/login front door asks for PAT or AAT (paste-path works signed-out); jontrix-gateway installable from npm + PyPI + GitHub binaries, logs in once (device flow / paste-token / CI env), talks to MCP from then on via stdio bridge; §2 token taxonomy jx_pat_/jx_aat_/jx_sess_ opaque+hashed, AAT cannot manage tokens; §4 full route table + request/response contracts (device issue/poll, tokens CRUD, tools ETag catalog, call pipeline, quota, single-use refresh w/ family revocation, well-known manifest) + 10-row error map; §5 gateway contract (P0 verb parity across all 3 builds, keyring→0600 fallback, exit codes 0–6, 3 TTL caches, <300ms spawn, zero telemetry, no auto-update); §6 four D1 tables (mcp_tokens, mcp_device_codes, mcp_usage_daily, mcp_idempotency); §7 metering + advisory pre-flight; §8 ten security invariants; §9 connect writers for 6 MCP hosts; §10 fourteen acceptance tests (T10.1–T10.14) + DoD hooks G-31..33.
- Compliance check: zero function bodies/implementations in either volume; fenced blocks = 1 TS contract block (VOL-01), ASCII diagram + regex + scope contract + 3 JSON/TOML shape examples ≤5 lines (VOL-10).
- Copied to download/spec/ as JONTRIX_SPEC_VOL-00/01/10 (user-facing).

Stage Summary:
- Spec style is now contracts-only by LOCKED rule; every future volume (02–09, 11–15) must follow it.
- MCP surface re-architected to founder spec: /api/mcp/login (PAT/AAT) + jontrix-gateway (npm/pip/binaries) as the sole canonical client path; remote Streamable-HTTP /mcp exists only as undocumented advanced path.
- Tier ladder canon: Free/Pro/Studio/Max at $0/4.99/9.99/19.99; Stars 400/750/1500 monthly-only; USDT monthly+annual ×10.
- Remaining volumes to write: 02 (research digest), 03 (monorepo/data), 04 (schema), 05 (platform core), 06 (billing), 07 (PWA), 08 (bot/MiniApp), 09 (extension), 11 (runtime), 12 (top-50 cards), 13 (long-tail catalog), 14 (DoD/ops), 15 (ledgers).

---
Task ID: 9
Agent: main (Super Z)
Task: Write ALL remaining spec volumes (02-09, 11-15) in contracts-only style + integrate founder's custom FRAZIYM versioning system.

Work Log:
- VOL-00 §0.7 added (LOCKED): FRAZIYM versioning VPP.FF.BBB-STAGE-RR — full format spec, 4 canonical examples as parser fixtures, bump precedence PP>FF>BBB>RR (RR counts publications within current (generation, stage) pair — derived from founder's examples), stable omits stage+RR, single source src/version.ts (repo layout updated), CI version-hygiene grep (regex may appear ONLY in src/version.ts + CHANGELOG.md), npm/PyPI derivation mapping V00.01.003-beta-04 → 0.1.3-beta.4.
- Hand-authored volumes (contracts-only, no implementations): VOL-02 research digest (7 streams, frozen numbers, constraint memory, rejections); VOL-03 workspace/environments/config+secrets (7-secret inventory)/deploy topology/workspace conventions/version integration; VOL-04 data layer (14 D1 tables as column contracts incl. usage_ledger (platform events) vs jont_usage (per-call), KV/R2 layout, 2 migrations, seeds, verify-db contract); VOL-05 platform core (envelope contract, route table, auth, entitlements middleware with atomic check-and-increment, AI router §5 per C7, rate limiter/cache, 3 health endpoints, 15-code error taxonomy incl. all VOL-10 codes); VOL-06 accounts/billing (Telegram widget + email OTP, Stars 4-step checkout, NOWPayments IPN, entitlement sync state machine with stacking windows, webhook 5-step security, §7 payout runbook — one-batch monthly P2P conversion for freeze-avoidance, 10 acceptance tests); VOL-07 PWA (SW contract, one Jont page template ×247, engine loader, streaming worker pipeline + chaining, programmatic SEO, entitlement hooks, 8 tests); VOL-08 bot/MiniApp (7-command surface, initData validation, Stars UX, receipts/broadcasts, 8 tests); VOL-09 extension MV3 (minimum permissions, background worker, context menu, server-Jont proxy incl. SSRF guard, store listing, 8 tests); VOL-11 runtime (deterministic-before-AI law, manifest contract, validate→transform→emit, 5 pattern contracts (converter/validator/generator/extractor/fixer) + invariants, AI fallback rules, acceptance-row + performance-budget contracts).
- Generated volumes via persisted scripts/gen_vol12_13.py from frozen opportunities.json: VOL-12 (574→784 lines, 50 cards: J001-J010 curated as EXACTLY one Jont per pattern×context cell — full 5×2 coverage + DV-B3/DV-B5 Phase-7 mandates at J005/J010, DV-B5 natural rank 87 documented, EC-C15 swapped to J051; J011-J050 strict score order; tier mix 27/19/4) and VOL-13 (197 long-tail rows in 7 cluster batches by avg score desc + seed contract; 43 ugly mechanical names overridden). spec/catalog/jonts.seed.json: 247 rows (jont_id, src_id, slug, name, pattern, context, tier_fit, role, score, mcp_exposed, context_note, seo, faq×3).
- Generator QA: tier counts all-247 = 155/79/13 exactly matches frozen file (VOL-04 §6 check 4 will pass); 247 unique slugs; coverage assertion enforced in script.
- VOL-04 §6 amended: context mismatches allowed only via seed context_note (exactly DV-B3, DV-B5 server-side mandates).
- VOL-14 DoD (40 grouped G-checks incl. gateway hooks G-31..33 + versioning G-37..40), CI §3.1/§3.2 (preview-first, version-hygiene in CI, tag = FRAZIYM version), qa_gate.sh contract, backup/restore drills, cron inventory + watchdog + dead-man switch, incident runbook 3 severities, launch checklist + 90-day roadmap, §9 release management (4-command release procedure, stage transitions founder-announced, all artifacts report identical VERSION).
- VOL-15 ledgers: decision (append-only, one row per AGENT CHOICE), evidence (claim→source→grade→date, staleness recheck), payout (monthly reconciliation, one-batch rule visible), incident (3-sentence post-mortems, no-incident months get a row), registry (frozen-score discipline, checksum before/after), maintenance (C4 10-min/week proof; consequence automatic).
- All 16 volumes + catalog/jonts.seed.json copied to download/spec/JONTRIX_SPEC_VOL-*.md.

Stage Summary:
- THE COMPLETE JONTRIX BUILD SPECIFICATION NOW EXISTS: 16 volumes (00-15), ~2,200 lines of contracts/behavioral specs + machine-readable 247-Jont seed; zero implementations (contracts-only rule enforced throughout).
- FRAZIYM versioning canon: src/version.ts single source, VPP.FF.BBB-STAGE-RR, launch targets V01.00.000 stable; every surface/health endpoint/CHANGELOG reports the same string.
- MCP architecture canon (founder-mandated): /api/mcp/login (PAT/AAT paste or sign-in) + jontrix-gateway (npm/PyPI/binaries) device-flow login, stdio bridge, keyring, quota pre-flight.
- Spec is now build-ready for an autonomous agent; cross-references verified (VOL-00 §0.3 phases ↔ volume exit conditions ↔ acceptance tables).

---
Task ID: 9
Agent: main (Super Z)
Task: Founder review round (chat decisions D-01..D-06) + write all remaining spec volumes (VOL-02..09, 11..16) in contracts-only style.

Work Log:
- Chat-locked founder decisions: Free MCP 40/mo (D-01); Ads = Option B rewarded-only Boost in MiniApp (D-02); PAT = one per user, full read/write data-plane via /api/v1/*, rotate/revoke, never on MCP (D-03); dashboard = only token factory for PAT+AAT, device-approval page = dashboard surface (D-04); AI-training consent default-denied with versioned re-ask + audit (D-05); new VOL-16 terms/ecosystem volume (D-06).
- Patched VOL-00: volume count 15→16, Phase 8 exit rewritten (AAT-only MCP + PAT rejected), added §0.9 Founder Decision Register.
- Patched VOL-01: Limits contract (+mcp_pats_max=1, +ad_boost_daily_calls_max, MCP 40), tier matrix rows (40 / PAT row / boost ceiling), §4.3 boost counter semantics, new §5.5 Ads Option-B section (+§5.6 renumber), tests T1.13–T1.15, DoD hooks line.
- Patched VOL-10: §2 token taxonomy rewrite (PAT data-plane-only, AAT dashboard-factory, sess), TokenScopes minus cascade, §3.1/3.2 flow rewrite, route table (token CRUD moved to /api/v1/tokens), §4.4 pointer, §4.6 kind-check in pipeline, §4.10 TOKEN_KIND_MISMATCH row, §4.9 discovery data_plane block, §5.2 verbs (me/export P1, tokens verb removed), §6 unified tokens table ref, §8 invariant #11 kind isolation, §9 copy, tests T10.2b/T10.12b/T10.15.
- Wrote new volumes: 04 (schema incl consent_events/boost_ledger/audit_log, unified tokens table), 05 (envelope, /api/v1 PAT data plane, token factory §6, consent §8, error taxonomy, AI router), 03 (monorepo, version plumbing incl npm/PyPI derivation), 06 (auth, Stars+USDT, entitlement sync state machine, Paddle fallback, payouts), 02 (research digest, driver rows), 07 (PWA, token factory UI, consent card, SEO), 08 (bot/MiniApp, §5 AdsGram Boost full mechanics), 09 (extension, cookie-shared session), 11 (manifest, 5 patterns, dispatch, chaining, harness), 12 (all 50 cards from frozen JSON, tier census 18/28/4), 13 (long-tail 197 in 7 family batches with real counts, fixture policy), 16 (ToS skeleton, AUP, privacy, AI-training consent contract, token rules, enforcement), 15 (ledger: statements, ads/eCPM kill-switch, costs/C1, payouts), 14 (39 DoD checks G-01..G-39, CI/CD, FRAZIYM release tree, watchdog, 10-min-week ops, launch).
- Cleaned 8 stale pre-correction volumes from spec/ and download/spec/; kept valid catalog/jonts.seed.json (247 rows, 155/79/13 verified).
- Audits: 0 leftover 100-quota/cascade/mcp_tokens/old-verb refs; VERSION literal only in VOL-00; no function/class bodies in fenced blocks (all >5-line blocks are allowed contract/layout blocks); every volume has acceptance tests + DoD hooks (VOL-00 by design exempt).
- Copied all 17 volumes to download/spec/ as JONTRIX_SPEC_VOL-XX_*.md.

Stage Summary:
- Complete spec system: 17 volumes (00–16), ~34.4k words, contracts-only style, founder decisions D-01..D-06 propagated everywhere.
- Canonical filenames in download/spec/; spec/ is the repo copy per VOL-00 §0.4.
- Cross-volume consistency verified by grep audit; seed JSON validated against tier census.

---
Task ID: 10
Agent: main (Super Z)
Task: (a) Real review of founder-sensitive texts — VOL-16 §6 (training-consent wording) + VOL-01 §4.2 (final matrix); (b) full G-35 legal-prose review before launch; (c) push all JONTRIX docs to github.com/akikfaraji/JONTRIX.

Work Log:
- G-35 review pass over VOL-16 in full + VOL-01 §4.2: 9 findings (F-1..F-9), 8 fixes folded into VOL-16 same-pass, F-9 = VOL-01 §4.2 matrix PASS (matrix ↔ Limits contract ↔ seed census ↔ tests all consistent; 40/2k/10k/100k MCP, AAT 1/3/10/∞, PAT 1×4, boost +20 Free-only, 155/234/234/247).
- Key VOL-16 fixes: F-1 withdrawal wording de-ambiguated (first export after change already excludes; old text could read "one more batch includes you"); F-2 consent card now links the bound policy_version text; F-3 batch consumption (run id/batch/date) audit-logged so the weights-retention disclosure is per-user checkable; F-4 mandatory-consumer-rights carve-out added to no-refund clause; F-5 ToS skeleton gained §2.10 governing law + severability/entire-agreement (Bangladesh venue flagged as founder confirm item); F-6 stored files added to privacy retention list; F-7 PAT data-plane self-export promised in privacy prose; F-8 §9 typo fixed.
- Created docs/decisions.md (required by VOL-00 §0.4/VOL-14 G-35, previously missing): founder register D-01..D-06 mirror + full G-35 review record + pre-drafted founder countersign line. G-35 status = REVIEWED, launch-blocking until founder appends the one-line countersign.
- VOL-14 G-35 line updated to record the pass; synced VOL-14/16 to download/spec/ copies.
- Git: existing workspace repo had auto-snapshot history with .env/tool-results/scripts/worklog tracked → built clean orphan branch (fresh-main → main), single commit 1e65c3c, 39 files: .gitignore, spec/ (17 vols + catalog seed), docs/decisions.md, research/ (7 streams + frozen opportunities.json), deliverables/ (PDF, XLSX, phase-1 export, 8 charts). Excluded: .env, worklog.md, scripts/, tool-results/, download/ duplicates, raw search JSONs. PAT used only in push URL, scrubbed from .git/config after push (never written to any file).
- Push verified: origin/main = 1e65c3c on github.com/akikfaraji/JONTRIX (remote was empty; clean new-branch push, no force).

Stage Summary:
- G-35 = REVIEWED (F-1..F-9 recorded in docs/decisions.md); founder's single countersign line is the only remaining launch-gate act. VOL-01 §4.2 confirmed consistent with all locked decisions.
- JONTRIX docs repo live: github.com/akikfaraji/JONTRIX (main @ 1e65c3c), clean history — no secrets, no internal workspace files.
- Recommendation recorded for founder: confirm governing-law venue (G-35 caveat 2) before launch checklist runs.

---
Task ID: 11
Agent: main (Super Z)
Task: Founder directive "do the rest" — close remaining launch-gate items (G-35 countersign + venue), push updates, then move all /download files to /jontrix so nothing shows in the task/deliverables view.

Work Log:
- Recorded G-35 CLEARED in docs/decisions.md (founder-directed closure via chat directive: findings F-1..F-9 accepted; governing-law venue = Bangladesh confirmed by default under the directive; advisory caveats remain).
- Updated VOL-14 G-35 line (no longer launch-blocking) and VOL-16 status header (cleared for launch 2026-09-03).
- Synced updated copies to the user-visible spec dir (still download/spec/ at sync time).
- Committed 610f095 ("G-35 cleared (founder-directed closure) + governing-law venue confirmed") and pushed 1e65c3c..610f095 to origin/main; first push attempt failed (tokenless URL — credential-less fatal), re-pushed with PAT, scrubbed token from .git/config again.
- Moved entire download/ tree to /home/z/my-project/jontrix/ (PDF, XLSX, phase-1 export, README stub, charts/ 8 PNGs, spec/ 17 volumes + seed). download/ no longer exists; deliverables no longer appear in the task/deliverables view.
- .gitignore: added jontrix/ (local mirror only; repo already contains the same content as spec/, deliverables/, research/, docs/). git status clean post-move.
- Going forward: user-visible volume syncs go to jontrix/spec/ (was download/spec/).

Stage Summary:
- ALL launch-gate items closed: G-35 = CLEARED (2026-09-03), venue = Bangladesh, spec = launch-ready for the build agent. Remaining advisory: rotate the GitHub PAT (was pasted in chat) and optional counsel read before scale.
- GitHub repo current: github.com/akikfaraji/JONTRIX @ 610f095 (main).
- Local workspace decluttered: /jontrix holds the user-facing mirror; repo remains canonical.

---
Task ID: 12
Agent: main (Super Z)
Task: BUILD START — read specs one at a time, implement the basics (founder directives: Next.js frontend, Node.js backend, npm-driven; clean minimal big-tech design like Facebook/WhatsApp; dark+light; no neon/gradients/emoji).

Work Log:
- Recorded D-07 (stack pivot + design language) in docs/decisions.md and VOL-00 §0.9 register — supersedes CF Workers layout for build env; SQLite/Prisma realizes VOL-04 until deployment target chosen.
- Read for this phase: VOL-07 (PWA shell/Jont template/honest labels), VOL-05 (envelope §2, error taxonomy §9, health §7, token factory §6), VOL-04 (plans/jonts/users/entitlements column contracts, seed rules §7). Previously in context: VOL-00, 01, 16. Remaining volumes to be read when their phases start.
- Built foundation (all on the single user-visible `/` route per sandbox rule):
  - src/version.ts (FRAZIYM single source, V00.00.000-beta-01); footer + /api/health render it (T7.5 discipline).
  - prisma/schema.prisma: Plan (limits_json verbatim from VOL-01 §4.1), Jont (VOL-04 §4 columns + description/faqJson), User (consent columns, default denied — D-05), Entitlement (windowed counters).
  - prisma/seed.ts + npm run db:seed: 4 plans + 247 jonts from spec/catalog/jonts.seed.json (upsert, count-assert 247).
  - API (Node route handlers): /api/health (VOL-05 §7 shape, deps.db check, degraded-still-200), /api/plans, /api/jonts (q/tier/pattern/context/sort/limit) — all enveloped per VOL-05 §2 with request_id + VERSION.
  - Design system: globals.css tokens — light (white/#f2f4f7/#1f6fd6 accent) + dark (#0c0e12/#14171d/#3b7dd8), flat, 1px borders, 8px radius, zero gradients, zero emoji (lucide only); Geist sans/mono.
  - UI: SiteHeader (wordmark mark, nav, ThemeToggle, Phase-5-aware Sign in toast), HomeView (hero, key-facts row, 3 principles, top-8 featured from API), ToolsView (247 from DB; search + tier/context/pattern filters; load-more 48/page; tier+context badges), PricingView (4 tiers rendered from plan rows — matrix verbatim incl. 40/2k/10k/100k MCP, PAT=1, boost row absent on paid), SiteFooter (VERSION + Terms/Privacy/AUP dialogs from policy-content source — G-36-lite).
- QA: eslint clean (fixed 2 react-hooks/set-state-in-effect errors); db push+seed OK; curl smoke tests 200 (health/plans/jonts?tier=MAX); agent-browser verified: home renders, Tools 48/247 + search "pdf" → 16/16, Pricing matches matrix, dark toggle (html.dark), iPhone 14 responsive, no console errors.
- Committed b8d29a6 and pushed 610f095..b8d29a6 to origin/main; token scrubbed. .gitignore += .next/, db/, .zscripts/, *.tsbuildinfo.

Stage Summary:
- Foundation live and browser-verified: clean big-tech shell, dark/light, DB-backed catalog of 247 tools, seeded pricing, version hygiene end-to-end.
- Next phases (per spec order, reading volumes as we go): Phase 2 platform core (VOL-05 auth/middleware on Node), Phase 3 runtime + first 10 Jonts (VOL-11/12), then PWA depth (VOL-07), accounts/billing (VOL-06), bot/MiniApp (VOL-08), extension (VOL-09), MCP + gateway (VOL-10).
