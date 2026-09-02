# Research 2-g: Distribution Channels + Weird/Neglected Markets
Agent: research-distribution-weird | Budget context: $0, solo dev, Bangladesh, ecosystem of tiny automated web tools / Telegram bots, passive revenue.
Method: 30 web searches (z-ai web_search; ~5 extra attempts failed with 429 rate-limits and were retried after cooldown). All claims below are traceable to a URL found in search. Nothing invented; where evidence is weak it is marked E3 and flagged "validate".

Evidence levels: **E1** = direct community complaint / first-hand case data (multiple sources or strong single source). **E2** = single community mention, product-page claim, or indirect but concrete. **E3** = inference/hypothesis — validate before building.

---

## STREAM A — DISTRIBUTION CHANNELS (facts, with URLs)

### A1. Programmatic SEO for tool sites — works, but slow and riskier since 2024
- Reality: Case studies confirm large organic gains from template pages at scale. Suso Digital: SaaS client grew 1,920 → 9,571 users/mo (+398%) in 18 months via pSEO (https://susodigital.com/work/saas-programmatic-seo-case-study). Omnius: AI client 67 → 2,100 monthly signups in 10 months (https://www.omnius.so/blog/programmatic-seo-case-study). Canonical players: Zapier, Canva, G2, Tripadvisor templates (https://seomatic.ai/blog/programmatic-seo-examples, https://discoveredlabs.com/blog/programmatic-seo-examples-10-real-world-templates-that-drive-organic-growth).
- Timeline: New domains: 3–6 months to meaningful traction, 6–12+ months common (https://www.lucatagliaferro.com/how-long-does-seo-take, https://seosherpa.com/how-long-does-seo-take-to-work, r/DigitalMarketingHack Oct 2025: https://www.reddit.com/r/DigitalMarketingHack/comments/1nwz59r/). Indexing: 24–48h for established sites vs days for new (https://whitehat-seo.co.uk/blog/how-long-does-it-take-to-rank-on-google).
- Risks: March 2024 core update merged Helpful Content into core ranking; "very low-value, third-party content produced primarily for ranking purposes" targeted (https://blog.google/products-and-platforms/products/search/google-search-update-march-2024). Site Reputation Abuse policy (Nov 2024 update: https://developers.google.com/search/blog/2024/11/site-reputation-abuse) enforced May 5, 2024 (https://impact.com/affiliate/googles-updated-site-reputation-abuse-policy-on-affiliate-marketers). Real deindexing thread for "thin content with little or no added value" (Google support, Oct 2024: https://support.google.com/webmasters/thread/303787486/).
- Verdict: viable but must be *genuinely useful per-page* (real computation, unique data), not doorway templates. Target long-tail "X to Y converter"-class queries with near-zero competition; expect 6–12 months, not weeks.

### A2. Product Hunt — free, one-day spike, weak retention
- Reality: Good launches still produce numbers: one indie report: 5k unique visitors, 1,000+ signups in a day (https://www.indiehackers.com/post/so-i-guess-the-product-hunt-launch-is-still-worth-it-heres-why-and-how-b4757a04ab); another: 120+ signups + ongoing trickle (https://www.indiehackers.com/post/getting-to-the-top-on-product-hunt-detailed-and-honest-guide-after-3-failures-60bba547c9). Counterweight: "I analyzed 500 Product Hunt SaaS launches. 487 are dead" — PH is a marketing moment, not a growth engine (https://www.reddit.com/r/SaaS/comments/1mnc3nu/). Launch-day tactics (day-of-week matters) documented (https://www.indiehackers.com/post/product-hunt-launch-day-saturday-vs-tuesday-thursday-results-stats-0283f12ebb). Free alternatives with real traffic: Uneed, Peerlist, Indie Hackers, AlternativeTo, SaaSHub (https://www.reddit.com/r/GrowthHacking/comments/1tggcwt/; https://getlaunchlist.com/blog/product-hunt-alternatives).
- Requirements: free to launch; needs assets (gallery, one-line pitch, demo); even <20 upvotes forces positioning clarity (https://www.indiehackers.com:8443/post/launching-on-producthunt-what-do-people-experience-c417c35d73).

### A3. Tool directories — 260+ free listings, SEO backlinks, modest recurring traffic
- Reality: Curated lists of free directories: 260+ (https://www.position.digital/blog/saas-directories), 43 free B2B no-fee (https://blastra.io/directories/free-b2b-saas-directories), 700+ index (https://submitsaas.com/best-saas-directories), community-made 300+ list (https://www.indiehackers.com/post/i-made-a-list-of-300-software-submission-directories-to-submit-your-saas-38b080943a). Recommended starter set: Product Hunt, Indie Hackers, Peerlist, Uneed, AlternativeTo, SaaSHub (https://www.reddit.com/r/GrowthHacking/comments/1tggcwt/). AI-tool dirs (OpenFuture AI etc.) accept free submissions with "high-traffic" claims (https://aiso.blog/best-directories-ai-tools).
- Reality check: most directories = one-time backlink + long-tail referrer; AlternativeTo is the one general directory with real ongoing consumer search traffic. Time cost: ~2–5 min per listing; automatable batch. Free tier only.

### A4. Chrome Web Store — free listing, slow review, weak internal discovery
- Reality: Publish free; review takes "a few hours to several days" officially (https://dev.to/artem_turlenko/how-to-publish-your-chrome-extension-on-the-chrome-web-store-3p3e), but devs report multi-day "Pending Review" (https://www.reddit.com/r/chrome_extensions/comments/1h099ur/) and Google admitted surge-related delays (https://groups.google.com/a/chromium.org/g/chromium-extensions/c/VJ6DcpEn51Y/m/yuxvHWdwCAAJ). Featured status is evaluated *after* publishing, doesn't speed review (https://extensionbooster.net/blog/chrome-web-store-extension-review-time-2026-how-long-guide). Post-launch reality from 185,000-extension analysis: installs are usually low without external traffic (https://exstats.com/blog/published-first-chrome-extension-now-what).
- Verdict: treat CWS as a free secondary storefront + trust badge; drive traffic from the web tool itself ("Get the Chrome extension").

### A5. Telegram Mini Apps — real money rails (Stars + official ads), crypto-games cautionary tale
- Reality: Q1 2025: 75,000+ active Mini Apps, +200% YoY (https://www.linkedin.com/pulse/why-telegram-mini-apps-ads-skyrocketed-2025-dmytro-bandurenko--kwege). Mini Apps generated >$1B transaction volume in 2025, mostly gaming tokens/tap-to-earn (https://grambase.ai/blog/telegram-mini-apps-2026). Monetization options: Telegram Stars IAP, ads, subscriptions (https://omisoft.net/blog/how-to-monetize-telegram-mini-app). AdsGram = Telegram's official rewarded-ad network for TMAs (https://adsgram.ai/blog/adsgram/introduction-to-telegram-mini-apps-and-monetization-opportunities); Monetag SDK monetizes TMAs, $5 min payout (https://monetag.com/blog/telegram-mini-app-monetization-faq). Builder with 5M+ TMA users: "major apps make money through ads, Telegram sharing 50% of ad revenue in $TON" (https://www.blackhatworld.com/seo/key-insights-from-building-telegram-mini-apps-5m-users.1642231). Case study: $35k profit in 30 days on a TMA (vendor marketing, E3: https://richads.com/blog/how-to-create-telegram-mini-app-35k-profit-case-study).
- Tap-to-earn lesson: Hamster Kombat hit 300M players (https://www.wired.com) then suffered "dramatic user decline" once token rewards collapsed (https://coinmarketcap.com) → mercenary reward-farming traffic churns; utility tools retain better. Discovery inside Telegram remains weak (no evidence of an effective official catalog in results) → grow via channels (Channels/groups cross-promo, shareable bot outputs), not store-browse.
- Fit: exceptionally high for a Bangladesh dev — Telegram is dominant in BD/IND/RU/IRAN corridors; Stars handles payments where Stripe/PayPal can't.

### A6. GitHub — free hosting + discovery via trending/topics/awesome-lists
- Reality: Discovery surfaces: Topics pages (https://github.com/topics/open-source-project), Awesome lists index (https://github.com/sindresorhus/awesome) — getting into a topic-appropriate awesome list = permanent referral; niche example: Awesome-for-beginners invites maintainers to list projects (https://github.com/mungell/awesome-for-beginners). GitHub Pages hosts static tools free (md8-habibullah demo: https://md8-habibullah.github.io/top-github-repos-list). HN norms doc useful for Show HN launches (https://github.com/minimaxir/hacker-news-undocumented).
- License note: results didn't surface an MIT-vs-unlicensed traffic effect; keep MIT for tool repos (default). E3.

### A7. Reddit — 9:1 rule, per-sub rules, r/InternetIsBeautiful-style launches
- Reality: Site-wide guideline: "For every 1 self-promotional post, 9 other posts/comments should not be self-promotional" (official clarification: https://www.reddit.com/r/modnews/comments/2oamgp/; guide: https://www.reddit.com/r/reddit.com/wiki/selfpromotion). Sub-specific rules vary widely — some mods allow labeled self-promo from active members (https://www.reddit.com/r/rpg/comments/1mms2yu/), others ban it (https://www.reddit.com/r/ModSupport/comments/1rm7665/). Practitioner guides: 90/10 + shadowban warnings (https://redship.io/blog/reddit-self-promotion-rules, https://www.conbersa.ai/learn/reddit-self-promotion-rules). HN: Show HN works for dev tools if free/no-signup demo (https://www.markepear.dev/blog/dev-tool-hacker-news-launch; https://syften.com/blog/hacker-news-marketing).
- Fit: sustainable only with a value-first account (answer "how do I X" threads where the tool is the answer). Zero cost.

### A8. Viral output pattern — watermark-on-export is a documented growth loop
- Case study: Kapwing published "VIRAL: How We Used Watermarks to Grow our Startup" — every free export carried their brand into social feeds (https://www.kapwing.com/blog/viral-how-we-used-watermarks-to-grow-a-startup). Modern pricing confirms the free tier still watermark-gates (https://www.kapwing.com/pricing; https://piktochart.com/piktochart-video-vs-kapwing). remove.bg-style free-with-limits tools dominate comparison content (https://remove-bg.io/blog/best-free-background-removers-compared-2026).
- Fit: any tool whose output gets posted (slides, badges, schedules, memes, charts) should stamp a subtle "made with X" + URL. Costs nothing; compounds.

### A9. Embeddable widgets — other sites embed → passive backlinks + distribution
- Reality: Keywords Everywhere lets any webmaster embed 41 free SEO tools on their own site (live example of embed-as-distribution: https://keywordseverywhere.com/tools/embed). Free review-widget market exists (https://www.review-widget.net; demand thread: https://www.reddit.com/r/divi/comments/1dcy87b/). SEO mechanics of iframe embeds discussed (https://webmasters.stackexchange.com/questions/101410/; https://semanticmastery.com/iframe-backlinks-advanced-strategies-for-seo-success; Moz on widget backlinks: https://moz.com/blog/backlinks-maximize-benefits-avoid-problems-whiteboard-friday).
- Fit: build calculators/counters/widgets with an "Embed this" button + visible credit link. Passive, compounding.

### A10. Student/teacher word-of-mouth — free + no-signup wins classrooms
- Reality: Teachers actively push free tools to students in Facebook groups: "Scribbr's Citation Generators are 100% free, and no registration is required" (https://www.facebook.com/groups/418098809407362/posts/809523470264892); librarians champion the ad-free option MyBib (https://www.librarianinthemiddle.com/blog/the-best-free-citation-generator-for-students). Scribbr ships a Chrome extension for in-page capture (https://chromewebstore.google.com/detail/scribbr-citation-generato/epbobagokhieoonfplomdklollconnkl). Free seating-chart tools advertise "no login required" and no-signup as core features (https://www.schoolgpt.app/seating-chart-generator; https://openeducat.org/tools/seating-chart-maker).
- Lesson: for school markets, "free, no signup, works on a Chromebook, prints clean" beats features. Word-of-mouth via teacher groups = zero-CAC channel.

---

## STREAM B — WEIRD / NEGLECTED PAIN (evidence-locked rows)

### Cluster 1: Education & study tools (post-Quizlet-payworld, AI-conflict era)

**G1. Quizlet paywall betrayal — teachers can't assign study modes anymore**
- Audience: teachers (middle/high school, languages), students.
- Evidence: r/Teachers: "I rely heavily on Quizlet but now its main mode is no longer free so I can't expect students to use it" (https://www.reddit.com/r/Teachers/comments/x3a1lg/); r/quizlet: "extremely disappointed and saddened... two of their most essential learning tools locked behind a paywall" (https://www.reddit.com/r/quizlet/comments/w4hj5w/); teacher-alternatives threads (https://www.reddit.com/r/Teachers/comments/wz08g8/); Facebook parent groups asking for replacements (https://www.facebook.com/groups/142521982451528/posts/4451397564897260).
- EvidenceLevel: E1 | Frequency: seasonal spikes (every school year) | Severity: 7
- Workaround: Knowt (free, imports Quizlet sets), Cram, NoteKnight, StudyKit.
- Existing tools+price: Quizlet Plus subscription; Knowt free; Cram free-ish.
- Complaints: paywall moved core Learn/Test modes; students won't pay.
- Automation: flashcard app = pure CRUD + spaced repetition; trivial to automate; CSV/import-export.
- Distribution fit: r/Teachers (value-first), teacher FB groups, PH, "quizlet alternative" long-tail SEO.

**G2. Flashcard data portability — getting sets OUT of Quizlet**
- Audience: students migrating off Quizlet.
- Evidence: alternatives marketed on "import your existing Quizlet sets, so switching is easy" (https://kvistly.com/blog/best-quizlet-alternatives; https://studygenie.io/blog/quizlet-alternatives) — implies export friction is the switching barrier.
- EvidenceLevel: E2 | Frequency: constant during migrations | Severity: 5
- Workaround: manual copy-paste; per-tool importers.
- Existing: Knowt importer (free), Quizlet export gated.
- Complaints: export blocked/awkward since paywall.
- Automation: paste Quizlet set URL → parse → CSV/Anki/JSON. Small scraper tool.
- Distribution fit: "export quizlet to anki/csv" long-tail SEO; student word-of-mouth.

**G3. Citation formatting pain (students)**
- Audience: students, researchers.
- Evidence: Scribbr/EasyBib/MyBib compete on free formatting; teacher FB groups share "100% free, no registration" (https://www.facebook.com/groups/418098809407362/posts/809523470264892); librarian recommends MyBib for "FREE, no advertising sidebar, pop-up absent" (https://www.librarianinthemiddle.com/blog/the-best-free-citation-generator-for-students) — the complaint encoded there: existing free tools are ad-saturated.
- EvidenceLevel: E1 | Frequency: every assignment cycle | Severity: 5
- Workaround: manual style guides; ad-heavy free generators.
- Existing+price: Scribbr free (upsells), EasyBib (ads/paid tiers), MyBib free.
- Complaints: ads, popups, signup walls, paywalled export.
- Automation: pure formatting logic — ideal micro-tool; niche styles (Bangladesh university formats, Bangla-language sources) underserved.
- Distribution fit: massive evergreen search volume; embeddable; school word-of-mouth.

**G4. Hallucinated citations — verifying AI-generated references**
- Audience: students, professors, researchers, editors.
- Evidence: Nature-linked analysis: "Tens of thousands of publications from 2025 might include invalid references generated by AI" (r/technology thread: https://www.reddit.com/r/technology/comments/1sd0khs/); study: ChatGPT false-citation rates 6%–60% by domain (https://www.psypost.org/chatgpt-hallucinates-fake-but-plausible-scientific-citations-at-a-staggering-rate-study-finds); r/Professors: "My suspicion is that the references are AI hallucinations. But some seem partly real" (https://www.reddit.com/r/Professors/comments/1jsfh1d/; also https://www.reddit.com/r/Professors/comments/1nr0si7/); writers: "Got fake citations from Claude and ChatGPT. How do you handle?" (https://www.reddit.com/r/WritingWithAI/comments/1r9t75e/); LANL research library warning page (https://researchlibrary.lanl.gov/posts/beware-of-chat-gpt-generated-citations).
- EvidenceLevel: E1 | Frequency: rising with AI-assisted writing | Severity: 9 (academic misconduct risk)
- Workaround: manual DOI/Crossref/Google Scholar checking, one by one.
- Existing+price: Sourcely et al. push paid "verify sources" SaaS (https://www.sourcely.net/resources/ai-hallucinated-citations-spot-fake-sources-before-submit); no dominant free batch-verifier found in results.
- Complaints: checking is tedious; professors have no fast triage tool.
- Automation: paste reference list → resolve DOIs/ISBN/titles via Crossref/OpenLibrary/CrossRef APIs → ✅/⚠️ report. Batch, free, no signup. STRONG weird-gold.
- Distribution fit: r/Professors, r/GradSchool, HN Show HN, "check if citation is real" long-tail SEO.

**G5. AI-detector false positives — students need a provenance trail**
- Audience: students (esp. ESL/neurodivergent), teachers, districts.
- Evidence: r/Teachers: "False positives from AI detection in education destroyed my [relationship with students]... One of them cried in my office" (https://www.reddit.com/r/Teachers/comments/1oqozxw/); districts face lawsuits over false accusations (https://www.reddit.com/r/TexasTeachers/comments/1gbyvn6/); Turnitin revised FP rate 1%→4% after deployment; ESL students over-flagged (https://litero.ai/blog/visual-breakdown-false-positives-in-ai-detection-are-hitting-students-hard; https://www.linkedin.com/news/story/when-ai-cheat-detection-goes-wrong-6200812); student: "falsely accused... twice now in one class" (https://www.reddit.com/r/ChatGPT/comments/1d45xdo/); best detectors 85–90% accurate (https://www.reddit.com/r/Professors/comments/1g734zp/).
- EvidenceLevel: E1 | Frequency: constant since 2023 | Severity: 9
- Workaround: keeping Google Docs version history as evidence; screenshot drafts.
- Existing+price: AI detectors (Turnitin institutional, GPTZero etc.) — none serve the *defense* side well.
- Automation: "writing provenance" tool: timestamped draft snapshots / paste-doc → shareable evidence page. (NOT a "humanizer" — ethical line.) 
- Distribution fit: student word-of-mouth is explosive here; r/Teachers careful value-first post; PH.

**G6. De-slopping AI text (writers/marketers)**
- Audience: content marketers, copywriters, editors.
- Evidence: "the actual job became editing AI drafts and nobody warned me the editing is harder than the writing" (https://www.reddit.com/r/content_marketing/comments/1v39e5a/); "HOW TO REMOVE AI SLOP FROM YOUR WRITING" guides (https://www.reddit.com/r/WritingWithAI/comments/1toi0v2/); "AI slop is when you hand AI a topic, copy whatever it gives you, and post it" (https://www.reddit.com/r/DigitalMarketing/comments/1vsoipa/); cleanup guidance content (https://www.louisbouchard.ai/ai-editing).
- EvidenceLevel: E1 | Frequency: daily for AI-using writers | Severity: 6
- Workaround: manual line-editing against slop checklists.
- Existing+price: paid AI-humanizer/detector-evasion SaaS (sketchy); no respected free "slop linter" surfaced.
- Complaints: AI voice (em-dashes, "delve", symmetric sections, list bloat) is recognizable and embarrassing.
- Automation: paste text → static heuristic linter flags slop markers + suggests concrete fixes (no LLM cost). 
- Distribution fit: r/WritingWithAI, r/content_marketing (careful), HN, long-tail "AI words to avoid" SEO; output shareable.

**G7. AI code-slop review fatigue (dev teams)**
- Audience: senior devs / team leads.
- Evidence: "AI Slop PR's are burning me and my team out hard" (https://www.reddit.com/r/ExperiencedDevs/comments/1kr8clp/); "The one AI code review tool I saw was shockingly good at approving AI-generated slop" (same thread).
- EvidenceLevel: E1 | Frequency: daily in AI-using teams | Severity: 7
- Workaround: human review discipline; none good.
- Existing+price: AI code-review bots (paid) — ironically approve slop.
- Complaints: volume + plausible-but-wrong diffs.
- Automation: speculative (E3 on tool shape): diff simplifier / "smell checker" for AI PRs. Validate demand before building.
- Distribution fit: HN, r/ExperiencedDevs.

**G8. ChatGPT conversation export / backup mess**
- Audience: heavy ChatGPT users, prompt hoarders.
- Evidence: r/ChatGPTPro megathread on the many hacky export paths ("exports JSON and HTML files via email download") (https://www.reddit.com/r/ChatGPTPro/comments/1pe3rhn/); OpenAI community thread asking for full-thread export (https://community.openai.com/t/is-there-a-way-i-can-export-every-detail/1068326); genai.stackexchange: "save conversations as well-formatted PDFs... keeping code blocks, tables, and lists readable" (https://genai.stackexchange.com/questions/2810/); multiple third-party guides/extensions filling the gap (https://chromewebstore.google.com/detail/chatgpt-exporter-chatgpt/ilmdofdhpnhffldihboadndccenlnfll; https://tactiq.io/learn/export-chatgpt-conversation).
- EvidenceLevel: E1 | Frequency: ongoing; spikes when users hit context/plan limits | Severity: 5
- Workaround: print-to-PDF, browser extensions, copy-paste.
- Existing+price: several Chrome extensions (free/freemium).
- Complaints: formatting loss (code blocks, tables), JSON useless to non-devs.
- Automation: paste URL/JSON → clean Markdown/PDF. Also Claude/Gemini variants.
- Distribution fit: genai.stackexchange/Reddit answers, CWS extension, long-tail SEO.

### Cluster 2: Money-tracking micro-markets (spreadsheets that should be apps)

**G9. Landlord rent ledgers — especially IRREGULAR payments**
- Audience: small landlords (1–5 units), tenant screening disputes.
- Evidence: r/Landlord: "Can anyone suggest a basic and FREE software" (https://www.reddit.com/r/Landlord/comments/13rft38/); r/Landlord: income/expense tracking "starting to get overwhelming" (https://www.reddit.com/r/Landlord/comments/1hwh9u1/); r/AusPropertyChat: "tracking with a spreadsheet but because it's irregular payments it's difficult to work out what day they are paid up to" (https://www.reddit.com/r/AusPropertyChat/comments/1hy5dv3/); r/shitrentals DIY ledger formulas (https://www.reddit.com/r/shitrentals/comments/1cdgdfq/). People literally BUY tenant-ledger spreadsheets on Etsy (https://www.etsy.com/market/tenant_ledger_spreadsheet).
- EvidenceLevel: E1 | Frequency: monthly forever | Severity: 6
- Workaround: hand-built spreadsheets; bought templates; big property SaaS.
- Existing+price: Stessa free ledger template (lead-gen for SaaS: https://www.stessa.com/blog/rent-ledger-template), Obie template (https://www.obieinsurance.com/blog/fillable-rent-ledger-template), paid property mgmt SaaS.
- Complaints: SaaS is overkill for 2 units; spreadsheets break on arrears/partial payments.
- Automation: rent-ledger generator: rent amount + payment log → running "paid-to date", arrears, printable court-ready PDF. THE killer feature = irregular payments (evidence above).
- Distribution fit: r/Landlord value posts, "rent ledger template" SEO (proven search demand — everyone publishes templates), Etsy-style demand proves payment.

**G10. Gig-driver income/expense/mileage tracking**
- Audience: Uber/DoorDash/Instacart/Pathao drivers.
- Evidence: r/GigWork: "how do you keep track of how much you're making vs. what you're spending?" (https://www.reddit.com/r/GigWork/comments/1id6uyo/); a dev built MileLog "after getting tired of messy spreadsheets" and launched free on r/uberdrivers (https://www.reddit.com/r/uberdrivers/comments/1v023n5/); drivers share community-built spreadsheets tracking $/hour, $/mile, taxes, gas (https://www.reddit.com/r/DoorDashDrivers/comments/199idff/); app-roundups stress IRS-compliant reports (https://gridwise.io/blog/best-mileage-tracker-app).
- EvidenceLevel: E1 | Frequency: daily logging, tax-season spike | Severity: 6
- Workaround: spreadsheets; Stride (free mileage, US); Gridwise/Everlance (freemium).
- Existing+price: Stride free (US-centric), Gridwise/Everlance subscriptions.
- Complaints: US-only apps, over-featured, battery-hungry GPS; spreadsheets manual.
- Automation: $/hour-after-expenses calculator + CSV export; no-GPS manual entry web tool (works on any phone incl. BD riders — Angle: Pathao/foodpanda riders have NO tooling; validate, E3).
- Distribution fit: r/GigWork ecosystem already tolerates free tool launches (MileLog precedent), Telegram bots for rider groups in BD.

### Cluster 3: Community/volunteer ops (the "boring Sunday-night jobs")

**G11. Church announcement slides — rebuilt by hand every single week**
- Audience: church tech volunteers, small churches.
- Evidence: r/churchtech: "I started helping with the projection slides at our parish... honestly, it's way harder than it looks" (https://www.reddit.com/r/churchtech/comments/1qfu2fu/); small-church media FB groups discussing slide workflows (https://www.facebook.com/groups/Smallchurchmedia/posts/3295392383975837); vendor claims traditional approach takes "1–2 hours" weekly (https://gamma.app/explore/content/guides/best-tool-for-making-church-presentations); a paid SaaS exists purely to auto-generate announcement slides — proof of pain (https://tentapps.com/worship-announcement-slides); guide content ecosystem (https://localchurchmedia.com/blogs/local-church-media-blog/church-announcement-slides-that-people-actually-read).
- EvidenceLevel: E1 | Frequency: weekly, perpetual | Severity: 6
- Workaround: PowerPoint/Canva rebuilds; paid church presentation suites (ProPresenter/MediaShout class: https://www.renewedvision.com/blog/church-visual-software-your-guide-to-enhanced-services).
- Existing+price: Tent Apps (paid auto-gen), church presentation software ($$).
- Complaints: volunteer time; suites too complex/expensive for small parishes.
- Automation: paste announcement list → auto-styled 16:9 loop (HTML→PNG/PPTX), free tier with subtle credit. Outputs are projected publicly = built-in virality.
- Distribution fit: r/churchtech, FB small-church-media groups, church-tech directories.
- Adjacent hypothesis (E3, validate): mosques/Islamic centers (jummah announcement slides, prayer timetables, Ramadan schedules) — likely same pain, less tooling; BD-relevant.

**G12. Sports league scheduling for volunteers**
- Audience: rec-league organizers, school clubs.
- Evidence: many free generators already exist (LeagueLobster LITE: https://scheduler.leaguelobster.com; PlayPass: https://playpass.com/sports-software/league-scheduler; SportSchedulerPro: https://sportschedulerpro.com; bracketmaker.app) and r/ultimate still asks for open-source options (https://www.reddit.com/r/ultimate/comments/8a9add/). Market content war (https://www.fastbreak.ai/blog/best-sports-scheduling-software).
- EvidenceLevel: E2 | Frequency: seasonal | Severity: 4
- Verdict: crowded at the "generate round-robin" layer; differentiation must be standings+comms (WhatsApp/Telegram group export). Lower priority.

**G13. Worksheet / rubric generation for teachers**
- Audience: K-12 teachers.
- Evidence: AI worksheet generators now blanket the space (EssayGrader free worksheet maker: https://www.essaygrader.ai; FormsWrite marketing "stop spending hours creating practice materials": https://formswrite.com); rubric time-saving content: "make free rubrics by using editable online templates or free rubric-generator tools to do the heavy lifting" (https://www.kuraplan.com).
- EvidenceLevel: E2 | Frequency: weekly during term | Severity: 5
- Verdict: AI-generic worksheet gen is CROWDED (E2). Open angle: print-perfect, no-signup, *specific curriculum* generators (e.g., BD NCTB-aligned English/math worksheets, Bangla medium) — E3 to validate.
- Distribution fit: teacher FB groups, Pinterest/printable SEO, directories.

**G14. Seating charts / random group makers**
- Audience: K-12 teachers.
- Evidence: demand visible via competition + teacher asks: "Does anyone know of an AI tool for creating seating plans" (FB group, Dec 2024: https://www.facebook.com/groups/149348298190053/posts/389197830871764); "Trusted by 2000+ teachers" on a freemium tool (https://seatingchartmaker.app); an indie launched a free no-login GDPR-friendly generator on r/teachingresources (https://www.reddit.com/r/teachingresources/comments/1rbvuq3/); free no-signup tools proliferating (https://www.schoolgpt.app/seating-chart-generator; https://openeducat.org/tools/seating-chart-maker; https://classroomscreen.com/templates/seating-chart-maker; https://www.gradewithai.com/free-tools/seating-chart-generator).
- EvidenceLevel: E1 (demand proven) but semi-crowded | Frequency: each term/reshuffle | Severity: 4–5
- Automation: roster paste → constraints → printable chart; group randomizer with "no-repeat partner" logic.
- Distribution fit: teacher FB groups + "seating chart maker" SEO (competitive but long-tail constraints winnable).

**G15. Wedding planning spreadsheets (guest list hell)**
- Audience: couples on budgets.
- Evidence: r/weddingplanning constantly exchanges/begs for spreadsheets: template thread (https://www.reddit.com/r/weddingplanning/comments/1bz4g8n/), "Struggling with how to even start making a guest list" using Excel columns (https://www.reddit.com/r/weddingplanning/comments/1cn6i6p/), "Anyone have a wedding excel sheet organizer?" (https://www.reddit.com/r/weddingplanning/comments/l4y0lf/), a shared 36-page Google Sheets workbook (https://www.reddit.com/r/weddingplanning/comments/17qbrhh/), and a whole wiki page of curated spreadsheets on r/Weddingsunder35k (https://www.reddit.com/r/Weddingsunder35k/wiki/weddingplanningspreadsheets).
- EvidenceLevel: E1 | Frequency: evergreen (new cohort every year) | Severity: 5
- Workaround: inherited 36-tab spreadsheets.
- Existing+price: The Knot etc. (US-centric, signup-walled); Excel templates.
- Complaints: spreadsheet formulas break; RSVP tracking chaos.
- Automation: guest-list + RSVP + budget mini-app w/ printable exports; or gorgeous free spreadsheet templates as email-capture/SEO bait.
- Distribution fit: r/weddingplanning (template shares are culturally allowed), Pinterest, long-tail SEO.

### Cluster 4: Creators

**G16. Podcast show notes — "one of the most hated steps of podcasting"**
- Audience: indie podcasters.
- Evidence: School of Podcasting: "One of the most hated steps of podcasting is writing show notes" (https://www.schoolofpodcasting.com/tackling-show-notes-how-long-should-my-notes-be); r/podcasting thread on show-notes time sinks (https://www.reddit.com/r/podcasting/comments/1jf2kkn/); FB podcast groups polling time-to-write (https://www.facebook.com/groups/PodcastCommunity/posts/24891633817141919); AI generators exist but SaaS-priced (Castmagic/Podium/Swell AI head-to-head: https://thepodcasttechstack.substack.com/p/show-notes-generators-tested-which).
- EvidenceLevel: E1 | Frequency: weekly per show | Severity: 6
- Workaround: writing manually; paying SaaS subscriptions.
- Complaints: existing AI tools = another monthly subscription for hobbyists.
- Automation: paste transcript → timestamps + summary + title options + chapter marks, free single-episode tier.
- Distribution fit: r/podcasting, podcast FB groups, "show notes generator" SEO; output includes backlink.

### Cluster 5: Bangladesh / Global South specifics

**G17. BCS & competitive-exam prep: question banks exist, access costs**
- Audience: BD government-job aspirants (BCS, bank jobs, primary teacher).
- Evidence: scale of demand: Ogroshor claims "1,600,847+ questions" practice bank (https://ogroshor.com); Studypress markets "All BCS 10th–45th questions and solutions" (https://studypress.org); Android apps with 100k+ MCQs (https://play.google.com/store/apps/details?id=com.bcsprostuti.tanim.bcsprostuti; https://play.google.com/store/apps/details?id=com.onlineschool.bcsquestionbank). Direct pain quote: "I'm a graduate and willing to sit for the next BCS. Not in a position to afford coaching fees and multiple books right now. Please help me choosing the best question bank" (BCS is Fun FB group: https://www.facebook.com/groups/bcsisfun/posts/1075857126861748).
- EvidenceLevel: E2 | Frequency: continuous; huge population | Severity: 6
- Workaround: coaching centers, books, freemium apps.
- Existing+price: Ogroshor/Studypress/apps — freemium/paid tiers.
- Complaints: cost + app quality; fragmentation of past papers.
- Automation: free past-paper MCQ practice web app / Telegram quiz bot (Bangla UI), ads-monetized. Telegram = massive BD student usage.
- Distribution fit: Telegram channels (BCS prep channels are huge), FB groups, Play-store-free-web angle.

**G18. Bangla typing / Unicode on the web**
- Audience: BD/Indian Bengali writers, students, officials.
- Evidence: Avro Keyboard is the de-facto standard but is Windows-desktop (https://www.omicronlab.com/avro-keyboard.html; https://en.wikipedia.org/wiki/Avro_Keyboard); users hit broken-Unicode problems (Avro's own FB troubleshooting posts: https://www.facebook.com/avrokeyboard/posts/10152303772742286; Microsoft Q&A: "Problem with Unicode Typing" resolved via Avro: https://learn.microsoft.com/en-us/answers/questions/4174073/); OpenBangla Keyboard is the OSS alternative (https://github.com/codayon/openbangla-keyboard). Gap visible in results: no dominant *web-based* Avro-style phonetic transliterator surfaced; long-tail Bangla typing content farms exist (https://bangla.arifulsh.com/avro-keyboard-download/index.html).
- EvidenceLevel: E2 (ecosystem evidence; direct complaint threads thin) | Severity: 5
- Automation: web phonetic Bangla transliteration (client-side JS), Unicode↔Bijoy/legacy conversion (E3 hypothesis — legacy Bijoy→Unicode conversion is a known BD publishing need; validate), Bangla OCR for scanned question papers (E3).
- Distribution fit: Bangla long-tail SEO is nearly empty; BD FB groups; zero-competition advantage.

**G19. PTA / school-committee tracking (weak signal — validate)**
- Audience: PTA treasurers/volunteers.
- Evidence: only one strong artifact found: JP "PTA hell" attendance-tracking template post — "Saving you from the hell of PTA attendance tracking... Google Forms, Sheets and Apps Script" (https://note.com/s0uh3y/n/nc6552a14074b) (Japanese market, translated relevance).
- EvidenceLevel: E3 | Severity: 4 | Frequency: term-based
- Automation: attendance/dues tracker, fundraiser thermometers.
- Verdict: park until better evidence; likely subsumed by G11/G15-style volunteer pain.

### Cluster 6: The Excel meta-pattern (multiple rows above are the same disease)

**G20. Spreadsheets-as-products: people repeatedly ask "how do I build X in Excel/Sheets" — and PAY for templates**
- Audience: everyone above (landlords, gig drivers, couples, PTA).
- Evidence (meta): tenant-ledger spreadsheets are SOLD on Etsy (https://www.etsy.com/market/tenant_ledger_spreadsheet); gig drivers maintain community spreadsheets (https://www.reddit.com/r/DoorDashDrivers/comments/199idff/; https://www.facebook.com/groups/1457430271994284/posts/1695867808150528); wedding wiki curates spreadsheets (https://www.reddit.com/r/Weddingsunder35k/wiki/weddingplanningspreadsheets); landlords trade formula advice (https://www.reddit.com/r/shitrentals/comments/1cdgdfq/).
- EvidenceLevel: E1 (pattern-level) | Severity: 5 | Frequency: continuous
- Insight: every recurring spreadsheet request = a micro-tool spec with validated demand AND proven willingness to pay (template sales). Build the tool, give the spreadsheet away free for SEO/email capture.
- Distribution fit: exactly the long-tail "rent ledger template"-style queries; embeddable outputs.

**G21. Free review widgets for small-business sites (embed-distribution wedge)**
- Audience: small businesses/agencies.
- Evidence: r/divi: "Does anyone have recommendations for a free google review widget?" (https://www.reddit.com/r/divi/comments/1dcy87b/); free offerings compete on "100% free... 2 minutes, no coding" (https://www.review-widget.net; https://www.sociablekit.com/tutorials/embed-google-reviews-iframe); commercial leaders upsell hard (https://embedsocial.com/google-reviews-widget).
- EvidenceLevel: E2 | Severity: 4
- Automation: Google Places API → embeddable iframe/JS widget w/ credit link (A9 pattern).
- Distribution fit: widget embeds = compounding backlinks; WordPress/Wix tutorial SEO.

### Cluster 7: Explicit E3 hypotheses (no direct evidence found in this run — listed for follow-up validation only)
**G22. Mosque/Islamic-center tooling (announcement slides, prayer-time images, Ramadan schedule generators)** — adjacent to G11 evidence; BD-relevant. Validate in BD/UK Muslim FB groups.
**G23. Bijoy↔Unicode Bangla text conversion** — adjacent to G18 (legacy publishing in BD still uses Bijoy encoding); validate demand volume in BD publisher/typist groups.
**G24. BD gig-economy rider tooling (Pathao/foodpanda earnings + mileage)** — adjacent to G10; US apps don't cover BD; validate in rider FB groups.
**G25. "AI-generated code that doesn't run" fixer for non-devs (vibe-coders)** — adjacent to G7; validate in r/ChatGPTCoding-class communities (not searched this run).

---

## TOP SYNTHESIS (for the $0 BD solo dev)

**Distribution stack (in order of expected ROI/effort):**
1. **Embeddable widgets + watermark/credit on every output** (A8, A9) — passive, compounding, free.
2. **Tool directories batch-submit + Product Hunt one-shot** (A2, A3) — one weekend of work, permanent backlinks.
3. **Long-tail programmatic-ish SEO on zero-competition queries** (A1) — especially Bangla-language queries (G18: almost no competition); expect 6–12 months.
4. **Telegram-native tools/bots with Stars + AdsGram** (A5) — BD-audience-native, payment rails that actually work from Bangladesh.
5. **Value-first Reddit/HN answers** (A7) — the tool IS the answer to the exact complaint threads catalogued above.
6. **GitHub Pages + awesome-list placement** (A6) as free hosting/secondary surface; **CWS extensions** (A4) as free trust-badge storefronts.

**Weird-gold shortlist (evidence-weighted):**
1. **G4 citation-verify** (batch hallucination checker) — E1 pain, severity 9, no free incumbent, pure API automation.
2. **G9 irregular-payment rent ledger → court-ready PDF** — E1 pain + proven template purchases (G20).
3. **G5 student provenance/evidence trail vs AI-detector false positives** — E1, severity 9, explosive student word-of-mouth.
4. **G11 announcement-slide generator (church first, mosque adjacent)** — weekly recurring pain, projected output = free advertising (A8 loop).
5. **G17 Telegram BCS quiz bot** — massive BD audience, weak incumbents on Telegram specifically.
6. **G6 slop-linter** — zero-cost static heuristics, shareable output, HN-friendly.
7. **G8 chat-export cleaner** — proven multi-format demand; CWS + web.
