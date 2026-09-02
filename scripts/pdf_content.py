#!/usr/bin/env python3
"""FRAZIYM executive PDF — content part 1 (sections 1-9). English, numbered citations."""

S1 = {
 "num": 1, "title": "Executive Verdict",
 "blocks": [
  ("p", "FRAZIYM should be built — but as <b>one subscription product bundling 247 micro-tools</b>, not as a constellation of standalone sites. The research found 94 community-verified pain points (E1/E2 evidence with URLs), and every one of them points at the same buying behavior: people need a fixing tool two or three times a month, resent paying $14–$60 per month for a single-purpose SaaS, and abandon sketchy converter websites out of fear. A bundled toolbox with a free hook tier and a $4.99–$19.99 subscription ladder monetizes exactly that pattern, and the anti-underpricing rule is defensible: one FRAZIYM plan costs less than any single niche incumbent while covering data repair, developer tooling, e-commerce operations, education, and more."),
  ("p", "The economics work because the cost base is verifiably zero. Cloudflare's free tier (100k requests/day, unlimited-bandwidth Pages, D1, R2, Queues, Cron) hosts the whole system [1][2][3][4]; a five-provider AI gateway pools roughly 500–2,000 free inference requests per day [10][11][12][13]; and payout rails that work from Bangladesh without a bank account exist and were fee-verified — USDT P2P to bKash at roughly 1.4–2% all-in, Telegram Stars at roughly 4–5%, with Paddle-to-Payoneer available at scale [16][17][20][21]. Gross margin on a subscription dollar is therefore approximately 95–98%, and the first dollar is reachable inside 30–45 days on the modeled path."),
  ("callouts", [("247", "scored opportunities"), ("94", "E1/E2-verified problems"), ("$0", "verified monthly infra cost"), ("~95–98%", "gross margin per subscription")]),
  ("p", "The honest caveat sits in Section 16: distribution is the real boss fight, not code. Rankings, not products, decide whether anyone arrives; programmatic SEO takes 6–12 months to compound [41][42], and the $1/day milestone is reached through subscription arithmetic on modest traffic, not through virality. The plan below assumes a solo developer in Bangladesh, an Android/Termux workspace, no bank account, and under 10 minutes per week of maintenance per tool family — and it treats every free tier as disposable, with failover designed in from day one."),
 ],
}

S2 = {
 "num": 2, "title": "Mission, Constraints and Method",
 "blocks": [
  ("p", "The mission was to find, with evidence, a path to an automated digital ecosystem earning at least $1/day on average with growth potential, under hard constraints: $0 initial capital, $0 running cost, first income within roughly one month, no bank account or credit card (collections via bKash, Nagad, Rocket, or crypto), no traditional freelancing and no manual client hunting, maintenance under 10 minutes per week, and exclusively free-tier infrastructure. The operator has programming capability and unlimited build hours, which shifts the optimal strategy away from high-touch services and toward a portfolio of deterministic, self-serve tools."),
  ("p", "The method ran in two phases. Phase one dispatched seven parallel research streams — data and file repair, e-commerce and SMB operations, developer tooling, weird and neglected markets, free AI providers, free infrastructure, and payment rails — executing roughly 160 web searches with every claim traced to a URL and graded: <b>E1</b> means a direct community complaint or first-hand case was found; <b>E2</b> means a product, pricing, or documentation fact was verified; <b>E3</b> means a pattern-level inference that is labeled as such and flagged for validation. Phase two consolidated 104 research-locked problem rows and expanded them, under the founder's one-product directive, into a 247-row opportunity catalog where every long-tail tool inherits its parent cluster's evidence and is scored on the ten weighted dimensions."),
  ("p", "Deliberate exclusions shaped the result. Traditional freelancing markets were excluded by mandate and by the operator's own year-long negative experience. AI-heavy document processing was deprioritized where deterministic pipelines suffice, because per-document AI cost floors destroy the $0-cost premise — the exception being AI features that are cached, small-model-friendly, and gateway-routed. Anything requiring paid bandwidth (for example self-run tunnel services) was downgraded regardless of demand, since tunnels convert revenue into egress cost on free infrastructure [35]."),
 ],
}

S3 = {
 "num": 3, "title": "The Evidence Base: Seven Zones, 247 Tools",
 "blocks": [
  ("p", "The opportunity database aggregates 103 research-locked rows (79 E1, 15 E2) and 144 pattern-inherited long-tail rows (E3) into seven product zones. Zone averages on the weighted composite range from 5.77 to 6.87, but the spread inside each zone matters more than the average: every zone contains at least one flagship above 7.3. Data and file repair leads on both depth and severity — it contains the bank-statement cluster (bookkeepers blocked from importing PDF statements, with incumbent converters priced at $40–$300 per month [24][25][26]), the Excel silent-corruption cluster, and the scanned-PDF/OCR cluster. E-commerce follows with the supplier-CSV-to-Shopify hell, Amazon flat-file pain [31][32], and the subset-sum invoice-matching problem that has no free incumbent at any price."),
  ("table", "T_zones"),
  ("fig", ("charts/zone_stats.png", "Figure 1 — zone averages across the 247-row database; n = tools per zone.")),
  ("p", "Two structural findings matter for the one-product decision. First, the single highest-scoring row in the entire database (8.20) is not a tool but a pricing complaint: Adobe Acrobat's subscription-only model enrages occasional users who need one PDF edit [24-class evidence, DR-C3] — direct demand evidence for a bundled, low-priced alternative with a real free tier. Second, the third-ranked row (7.67) describes users stitching three to five single-purpose websites to finish one conversion job. Both findings are arguments for FRAZIYM's exact shape: many tools, one login, one plan."),
 ],
}

S4 = {
 "num": 4, "title": "Scoring Model and the Top 20",
 "blocks": [
  ("p", "Every row is scored 1–10 on ten dimensions with fixed weights: Demand 20%, Pain 15%, Frequency 10%, Automation 15%, Monetization 10%, Distribution 10%, Competition 5% (scored inversely — high means low rivalry), Infrastructure economics 5%, Ecosystem contribution 5%, and Defensibility 5%. The composite is the weighted sum, so a tool can rank high either as a traffic hook (CORS explainer, distribution 9) or as a profit engine (bank-statement converter, monetization 9). Scores blend parsed evidence severity and frequency, verified pricing anchors, automation class (deterministic client-side scores highest on infra economics), and roughly 85 hand-audited overrides mapped after title-level verification of every research row."),
  ("fig", ("charts/top20_ranking.png", "Figure 2 — top 20 of 247; blue bars mark the top three.")),
  ("table", "T_top20"),
  ("p", "The top 20 divides cleanly into three platform roles. Flagship LTV tools (bank-statement PDF-to-CSV at 8.03, the PDF table extractor at 7.75, hallucinated-citation verification at 7.60, invoice-to-payment subset matching at 7.58) justify the subscription on their own. Hooks (Acrobat-outrage conversion tools, delimiter fixers, the CORS explainer) pull search traffic at zero marginal cost. Glue (JSON family, cron, timestamps) keeps a user inside one product instead of five tabs. The build plan in Section 15 draws exactly one tool from each tier of this table per sprint."),
 ],
}

S5 = {
 "num": 5, "title": "Weird Gold: Neglected Niches With Proven Pain",
 "blocks": [
  ("p", "The weird-gold stream hunted for markets too small for venture-backed incumbents but with loud, recurring, and sometimes paying pain. The best finds share three properties: severity 7+, no free incumbent, and a distribution loop built into the output. Hallucinated-citation verification tops the list — students and researchers paste AI-generated references and receive a verdict per citation (severity 9, no free tool does batch verification). The irregular-payment rent ledger converts landlord chat chaos into a court-ready PDF, with template sales on Etsy proving willingness to pay. The student provenance trail answers the AI-detector false-positive crisis with an evidence trail instead of an adversarial detector score."),
  ("table", "T_weird"),
  ("p", "Two of these are Bangladesh-corridor products where competition is nearly absent and distribution is native. The BCS quiz bot targets a population where prep banks advertise 1.6 million+ questions behind paywalls [39]; Telegram is the dominant channel and Stars are the native payment. Bangla Unicode tooling (typing fixes, Bijoy conversion) rides a long-tail SEO desert where a single good page owns the query for years [40]. These are not the revenue core — they are the moat builders and corridor multipliers that a Western competitor will not bother to clone."),
 ],
}

S6 = {
 "num": 6, "title": "The Product: One Login, 247 Tools",
 "blocks": [
  ("p", "The founder directive reframed the entire plan: the infrastructure is the product. FRAZIYM ships as a single account that unlocks every tool — including long-tail utilities used once a month or less — because the catalog itself is the moat, the SEO surface, and the reason a subscription feels underpriced rather than overpriced. Each tool page is a landing page targeting one exact long-tail query (\"fix invalid json online\", \"etsy to shopify variant prices\", \"shift srt subtitles\"); 247 landing pages compound into a programmatic-SEO footprint that no single-tool competitor can match, while the deterministic client-side execution (WebAssembly where heavy) turns the FBI-verified fear of shady converter sites into the trust wedge: files never leave the browser [23]."),
  ("fig", ("charts/ecosystem_pdf.png", "Figure 3 — ecosystem map: acquisition, surfaces, catalog, tiers, payout rails.")),
  ("p", "The platform assigns each tool one of four roles. <b>Hooks</b> (53 tools) are free and unlimited, built for search traffic and watermarked shareable outputs — the Kapwing watermark loop applied to utility outputs [44]. <b>Glue</b> (97) are daily-driver utilities that make FRAZIYM the default tab. <b>PRO</b> features (65) add batch mode, larger files, and no watermarks behind the paywall. <b>LTV flagships</b> (32) are the tools a buyer would otherwise purchase separately at $14–$300 per month. Surfaces span the web app (Cloudflare Pages), a Telegram Mini App with Stars-native checkout, a file-to-tool bridge bot, and metered API endpoints — one backend, four doors [45]."),
 ],
}

S7 = {
 "num": 7, "title": "Free AI Layer: Verified 2026 Reality",
 "blocks": [
  ("p", "The free-AI landscape of 2026 is thinner than the folklore says, which is why the verification pass matters. GitHub Models retired in July 2026; Cerebras killed its permanent free tier; Together AI retired signup credits; Gemini's free tier persists but was slashed to roughly 20 requests/day with training-data usage flagged on [14][15]. The survivors anchor the router: Groq (30 RPM, 1,000 requests/day, no card, cached tokens excluded from limits) as primary; OpenRouter's :free models (20 RPM, 50/day, 1,000/day after a $10 credit purchase) as secondary; Cloudflare Workers AI (10,000 Neurons/day) as the same-stack tertiary; SambaNova and Mistral as failovers [10][11][12][13]."),
  ("table", "T_ai"),
  ("p", "Policy matters as much as capacity. One account per provider — no multi-accounting, which violates every provider's terms. Deterministic-first routing means most \"AI features\" never touch a model at all; caching per pattern (regex explanations, error decodes) yields expected hit rates above 60%, so the pooled 500–2,000 requests/day comfortably covers the AI-featured tools' launch traffic. If a paid floor is ever needed, DeepSeek's off-peak Flash pricing ($0.22 per million input tokens) is the designated escape hatch — a cost decision, not an architecture change."),
 ],
}

S8 = {
 "num": 8, "title": "Zero-Cost Infrastructure: The Cloudflare Anchor",
 "blocks": [
  ("p", "The verified stack anchors everything on Cloudflare: Workers at 100,000 requests/day (10 ms CPU), Pages with unlimited bandwidth, D1 at 5 million reads and 100k writes per day, R2's 10 GB with zero egress fees, Queues now free at 10,000 operations per day, and reliable Cron [1][2][3][4]. Everything else is depth or failover: Turso for database headroom, Resend plus Brevo dual-rail email, cron-job.org and healthchecks.io as external schedulers and dead-man watchdogs [8][9]. The verification pass also produced a blacklist with reasons: Supabase pauses idle projects after seven days [5]; Vercel's Hobby plan forbids commercial use [6]; Netlify's free tier downgraded to a hard ~15 GB credit cap [7]; GitHub scheduled workflows are best-effort and get disabled after 60 days of inactivity — never load-bearing for revenue."),
  ("table", "T_infra"),
  ("p", "Two design rules follow. First, treat every free tier as disposable: the router, storage, and scheduler abstractions exist so any provider can be swapped in an afternoon. Second, push compute to the client wherever possible — client-side WASM tools consume zero server CPU, dodge the 10 ms Workers limit entirely, and simultaneously deliver the privacy pitch. The 10-minute weekly maintenance budget is realistic precisely because there are no servers to patch, no containers to restart, and the watchdog pages the founder's Telegram when a check fails."),
 ],
}

S9 = {
 "num": 9, "title": "Getting Paid in Bangladesh Without a Bank",
 "blocks": [
  ("p", "Payment is the constraint that kills most BD indie-SaaS plans, so it was verified rail by rail. The broken list is long and definitive: Stripe and PayPal are unavailable, and AdSense (wire-to-bank only), Gumroad, Ko-fi, Buy Me a Coffee, Patreon, Payhip, and LemonSqueezy all terminate at a bank or Stripe payout. The working set splits into three layers. Day one: Telegram Stars for Telegram-native purchases (payout roughly $0.013 per Star after a 21-day hold and 1,000-Star minimum, ~4–5% all-in via Fragment and a P2P off-ramp) and USDT received through crypto affiliate flows, off-ramped via Bybit or OKX P2P to bKash at roughly 1.4–2% total cost [17][20][21]. At scale: Paddle as merchant-of-record with Payoneer payout to bKash — the only mainstream SaaS checkout open to a BD resident [16][22]."),
  ("table", "T_pay"),
  ("p", "Compliance is treated as a design constraint, not an afterthought. Crypto sits in a Bangladesh Bank grey zone under FERA 1947; the practical risk is not prosecution but MFS wallet freezes from many small, regular P2P credits — so off-ramping is kept small, irregular, and documented, and the plan never depends on a single rail. Binance restricted Bangladesh P2P in March 2025, which is why Bybit and OKX (0% maker fee, bKash/Nagad/Rocket listed) are the default venues. Telegram's 50% channel-ads revenue share remains unverified for BD and is treated as upside, not plan [17]."),
 ],
}
