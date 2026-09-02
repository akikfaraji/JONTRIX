#!/usr/bin/env python3
"""FRAZIYM executive PDF — content part 2 (sections 10-18) + tables + references."""

S10 = {
 "num": 10, "title": "Distribution: The Compounding Channels",
 "blocks": [
  ("p", "Distribution research ranked channels by expected return per hour of founder time, and the winners are all free and compounding. Programmatic SEO is the backbone — case studies show 1,920 to 9,571 monthly users in 18 months from template pages — but only when every page performs a real computation, because the March 2024 core update merged Helpful Content into ranking and targets thin doorway templates [41][42]. The 247 tool pages with genuine client-side engines are exactly the compliant shape. Tool directories (260+ free listings, one weekend of batch submission) seed backlinks; embeddable widgets and watermark-on-export turn every free user's output into a distribution event [44][46]; value-first Reddit participation follows the 9:1 self-promotion rule with the tool literally being the answer to catalogued complaint threads [43]."),
  ("table", "T_dist"),
  ("p", "Timing windows are treated as inventory. The Postman free-tier gutting of February 2026 created live migration search traffic [34]; the plan seeds a curl-to-shareable-request wedge into that wave rather than building a full API client. Expectations are managed honestly: a new domain takes 6–12 months for meaningful SEO traction, Product Hunt is a one-day spike with weak retention, and Telegram discovery is channel-driven rather than store-driven [45]. The first dollar therefore comes from direct community answers and directory traffic while the SEO engine warms up — which is why the roadmap launches distribution before it polishes features."),
 ],
}

S11 = {
 "num": 11, "title": "AI Router Architecture",
 "blocks": [
  ("p", "Every AI-featured request passes five gates before a single token is billed. Gate one validates and classifies the input, rejecting garbage and labeling roughly 70% of tasks as deterministic-eligible. Gate two runs the rule engine — parsers, converters, validators, the subset-sum solver — and returns immediately if it succeeds; the model layer is never touched. Gate three checks the exact and normalized-input caches keyed by task and content hash. Gate four climbs the provider ladder (local small model, then Groq, OpenRouter :free, Cloudflare Workers AI, SambaNova, Mistral, Gemini as last resort with its training-data flag acknowledged) [10][11][12][13][15]. Gate five validates the response — schema checks, citation URL liveness — writes it to cache, and meters usage into D1 for per-tier credit accounting."),
  ("fig", ("charts/ai_router_pdf.png", "Figure 4 — the five-gate AI request pipeline.")),
  ("p", "This architecture is what makes AI features affordable inside a $0 cost base and a $4.99 entry price. Cached deterministic results cost nothing forever; cached model results cost nothing on repeat; uncached model calls ride free quotas that refresh daily across five providers. Metering is not cosmetic — it is the billing surface for the tier system, converting an unmeterable cost into a fixed per-plan credit allowance (Section 12) and protecting free quotas from abuse at the same time."),
 ],
}

S12 = {
 "num": 12, "title": "Pricing and Profit Model: Never Underprice",
 "blocks": [
  ("p", "Pricing follows the founder directive: plan-based profit, tool-count-maximal, and no underpricing. The ladder is value-anchored against verified incumbent prices rather than cost-plus, because the cost base is zero and the anchor is what buyers compare against. A PRO plan at $4.99 replaces any single niche subscription — iLovePDF-class PDF suites at $4–7, Matrixify at $20 for Shopify imports alone [28], Dext at $13–20.50 for receipts alone [30] — while covering all seven zones. STUDIO at $9.99 bundles the AI-featured flagships; the bank-statement converter alone retails at $49.95 (DocuClipper) up to $299.95 (MoneyThumb) [24][25]. MAX at $19.99 undercuts Postman's $14 single-user plan while covering three seats plus webhook workspace, MCP tooling, and 25,000 API calls [34]."),
  ("table", "T_tiers"),
  ("fig", ("charts/pricing_value.png", "Figure 5 — one plan vs single-niche subscriptions (verified prices).")),
  ("p", "The underpricing guard is codified so future discounts cannot hollow the model: any tier price must stay above twice the cheapest single-niche competitor's monthly price divided by twenty, and above the $4 evidenced willingness-to-pay floor; free tiers may be generous in features but never in the batch, file-size, and API dimensions that professionals pay for. Profit mechanics: gross margin of roughly 95–98% after payment-rail fees only, with the free tier explicitly budgeted as the customer-acquisition engine — its cost is zero infrastructure and its yield is the SEO footprint."),
 ],
}

S13 = {
 "num": 13, "title": "Revenue Scenarios: From $0.17 to $30 a Day",
 "blocks": [
  ("p", "Scenarios are modeled as subscriber arithmetic — the one-product frame makes this cleaner than per-tool sales math ever was. Using the tier prices and blended payment fees from Sections 9 and 12: Scenario A (first blood, day 21–45) needs exactly one PRO subscriber from a single seeded tool's thank-you page. Scenario B clears $1/day with three PRO and one STUDIO subscribers against 400–800 daily free-tool visits. Scenario C ($3/day) is eight PRO, three STUDIO, one MAX on 1.5–3k daily visits. Scenario D ($10/day, day 90) is 25/8/3 on 6–10k daily visits, and Scenario E ($30/day, month 5–6) is 70/25/8 with ads and affiliate top-ups carrying roughly $5–7 of the daily total."),
  ("table", "T_rev"),
  ("fig", ("charts/revenue_scenarios.png", "Figure 6 — modeled net $/day vs scenario targets.")),
  ("p", "The conversion assumptions (0.5–4% of free users converting by segment fit, churn under 8% monthly) are E3 and labeled as such — they are the first numbers the live funnel will replace with reality. What is not speculative is the shape of the curve: because marginal infra cost is zero and marginal tool cost is build-hours already spent, every subscriber dollar above payment fees is margin, and the catalog keeps adding surfaces that convert. The scenarios also expose the lever hierarchy: traffic volume matters less than segment fit per visit, which is why each zone ships its flagship early."),
 ],
}

S14 = {
 "num": 14, "title": "System Architecture and the Autonomy Loop",
 "blocks": [
  ("p", "The runtime is deliberately boring: Cloudflare Pages serves the static tool frontends (client-side engines in WASM where heavy); Workers host the API, the AI router, and the Telegram bot; D1 holds users, the tool registry, and the usage ledger; R2 stages files for the few server-side jobs; Queues and Cron handle batch and scheduled work [1][2][3][4]. Auth starts as Telegram-login plus magic links (no password store), analytics runs on Cloudflare Web Analytics with PostHog free tier for funnel depth, and healthchecks.io acts as the dead-man switch that pings Telegram if any cron stops beating [9]. Nothing in the request path depends on a provider that can pause, expire, or de-platform without a configured failover."),
  ("p", "The autonomy loop is what keeps maintenance under ten minutes a week. Every tool self-reports heartbeat and error rates into the usage ledger; a nightly Workers Cron job aggregates anomalies; the watchdog posts a daily digest to the founder's Telegram and escalates only on threshold breaches. Content and SEO surfaces are programmatic — sitemaps, directory re-submissions, and embeddable-widget renders are generated by the same registry, so shipping a tool automatically ships its landing page, its API stub, its Telegram Mini App card, and its catalog entry. Adding tool number 248 is a registry row plus a client-side engine bundle, not a deployment project."),
 ],
}

S15 = {
 "num": 15, "title": "The 90-Day Roadmap and the Long Game",
 "blocks": [
  ("p", "The roadmap sequences by one rule: ship a distribution surface before a feature. Days 1–15 build the platform skeleton (auth, registry, tier meters, payment rails with Stars first) and the first six tools — JSON formatter, delimiter fixer, PDF merge/split, cron explainer, word counter, QR generator — each a hook with watermark-on-output. Days 16–30 add the first LTV flagship (bank-statement PDF-to-CSV with client-side table extraction), the Telegram bot bridge, directory submissions, and the first community answers; the payment rails go live and the first subscription is plausible before day 30. Days 31–60 ship zone flagships in sequence (Shopify pre-flight, invoice matcher, citation verifier), the Mini App with Stars checkout, and the pSEO template engine. Days 61–90 scale to 45+ tools, launch the MCP tooling wedge into the developer wave, and turn on the embeddable-widget loop."),
  ("table", "T_road"),
  ("p", "The long game compounds in three layers. Twelve months: 80+ tools, the catalog translated for Bangla long-tail queries where competition is near zero [40], Paddle added for card-paying customers, and the $10/day line crossed with margin. Twenty-four months: the corridor moat (BCS prep, Bangla utilities, WhatsApp-commerce tooling) plus the developer-surface wedge (MCP session tooling) make the catalog defensible on two fronts incumbents ignore. The exit-shape optionality is deliberate — the same registry powers per-tool unbundling, an API product, or an acquisition-friendly traffic asset, and none of those paths require spending the first dollar the model has not already earned."),
 ],
}

S16 = {
 "num": 16, "title": "Risks and the Brutally Honest Feasibility Verdict",
 "blocks": [
  ("p", "Honesty is the deliverable, so this section leads with what can kill the plan. The primary risk is not technical: distribution lag means months 1–3 can plausibly produce tens of dollars total, not hundreds, and the $1/day average may only stabilize near day 45–60 rather than day 30. The second risk is free-tier drift — the research caught GitHub Models, Cerebras, and Together dying inside twelve months, so the architecture treats every provider as disposable, but drift still costs rebuild hours. The third is payment compliance: the crypto grey zone and MFS freeze risk cap the practical off-ramp velocity, and Telegram's 21-day Stars hold delays cash by three weeks. The fourth is platform policy: programmatic SEO lives under Google's discretion, and the watermark loop dies if output platforms penalize attribution."),
  ("table", "T_risk"),
  ("p", "The verdict, stated plainly: <b>feasible with high confidence at the $1/day bar, conditional on distribution discipline</b>. The cost base is verifiably zero, the payment rails are verified working from Bangladesh, the demand evidence is real and URL-backed, and the subscription arithmetic needs only a handful of conversions the funnel can plausibly deliver. The same honesty cuts the other way: this is not a $30/day-in-30-days plan, it is a $30/day-in-months-5-6 plan; AI-heavy document AI was correctly rejected on cost floors; and any week the founder spends on a full API client, a tunnel service, or head-query SEO wars against regex101-class incumbents is a week spent against the evidence. The plan wins by boring arithmetic — many small tools, one product, verified rails, zero costs — and loses only if distribution is treated as an afterthought."),
  ("quote", "Build the catalog, feed the funnel, respect the rails: the first dollar is a when, not an if — the tenth is the actual test."),
 ],
}

S17 = {
 "num": 17, "title": "Top 3 Moves: What to Build First",
 "blocks": [
  ("p", "Move one is the <b>conversion workbench wedge</b>: the six hook tools plus the client-side PDF/CSV engine core (delimiter fixer, encoding converter, leading-zero guard, large-file splitter, JSON repair, PDF merge/split/flatten), shipped as the first catalog pages with watermarks and directory submissions in the same week. These rows score 7.3–8.2, are 100% deterministic client-side, and collectively target the highest-volume long-tail queries in the database. Their thank-you page is the first subscription surface."),
  ("table", "T_top3"),
  ("p", "Move two is the <b>bank-statement flagship</b>: PDF statements to clean CSV/QBO, client-side where the text layer allows, with the trust wedge (\"files never leave your browser\") as the headline against $49.95–$299.95 incumbents [23][24][25][26]. It is the single strongest willingness-to-pay signal in the entire corpus and the anchor justification for STUDIO. Move three is the <b>Telegram monetization loop</b>: the file-to-tool bridge bot, the Mini App with Stars checkout, and the BCS quiz bot as corridor audience-builder [17][39]. Together the three moves cover acquisition, monetization depth, and the BD-native moat — in that order, because each one's output feeds the next one's funnel."),
 ],
}

S18 = {
 "num": 18, "title": "References",
 "blocks": [
  ("p", "Numbered citations [n] map to the URLs below, matching the per-row source lists in research/opportunities.json and the Phase-1 research export. Evidence grades: E1 = direct community evidence; E2 = verified product/pricing/doc fact; E3 = pattern inference."),
  ("refs", None),
 ],
}

SECTIONS2 = [S10, S11, S12, S13, S14, S15, S16, S17, S18]

# ---------------------------------------------------------------- static tables
TABLES = {
 "T_weird": {
  "headers": ["ID", "Tool", "Why it wins", "Evidence"],
  "ratios": [0.11, 0.26, 0.45, 0.18],
  "rows": [
   ["WG-G4", "Hallucinated citation verifier", "Severity 9; batch URL-liveness + metadata checks; no free incumbent", "E1, sev 9"],
   ["WG-G9", "Irregular-payment rent ledger", "Landlord chat chaos to court-ready PDF; Etsy template sales prove WTP", "E1 + E2"],
   ["WG-G5", "Student provenance trail", "Answers AI-detector false positives with evidence, not adversarial scores", "E1, sev 9"],
   ["WG-G17", "BCS quiz bot (Telegram)", "1.6M+ question banks behind paywalls; Telegram-native BD corridor", "E2"],
   ["WG-G11", "Event announcement slides", "Weekly recurring; projected output = public advertising loop", "E1"],
   ["WG-G18", "Bangla Unicode utilities", "Near-zero SEO competition; Avro is desktop-only [40]", "E2/E3"],
   ["WG-G20", "Spreadsheets-as-products meta", "Every recurring spreadsheet ask = a validated tool spec", "E1 pattern"],
  ],
 },
 "T_ai": {
  "headers": ["Provider", "Verified free allowance", "Card", "Router role"],
  "ratios": [0.18, 0.44, 0.10, 0.28],
  "rows": [
   ["Groq", "30 RPM, 1,000 req/day, 8K TPM; Whisper 2K req/day audio", "No", "Primary + speech-to-text [10]"],
   ["OpenRouter :free", "20 RPM, 50/day (1,000/day after $10 credits)", "No", "Secondary, model variety [11]"],
   ["CF Workers AI", "10,000 Neurons/day", "No", "Tertiary, same stack [12]"],
   ["SambaNova", "20 RPM, 20 req/day, 200K tokens/day", "No", "Failover [13]"],
   ["Mistral", "Free tier, rate-limited", "Phone", "Failover"],
   ["Gemini", "~20 req/day (slashed Dec 2025)", "No", "Last resort, training-data ON [15]"],
  ],
 },
 "T_infra": {
  "headers": ["Service", "Free allowance (verified 2026-09-02)", "Hard gotcha"],
  "ratios": [0.20, 0.42, 0.38],
  "rows": [
   ["CF Workers", "100k req/day, 10 ms CPU", "CPU cap: offload heavy work to client WASM [1]"],
   ["CF Pages", "Unlimited bandwidth, 500 builds/mo", "None material"],
   ["CF D1", "5M reads/day, 100k writes/day, 5 GB", "Write cap: batch analytics offload [2]"],
   ["CF R2", "10 GB, zero egress", "None material [4]"],
   ["CF Queues + Cron", "10k ops/day; reliable cron", "New free tier since Feb 2026 [3]"],
   ["Turso / Neon", "500M reads/10M writes; 100 CU-hr/mo", "Neon autosuspends after 5 min idle"],
   ["Resend + Brevo", "100/day + 3,000/mo; 300/day", "Custom domain required [8]"],
   ["cron-job.org / healthchecks", "Unlimited 1-min jobs; 20 monitors", "Watchdog role [9]"],
   ["Blacklisted", "Supabase (7-day pause) [5]; Vercel Hobby non-commercial [6]; Netlify ~15 GB cap [7]; GH cron best-effort", "Never load-bearing"],
  ],
 },
 "T_pay": {
  "headers": ["Rail", "Verdict", "Fees", "Minimum / hold"],
  "ratios": [0.30, 0.24, 0.20, 0.26],
  "rows": [
   ["USDT P2P to bKash (Bybit/OKX)", "WORKS — cheapest chain", "~1.4–2% all-in", "Exchange minimums [21]"],
   ["Telegram Stars to Fragment", "WORKS — TG-native", "~4–5% total", "1,000 Stars; 21-day hold [17]"],
   ["AdsGram (TMA ads)", "WORKS — official TG network", "Net payouts", "$100 [18]"],
   ["Adsterra", "WORKS — crypto only", "Rev-share", "$100 USDT-TRC20 [19]"],
   ["Paddle to Payoneer to bKash", "WORKS at scale", "~5% + fixed", "BDT 1,000 min / 250k cap [16][22]"],
   ["NOWPayments / BTCPay", "WORKS — inbound", "0.5–1.5% / 0%", "None material [20]"],
   ["AdSense, Stripe, PayPal, Gumroad, Ko-fi, BMC, Patreon", "BROKEN for BD no-bank", "-", "Bank/Stripe-payout dependent"],
  ],
 },
 "T_dist": {
  "headers": ["Channel", "Verified reality", "How FRAZIYM uses it"],
  "ratios": [0.22, 0.40, 0.38],
  "rows": [
   ["Programmatic SEO", "Works with real per-page computation; 6–12 months to traction [41][42]", "247 genuine tool pages, exact long-tail queries"],
   ["Tool directories", "260+ free listings; backlinks + trickle", "Batch-submit each launch (one weekend) [47]"],
   ["Telegram corridor", "75k+ Mini Apps; Stars + AdsGram native [45]", "Bot bridge, Mini App, BCS quiz bot"],
   ["Embeddable widgets", "Compounding backlinks (Keywords Everywhere pattern) [46]", "Embed button on calculators/generators"],
   ["Watermark outputs", "Kapwing case study: free exports carry brand [44]", "Subtle made-with-FRAZIYM stamp + URL"],
   ["Reddit / HN value-first", "9:1 rule enforced; Show HN needs free no-signup demo [43]", "Tool IS the answer to catalogued threads"],
  ],
 },
 "T_tiers": {
  "headers": ["Tier", "Price", "Unlockables", "Value anchor it beats"],
  "ratios": [0.12, 0.13, 0.42, 0.33],
  "rows": [
   ["FREE", "$0", "All client-side tools; metered server/AI credits; watermarked outputs", "Free incumbents — the SEO engine"],
   ["PRO", "$4.99/mo", "Full 247-toolbox, batch, no watermark, 300 server credits/mo, 2 GB files", "iLovePDF $4–7; Matrixify $20; Dext $13+ [28][30]"],
   ["STUDIO", "$9.99/mo", "+ AI tools (1,500 credits/mo), API-lite 1k calls, TMA perks", "DocuClipper $49.95; DataFeedWatch $59 [24][27]"],
   ["MAX", "$19.99/mo", "3 seats, webhook workspace, MCP tooling, 5k AI credits, 25k API calls", "Postman $14/user; Hookdeck $19+ [34]"],
  ],
 },
 "T_rev": {
  "headers": ["Scenario", "PRO / STUDIO / MAX subs", "MRR", "Net $/day", "Trigger"],
  "ratios": [0.16, 0.26, 0.14, 0.14, 0.30],
  "rows": [
   ["A — First blood", "1 / 0 / 0", "$4.99", "$0.16", "Day 21–45: one seeded tool's thank-you page"],
   ["B — $1/day", "3 / 1 / 0", "$24.96", "$0.82", "Day 45: 400–800 daily free-tool visits"],
   ["C — $3/day", "8 / 3 / 1", "$89.88", "$2.95", "Day 60: pSEO long-tail + Telegram channel"],
   ["D — $10/day", "25 / 8 / 3", "$264.64", "$8.70 (+$1.3 ads)", "Day 90: 6–10k visits/day, churn <8%"],
   ["E — $30/day", "70 / 25 / 8", "$758.97", "$24.95 (+$5–7 ads/aff)", "Month 5–6: 80+ tools, 5–10k list"],
  ],
 },
 "T_road": {
  "headers": ["Phase", "Build", "Distribution & monetization"],
  "ratios": [0.14, 0.44, 0.42],
  "rows": [
   ["Days 1–15", "Platform skeleton: auth, registry, tier meters, Stars rail; first 6 hook tools", "Watermarked outputs; 260-directory batch submit begins"],
   ["Days 16–30", "Bank-statement flagship; Telegram bot bridge; usage-ledger watchdogs", "First community answers; rails live; first subscription plausible"],
   ["Days 31–60", "Zone flagships: Shopify pre-flight, invoice matcher, citation verifier; Mini App", "pSEO template engine; Stars checkout live; C scenario push"],
   ["Days 61–90", "Scale to 45+ tools; MCP tooling wedge; embeddable-widget loop", "Widget backlinks compound; D scenario push ($10/day)"],
  ],
 },
 "T_risk": {
  "headers": ["Risk", "Severity", "Mitigation"],
  "ratios": [0.34, 0.12, 0.54],
  "rows": [
   ["Distribution lag (SEO 6–12 months)", "High", "Launch channels before polish; direct thread-answers; directories; timed windows (Postman wave) [34]"],
   ["Free-tier drift / provider death", "Medium", "Disposable-provider abstractions; verified blacklist; nightly watchdog; paid floor pre-priced (DeepSeek) "],
   ["Crypto grey zone / MFS freezes", "Medium", "Small irregular off-ramps; multi-rail (Stars + P2P + Paddle); never single-rail dependent"],
   ["Stars 21-day hold delays cash", "Low", "Model timing in scenarios; P2P rail bridges"],
   ["Platform policy (SEO, attribution)", "Medium", "Real computation per page (HCU-compliant); embeds diversified beyond search"],
   ["Solo-founder bus factor / scope creep", "Medium", "Registry-driven tool factory; 10-min weekly budget enforced by watchdogs; build only top-decile rows"],
  ],
 },
 "T_top3": {
  "headers": ["Move", "What ships", "Definition of done"],
  "ratios": [0.22, 0.44, 0.34],
  "rows": [
   ["1. Conversion workbench", "6 hooks + client-side PDF/CSV engine core", "6 tools live, directories submitted, thank-you page selling PRO"],
   ["2. Bank-statement flagship", "PDF to CSV/QBO, client-side, privacy-first", "STUDIO tier purchasable; 3 comparison pages vs incumbents [24][25]"],
   ["3. Telegram money loop", "Bridge bot + Mini App + Stars checkout + BCS bot", "First Stars payment received; bot serving files end-to-end [17]"],
  ],
 },
}

# ---------------------------------------------------------------- references
REFERENCES = [
 "Cloudflare Workers limits — developers.cloudflare.com/workers/platform/limits (E2)",
 "Cloudflare D1 pricing and limits — developers.cloudflare.com/d1/platform/pricing (E2)",
 "Cloudflare Queues free tier (Feb 2026 changelog) — developers.cloudflare.com/queues/platform/pricing (E2)",
 "Cloudflare R2 pricing — developers.cloudflare.com/r2/pricing (E2)",
 "Supabase free-tier pausing — supabase.com/docs/guides/platformgoing-into-prod (E2)",
 "Vercel Hobby plan terms — vercel.com/docs/accounts/plans/hobby (E2)",
 "Netlify free tier credit downgrade — netlify.com/pricing (E2)",
 "Resend limits — resend.com/docs; Brevo free plan — brevo.com/pricing (E2)",
 "cron-job.org — cron-job.org; healthchecks.io — healthchecks.io (E2)",
 "Groq rate limits — console.groq.com/docs/rate-limits (E2)",
 "OpenRouter limits — openrouter.ai/docs/api-reference/limits (E2)",
 "Cloudflare Workers AI pricing — developers.cloudflare.com/workers-ai/platform/pricing (E2)",
 "SambaNova Cloud rate limits — cloud.sambanova.ai (E2)",
 "GitHub Models retirement (Jul 2026) — github.com/models docs (E2)",
 "Gemini free-tier rate limits — ai.google.dev/gemini-api/docs/rate-limits (E2)",
 "bKash Payoneer integration — bkash.com/en/page/payoneer (E2)",
 "Telegram ads revenue share — telegram.org/blog/ads-revenue-share; Fragment — fragment.com (E2)",
 "AdsGram — adsgram.ai/monetization (E2)",
 "Adsterra payment methods — adsterra.com (E2)",
 "NOWPayments pricing — nowpayments.io/pricing (E2)",
 "Bybit P2P bKash/Nagad listings — bybit.com/p2p (E2)",
 "Paddle pricing — paddle.com/pricing; Payoneer — payoneer.com (E2)",
 "FBI IC3 warning on online file converters — ic3.gov; Malwarebytes converter-malware reports (E2)",
 "DocuClipper pricing — docuclipper.com/pricing ($49.95/mo) (E2)",
 "MoneyThumb pricing — moneythumb.com ($299.95) (E2)",
 "Bank-statement import pain threads — reddit.com/r/Accounting; r/AccountingFiles (E1)",
 "DataFeedWatch pricing — datafeedwatch.com/pricing ($59–64/mo) (E2)",
 "Matrixify pricing — matrixify.app/pricing ($20–200/mo) (E2)",
 "WP All Import pricing — wpallimport.com ($99–229/yr) (E2)",
 "Dext pricing — dext.com ($13–20.50/mo) (E2)",
 "Shopify supplier-CSV import threads — reddit.com/r/shopify (E1)",
 "Amazon flat-file pain — reddit.com/r/AmazonSeller threads incl. 8541 (E1)",
 "MySQL to PostgreSQL converter ask — stackoverflow.com/questions/92043 (E1)",
 "Postman free-tier cut (Feb 2026) — reddit.com/r/Backend/comments/1qwefiy (E1/E2)",
 "ngrok free limits — ngrok.com/docs/pricing-limits (E2)",
 "Dadroit large-JSON viewer — dadroit.com (E2)",
 "curlconverter.com — open-source curl-to-code converter (E2)",
 "Quizlet paywall backlash — reddit.com/r/Teachers/comments/x3a1lg (E1)",
 "Ogroshor BCS question bank — ogroshor.com (E2)",
 "Avro Keyboard — omicronlab.com/avro-keyboard.html (E2)",
 "Suso Digital programmatic-SEO case study — susodigital.com/work/saas-programmatic-seo-case-study (E2)",
 "Google March 2024 core update — blog.google (E2)",
 "Reddit self-promotion guidelines — reddit.com/wiki/selfpromotion (E2)",
 "Kapwing watermark growth loop — kapwing.com/blog/viral-how-we-used-watermarks-to-grow-a-startup (E2)",
 "Telegram Mini Apps 2026 stats — grambase.ai/blog/telegram-mini-apps-2026 (E2)",
 "Keywords Everywhere embeddable tools — keywordseverywhere.com/tools/embed (E2)",
 "SaaS directory lists — position.digital/blog/saas-directories (E2)",
 "ReqBin premium limits — reqbin.com/premium (E2)",
]
