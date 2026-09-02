# PAYMENTS RESEARCH — BD dev, no bank account, no card (bKash / Nagad / Rocket / crypto only)

Task ID: 2-f | Agent: research-payments | Date of research: 2026-09-02
Scope: which revenue rails actually work end-to-end (earn → cash to hand) for a Bangladesh-based solo dev of free web micro-tools + Telegram bots/mini-apps, with NO bank account and NO card. Can receive: bKash, Nagad, Rocket, TON/GRAM, BTC, USDT.
Evidence tags: E1 = official/first-party doc (priced/dated), E2 = reputable secondary, E3 = community report/anecdote. All URLs checked via live web search on 2026-09-02 (recency filters used for policy questions).

---

## 0. LEGAL BASELINE — CRYPTO IN BANGLADESH (read first)

- Bangladesh Bank (central bank) 2017 notice: cryptocurrencies are NOT legal tender; transactions "not authorized" under Foreign Exchange Regulation Act 1947 and Money Laundering Prevention Act. Reaffirmed in 2022 FX regulations ("virtual currencies not permitted"). [E2: lightspark.com "Is Crypto Legal in Bangladesh" Aug 2025; freemanlaw.com; en.wikipedia.org Legality_of_cryptocurrency; disruptionbanking.com Dec 2025]
- No specific criminal statute bans individual possession/holding; it is a "legal grey zone" — no licensing, no consumer protection, and P2P crypto trading is nonetheless widespread and booming (The Financial Express column, Jan 2026; TBS News "How crypto thrives in Bangladesh's legal grey zone"). [E2]
- Practical risks: (a) receiving money into bKash/Nagad from many unknown P2P counterparties can trigger AML flags/freezes on the MFS wallet — this is the real enforcement surface, not criminal prosecution of holding; (b) zero legal recourse in P2P scams; (c) policy could harden at any time.
- NET: holding/receiving crypto = grey zone, common, but treat as legally fragile; never flaunt, use one trusted counterparty where possible. [Confidence: HIGH on status; the operational risk is wallet freezes + scams]

Token note: Toncoin (TON) was renamed **GRAM (GRAM)** 1:1 effective 2026-06-15 after community vote (81% support). Blockchain still "The Open Network". All old "TON" payout literature now refers to GRAM. [E1: x.com/ton_blockchain Jun 9 2026; crypto.news Jun 26 2026; Binance Academy Jun 22 2026]

---

## 1. RAIL LEDGER

Format: Rail / Works for BD (no bank, no card)? / What's needed / Minimums / Fees / Timeline / Risk-Legality / Sources / Confidence

### R1. Telegram Stars (bot & mini-app paid features) → withdraw via Fragment → GRAM
- Works for BD: YES (payout to self-custody TON wallet; geography-independent).
- Needed: Telegram bot/mini-app with Stars-enabled paid features; connect Fragment payout to a TON wallet (Tonkeeper / Wallet in Telegram / TON Space).
- Minimums: 1,000 Stars minimum withdrawal (~US$13 at payout rate). 21-day hold per Star from receipt. [E2: grambase.ai Stars Guide Apr 2026; incrypted.com Jul 2026; web3.bitget.com academy Sep 2025; starsearn.com 2026]
- Fees/rates: payout pegged ≈ **$0.013 per Star** in GRAM via Fragment (users pay $0.02 in-app; ~$0.0133 via web) → embedded haircut vs in-app price ≈ 35%; Fragment market spread 2–3%; Fragment itself charges no additional withdrawal fee. [E2: popsters/Telegram announcement; tribute.top Aug 2026; telestars.io; starsearn.com]
- KYC: Mixed evidence. Fragment made KYC mandatory for PURCHASES Nov 2024 (dropstab.com Apr 2026). For WITHDRAWALS: starsearn 2026 says no KYC to a self-custody wallet; but multiple 2025 Reddit reports say Fragment/Telegram Wallet prompted KYC during withdrawal (r/Telegram "solved after I completed KYC… once for the wallet, once for the fragment"). Custodial Wallet-in-Telegram always requires KYC. Assume: possible KYC prompt; passport/NID suffices. [E2+E3]
- Timeline: 21-day hold → withdraw same day → GRAM in wallet in minutes.
- Risk: crypto legality grey zone (§0); rate tied to GRAM price until swapped.
- Sources: grambase.ai/blog/telegram-stars-guide-2026; incrypted.com/en/telegram-stars; help.wallet.tg/article/632; reddit r/Telegram threads (Aug 2025, Oct 2025). Confidence: HIGH on mechanics/MIN; MEDIUM on KYC.

### R2. Telegram channel Ads revenue share (Telegram Ad Platform → payout in GRAM via Fragment)
- Mechanics: public channels ≥1,000 subscribers that show Telegram sponsored ads keep 50% of ad revenue; payout in Toncoin (GRAM) via Fragment, same 1,000-min & 21-day style rules as Stars. Launched Mar 2024 in "nearly 100 countries". [E1: telegram.org/blog/monetization-for-channels Mar 31 2024; E2: theblock.co Feb 2024; scrile.com Aug 2026; autogram.ninja Apr 2026]
- BD eligibility: NOT explicitly confirmed in any official country list found. The monetization toggle appears in channel settings per-country. Action: check Statistics → Monetization in a BD account. AdsGram (R3) is the documented BD-safe alternative. Confidence: MEDIUM-LOW (works in many countries incl. South Asia; BD unconfirmed).

### R3. AdsGram — ads inside Telegram mini-apps/bots (TON Foundation-backed)
- Works for BD: YES — pays in **USDT on TON network** by default (also USDT TRC20 / fiat).
- Minimum: **$100** withdrawal; requests processed within 24h weekdays / 48h weekends; one smaller withdrawal per month allowed. [E1: adsgram.ai/monetization; adsgram.ai blog Aug 2026 comparisons]
- Fees: network fee only on payout; no stated commission (rev-share implied in CPM).
- Risk: crypto grey zone; $100 trapped until threshold. Confidence: HIGH.

### R4. USDT / GRAM → BDT off-ramp via P2P marketplaces (THE core off-ramp)
- Venues live for BD (all verified serving BDT):
  - **OKX P2P**: "Sell USDT to BDT — bKash, Nagad, Rocket" listed; "P2P trading on OKX is free" (0% platform fee). [E1: okx.com/p2p-markets/bdt/sell-usdt]
  - **Bybit P2P**: USDT/BTC↔BDT with bKash + Nagad payment methods; "Zero platform fees", escrow. [E1: bybit.com/en/p2p/sell/USDT/BDT; /en/p2p/buy/USDT/BDT]
  - **Binance P2P**: live bKash / Nagad / Rocket / bKash-Agent BDT markets (p2p.binance.com/en/trade/bkash etc.). BUT: Binance lists Bangladesh among restricted countries (leodex.io Jun 2026; datawallet.com Jul 2026); Mar 2025 policy: P2P Cash Zone closed, stricter P2P KYC. [E1 platform pages + E2 restrictions lists]
  - **NoOnes**: bKash-funded USDT P2P. [E2]
- KYC: exchange account requires full KYC (NID/passport) before P2P (Binance mandatory ID for trading/withdrawal — datawallet Jul 2026). Receiving crypto to a self-custody wallet needs no KYC; the EXCHANGE off-ramp does.
- Spreads/pricing: USDT ≈ BDT 122.7 (Coinbase converter Sep 2026) vs official interbank ≈ BDT 119.9/USD (Xoom) → selling USDT nets a **2–3.5% FX premium over the official rate** (this is the market rate; the "cost" vs your USD value is ~0 if sold at market, plus bKash receive is free).
- Scam risks: only trade inside escrow; never release crypto before bKash money lands IN YOUR WALLET (screenshot forgery is the classic BD P2P scam); prefer high-completion vendors; keep trade amounts modest to avoid AML flags.
- Risk-legality: grey zone (§0); Binance-BD restricted-country mismatch = platform risk.
- Confidence: HIGH (official P2P pages) / MEDIUM on longevity.

### R5. Direct international remittance → MFS wallet (bKash / Nagad / Rocket) WITHOUT a bank
- bKash: official "Money Transfer Service" — remittance from **150+ countries direct to a bKash wallet, 24/7, no bank account needed**; Western Union → bKash direct (westernunion.com/it/en/providers/bkash.html); remittance-flagged funds cash out from ATMs at **৳7 per ৳1,000 (0.7%)** (vs 1.49% normal ATM). [E1: bkash.com/en/products-services/money-transfer-service]
- Government incentive: **+2.5% cash incentive** on remittances received through legal channels into bank account or mobile wallet (bKash official; Taptap Send & WU pages confirm, Aug 2026). [E1/E2]
- Rocket (Dutch-Bangla): foreign remittance credited to Rocket account within 24–72h (DBBL Exchange House ~24h); WorldRemit and ACE Money Transfer support Rocket wallet. [E1: dutchbanglabank.com/rocket/foreign-remittance.html; worldremit Oct 2017; ACE Sep 2025]
- Nagad: MFS remains operational (received BB licence for interoperable payment system after the 2024 Nagad Digital Bank licence saga); MFS inward-remittance volumes tracked by BB. Use bKash as primary; Nagad as backup. [E2: TBS/Daily Star/Medium BD 2025-2026]
- Use case for the dev: a foreign client can pay you person-to-person via WU/MoneyGram/ACE/Taptap online → funds land in your bKash wallet in BDT. Legal channel, +2.5% incentive, 0.7% cash-out.
- Gotchas: sender fees + FX margin (~1.5–3.5% baked into WU/ACE rates); name on transfer must match bKash KYC; small frequent transfers invite questions; this is remittance — technically for family support, receiving client fees this way is a compliance grey area (though it's the legal rail most BD freelancers used pre-Payoneer).
- Confidence: HIGH on rails (official pages); MEDIUM on tax/compliance posture.

### R6. Payoneer → bKash (the "no-bank" fiat rail for global platforms)
- Official partnership: Payoneer ↔ bKash direct withdrawal, **min BDT 1,000, max BDT 250,000 per transaction**, "zero additional paperwork"; funds land in bKash in seconds; ATM cash-out of these remittance funds at ৳7/৳1,000 (0.7%). [E1: bkash.com/en/products-services/remittance/payoneer; payoneer.com/resources/business/weve-partnered-with-bkash; nsave.com Apr 2026]
- Fee: **Payoneer charges 3% conversion fee + $1 per withdrawal** (bKash official page); context: Payoneer's Mar 2025 fee restructuring put BD bank-withdrawal fee at ~3% too (community reports); receiving USD from marketplaces/platforms is free. [E1 bKash page + E3 FB groups]
- Account opening: NID/passport based (BD freelancer tutorials use NID); a local bank is NOT required if you withdraw to bKash; Payoneer also issues virtual Mastercard for online payments. [E2: LinkedIn NID tutorial; payoneer resources; Medium]
- Also: Payoneer card ATM withdrawal in BD possible ("withdraw at any ATM" — payoneer.com BD contractor page).
- Fee chain total to hand: ~3% + $1 (conversion) + 0.7% (cash-out) ≈ **3.7–4% per dollar** (+$29.95/yr account fee if not waived; receiving is free from partner platforms).
- Confidence: HIGH (first-party pages on both sides).

### R7. Crypto-native ad networks
- **Adsterra**: YES crypto payout — **USDT (TRC20/ERC20) & BTC via INXY payments**, minimum **$100**, ~1–2 business days, fee 1% + network (BTC) per Apr 2026 payout-terms summary; other methods: WebMoney/Paxum min **$5**, PayPal $100, local-currency payouts min $25 (Apr 2026 blog). The "$5 minimum" is WebMoney/Paxum ONLY — NOT crypto. [E2: adsterra.com/blog/payouts-in-local-currency Apr 27 2026; affiliatebooster; gologin; facebook groups Apr 2026; blackhatworld Nov 2024 (INXY USDT $100)]. Cashing WMZ/Paxum in BD is impractical → crypto USDT $100 min is the real rail. Confidence: HIGH.
- **A-Ads / AADS (aads.com)**: crypto-native, **no KYC**, pays daily-ish in BTC, min withdrawal **0.001 BTC** (~$110 at 2026 prices; historically lower — check live). Pays directly to your BTC wallet, no bank/exchange needed to RECEIVE. [E2: coinbound.io A-Ads review Dec 2025; blockchain-ads.com; bitmedia.io May 2025]. Confidence: MEDIUM-HIGH (legacy network, low CPMs).
- **PropellerAds**: min $5–$20 but methods = PayPal / Payoneer / Skrill / wire ($500–550 min); **NO crypto payouts** → for BD viable only via Payoneer (then bKash). [E2: propellerads blog Nov 2018 ($5); help.propellerads.com Jul 2026; payoneer.com/resources/business/propellerads (≥$20, wire $550)]. Confidence: HIGH.
- **Monetag** (PropellerAds sister for web/app): weekly payouts, min **$5**, PayPal/Payoneer/Skrill/wire → Payoneer path works for BD. [E2: hilltopads blog Mar 2026]. Confidence: MEDIUM.
- **Ezoic**: min **$20** (default; user-adjustable), methods PayPal / Payoneer / wire; no traffic minimum to join. PayPal unavailable BD → Payoneer path. PayPal route charges ~3.2%. NET ~30. [E1: support.ezoic.com KB "Ezoic Payments"; E2 buildersociety]. Confidence: HIGH.
- **Monumetric**: 10,000 pageviews/mo minimum to join; Net-60 payouts; not relevant for a new micro-tool site. [E2: bloggingguide.com Jan 2023; monumetric.com]. Confidence: MEDIUM.

### R8. Google AdSense
- Minimum payout **$100**; payment issued between the 21st–26th of the month AFTER threshold + no holds; first payout realistically 1–3 months after crossing $100 (plus 2–4 weeks for first-time PIN/address verification). [E1: support.google.com/adsense/answer/7164703; /answer/1709858]
- BD payment method: **wire transfer to a bank account** (support.google.com/adsense/answer/3372975). Western Union Quick Cash discontinued (legacy support page remains; WU removal confirmed by publishers ~2020–2021). Checks discontinued long ago.
- **Verdict: NOT viable without a bank account.** (Indirect hack = AdSense→someone else's/relative's bank, or via Wise/WorldFirst receiving account — WorldFirst markets AdSense receiving, but BD onboarding unclear + adds ToS risk. Not recommended.) [E1/E2]. Confidence: HIGH.

### R9. Digital-product platforms (sell templates/tools/ebooks)
- **Gumroad**: payouts = bank deposit OR PayPal ("For countries where bank deposits are not available, we offer PayPal…"; Payoneer/TransferWise explicitly NOT supported). **BD bank deposits were added** (community reports late 2024: "Gumroad now accepts direct bank transfer payout to Bangladesh"). Without a bank: PayPal is absent in BD → **blocked**. [E1: gumroad.com/help/article/13-getting-paid; E3: FB group Gumroad Bangladesh; LinkedIn Arshil Haque Dec 2024]. Confidence: HIGH.
- **Payhip**: pays via PayPal or Stripe only → **both unavailable BD → blocked**. [E1: payhip.com docs/blog]. HIGH.
- **Ko-fi**: "paid instantly into your own PayPal or Stripe account" → **blocked for BD**. [E1: help.ko-fi.com Jan 2025 + ko-fi.com]. HIGH.
- **Buy Me a Coffee**: payouts via Stripe Connect; supported-countries page (updated Aug 2026) = Stripe-availability list; BD not Stripe-supported → **blocked**. BD devs confirm (r/Dhaka: BMC, Ko-fi, Patreon "don't work in Bangladesh", 2025). [E1: help.buymeacoffee.com Aug 2026; E3 reddit]. HIGH.
- **Lemon Squeezy**: "You can sell if you can get paid into a bank or PayPal account in one of our supported countries" (bank payouts 79 countries + 200+ PayPal countries). BD has neither → **blocked** (unless BD is in the 79 bank countries — not evidenced; and you have no bank anyway). [E1: docs.lemonsqueezy.com/help/getting-started/getting-paid + /supported-countries]. HIGH.
- **Paddle** (Merchant of Record): payouts to sellers via **Payoneer** (documented how-tos; Reddit notes ~$15 payout charge) / bank / PayPal. MoR model means Paddle handles VAT/sales tax and accepts cards worldwide on your behalf. **BD sellers CAN route payouts to Payoneer → bKash.** Gate: Paddle seller verification (KYB: ID + website review; some BD devs report approval friction/delays). This is the only mainstream SaaS-checkout that plausibly works for you. [E2: wpsmartpay.com Feb 2025; reddit r/SaaS; paddle.com/help "When and how do I get paid"]. Confidence: MEDIUM (Payoneer payout well-attested; BD seller acceptance anecdotal).

### R10. Accepting payments FROM users globally (payment processors)
- **Stripe**: NOT available in Bangladesh (46 fully-supported countries as of Dec 2025; BD on Asia unsupported lists). [E2: redstagfulfillment Dec 2025; foundeck; cs-cart Apr 2026]. Confidence: HIGH.
- **PayPal**: Bangladesh not on PayPal's supported-countries list (personal receive/withdraw unavailable). [E2: chinaitechpay 2026 list; cs-cart Feb 2026]. Confidence: HIGH.
- **NOWPayments** (crypto gateway, 200+ coins): fees **0.5% service (single-currency) / +0.5% exchange if converting / total up to 1.5%**, **0% withdrawal fee** from custody, min payment ~$2–5 per pair, no fixed min/max balances; settles in USDT to your wallet. Non-custodial API + widgets; works for BD (sign-up free). [E1: nowpayments.io/pricing; /help; tradingview/chainwire Feb 2026 (0% network fee USDT-TRC20 promo)]. Confidence: HIGH.
- **CoinGate**: flat **1%** processing, free crypto withdrawals, settlements 180+ countries; merchant KYB required. [E1: coingate.com/pricing]. Confidence: HIGH. (NOWPayments simpler for a solo dev; CoinGate fine too.)
- **BTCPay Server**: free, open-source, **self-hosted**, zero processing fees (only BTC/LN network fees + your VPS ~$5/mo or a free-ish Cloudflare-Tunnel + home/small VPS setup); BTC + Lightning only (no native USDT). Best fee profile, worst setup cost; fits $0-budget poorly unless paired with the infra stack. [E1: btcpayserver.org]. Confidence: HIGH.
- Choice: **NOWPayments → USDT (TRC20/TON) → P2P → bKash** is the practical "accept money from anyone on earth" rail for BD.

### R11. Crypto-exchange affiliate programs (pay in USDT, no bank)
- **Binance Affiliates**: up to **50%** commission on referral trading fees (spot ~41–45%; co-invite cap 45%); settled hourly/real-time; postaffiliatepro lists "no minimum payout". Payout credited to exchange balance (crypto/USDT-convertible). KYC required; BD on restricted list → account risk. [E1: binance.com/en/events/affiliate; FAQ Oct 2025; E2 creator-hero May 2026]. Confidence: HIGH on terms / MEDIUM on BD durability.
- **OKX Affiliates**: default **30%**, upgradeable to 50%; **paid in USDT** monthly. [E1: okx.com/affiliates; okx rules Aug 2026]. Confidence: HIGH.
- **Bybit Affiliates**: 30% base → up to 50% of trading fees (+5% Earn, +10% sub-affiliate); **payouts default to USDT, daily by ~04:00 UTC**, no meaningful minimum. [E2: strackr Feb 2026; whaleportal; bitdegree May 2026]. Confidence: HIGH.
- These pay YOU in USDT inside the exchange → withdraw via exchange P2P (R4) → bKash. Cheapest chain of all (R12, Chain C).

### R12. Telegram Stars wedge — buying Stars cheap (meta-note)
Fragment KYC exists for buying; third-party top-ups (MyStars etc.) advertise no-KYC, but the DEV-side rail that matters (withdrawal) is R1. No action needed.

---

## 12b. FEE CHAINS (per $100 of gross, realistic 2026 numbers)

**Chain A — Telegram Stars (bot paid feature) → cash in hand**
1. User buys Stars in-app: $0.02/Star (Apple/Google take up to 30% upstream of you) or $0.0133 via web/Fragment.
2. You withdraw at ≈$0.013/Star → vs $0.02: −35% already gone; vs web price: −2.3%.
3. Fragment→GRAM: no fee, but 2–3% market spread on the way out if you swap instantly.
4. GRAM→USDT on Bybit/OKX: 0.1% spot + ~$0.01 network ≈ 0.15%.
5. USDT→BDT P2P (sell at market 122–124 BDT): ~0% vs market (you actually net +2–3.5% vs the official 119.9 rate).
6. bKash cash-out: 1.395% (Priyo agent) – 1.85% (agent); ATM 1.49%. (0.7% only for remittance-flagged funds.)
- **Total: ~4–5% below web-price value** (but ~35% below iOS sticker price). Latency: 21-day hold + 1–2 days. Min: $13 (1,000 Stars).

**Chain B — Adsterra USDT payout (web ad revenue)**
Payout USDT-TRC20, fee 1% + ~$1 network, min $100 → P2P sell ~0% (+2–3.5% FX-rate bonus vs official) → bKash cash-out 1.395–1.85%.
- **Total: ~2.5–3% + $100 threshold latency.** Latency: Adsterra NET-... (bi-monthly ~1st/16th, 1–2 days processing).

**Chain C — Bybit/OKX/Binance affiliate USDT (referral commissions)**
USDT daily (Bybit) / hourly (Binance) / monthly (OKX) → exchange P2P → bKash.
- **Total: ~1.4–2% + 2–3.5% FX bonus vs official rate → effectively cheapest rail (~2% or less net). No minimum worth mentioning. Cheapest verified chain.**

**Chain D — Any Payoneer-paying platform (Paddle / PropellerAds / Ezoic / freelance marketplaces)**
Platform → Payoneer free → withdraw-to-bKash 3% + $1 → cash-out 0.7–1.85%.
- **Total: ~3.7–4.9% + $1/tx**, min BDT 1,000 (≈$8), cap BDT 250,000/tx. Latency: platform NET terms + minutes.

**Chain E — Foreign client pays via WU/MoneyGram/ACE/Taptap → your bKash (remittance rail)**
Sender fee ~$0–4 + embedded FX margin 1.5–3.5% → you get BDT in wallet → +2.5% govt incentive → ATM cash-out 0.7%.
- **Total: ~1–3% net of incentive (sometimes ≈0 or positive).** Latency: minutes–24h. Legality: fully legal channel; compliance caveat (it's "remittance", not invoiced export income).

**Chain F — Google AdSense** → BROKEN (needs bank wire). 100% blocked, not merely costly.

---

## 13. RANKED VERDICT (BD, no bank, no card)

WORKS END-TO-END (ranked by fee efficiency × reliability):
1. **Crypto affiliate commissions (Bybit/OKX/Binance) → exchange P2P → bKash** — ~2% total, paid in USDT, no minimum, fastest settlement. Needs exchange KYC (NID/passport). Risk: BD-restricted listing on Binance; grey-zone legality.
2. **Telegram Stars (bot/mini-app monetization) → Fragment → GRAM → USDT → P2P → bKash** — ~4–5% total, 21-day hold, 1,000-Star min. The only native monetization inside Telegram itself; pair with AdsGram ads.
3. **AdsGram (mini-app ads) → USDT-TON → P2P → bKash** — ~3%, $100 min, 24h payouts.
4. **Adsterra (web tools) → USDT-TRC20 → P2P → bKash** — ~3%, $100 min; the "$5 min" is WebMoney/Paxum only, not crypto.
5. **Paddle (sell software/licences as Merchant of Record) → Payoneer → bKash** — ~4–5% + $1/tx; only mainstream SaaS checkout open to you; seller-approval friction.
6. **Payoneer as universal receiver** (PropellerAds/Ezoic/freelance marketplaces) → bKash — ~4% + $1/tx; NID-based signup, no bank needed.
7. **NOWPayments (accept crypto payments from users) → USDT → P2P → bKash** — 0.5–1.5% gateway + ~2% off-ramp; min charge ~$2–5. BTCPay = free-but-BTC-only alternative.
8. **Direct MTO remittance (WU/MoneyGram/ACE/Taptap → bKash/Rocket wallet)** — cheapest per-dollar (net ~1–3% after +2.5% incentive) but only if you have a foreign payer willing to use an MTO; compliance grey area for client fees.

DOES NOT WORK (no bank/card):
- **Google AdSense** (wire-to-bank only in BD; WU Quick Cash dead) — $100 threshold moot.
- **Gumroad** (needs BD bank or PayPal), **Payhip / Ko-fi / Buy Me a Coffee / Patreon** (Stripe/PayPal only), **Lemon Squeezy** (bank/PayPal in supported countries), **Stripe** (BD unsupported), **PayPal** (BD unsupported), **PropellerAds crypto route** (none exists — Payoneer only), **Payoneer→bank** (no bank).
- Nagad/Rocket: receive-side only (P2P vendors + remittance) — fine, but bKash is the deepest-liquidity off-ramp (most P2P vendors, official Payoneer + WU + MoneyGram integrations).

BIGGEST GOTCHAS
1. Crypto = grey zone in BD (BB 2017 notice + FERA 1947): the risk is MFS-wallet freezes from many small P2P credits + zero scam recourse — not prosecution for holding.
2. Binance lists BD as restricted (Mar 2025: stricter P2P KYC, Cash Zone closed); Bybit/OKX P2P pages actively market bKash/Nagad/Rocket — prefer them for longevity.
3. Fragment (Stars) added mandatory KYC for purchases Nov 2024; withdrawal KYC reports are mixed — assume KYC-able (passport/NID) before scaling.
4. Every "$5 minimum" you'll read (Adsterra WM/Paxum, PropellerAds, Monetag) is a NON-crypto, BD-unusable method; crypto min is $100 (Adsterra/AdsGram).
5. Toncoin is now GRAM (June 2026) — old tutorials saying "withdraw TON" still apply 1:1.
6. Telegram channel-ads 50% revenue share (1,000+ subs) is NOT officially confirmed for BD — check the in-app monetization toggle; AdsGram is the guaranteed fallback.
