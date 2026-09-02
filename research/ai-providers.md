# Free AI Inference Providers — Verified Research (Task 2-d)

**Checked: 2026-09-02 (UTC).** For a $0-budget, Bangladesh-based developer building a multi-provider AI routing gateway.
Confidence levels: `verified-official` = read directly from provider's official docs/pricing page on the date above; `secondary-source` = multiple consistent third-party reports (2026-dated); `unverified` = could not confirm — do not quote numbers.

> **⚠️ Caveat for the report:** The 2025 free-tier landscape has changed significantly. Three big shifts: (1) Google slashed Gemini free RPD ~90-98% in Dec 2025, (2) Cerebras and Together AI killed their permanently-free tiers (now credits-only), (3) **GitHub Models was fully retired July 30, 2026**. Do not republish 2025-era numbers.

---

## 1. Google AI Studio / Gemini API — verified-official
- **What's free:** "Free — for developers and small projects": limited access to certain models, free input & output tokens, AI Studio access. API key via AI Studio, no credit card required for free tier.
- **Free models (per official pricing page, Sept 2026):** Gemini 3.7 Flash, 3.5 Flash, 3.5 Flash-Lite, 3.1 Flash-Lite, 3 Flash Preview, 2.5 Pro, 2.5 Flash, 2.5 Flash-Lite show "Free of charge" columns. Pro/Omni/image-gen models show "Not available" on free.
- **Rate limits:** Google no longer publishes the per-model free-tier table on the docs page — it now says "View your active rate limits in AI Studio" (limits are per-project, per-model; RPD resets midnight Pacific). **Community-verified (Dec 2025 onward):** Flash-class free RPD was slashed ~250→20 RPD (forum threads + Reddit + LinkedIn concur; ~98% cut on 2.5 Flash). Treat free Gemini as ~20 RPD/model until checked in AI Studio. Mark exact RPD: **unverified-publicly** (account-specific).
- **Data condition (key!):** Free tier = "Content used to improve our products: **Yes**". Paid = No. (verified-official)
- **Card required?** No (billing setup only for paid tiers).
- **Context:** 1M tokens on Flash-class (well-established; secondary).
- **Sources:** https://ai.google.dev/gemini-api/docs/rate-limits (updated 2026-08-18), https://ai.google.dev/gemini-api/docs/pricing
- **Confidence:** verified-official (tier structure, data condition, model availability); secondary-source (20 RPD cut); unverified (exact current per-model RPD).

## 2. Groq — verified-official (best $0 anchor provider)
- **What's free:** Permanent Free Plan, **no credit card** (card only needed to upgrade to Developer tier per Billing FAQs). All current models on LPU hardware.
- **Free Plan limits (official table, checked 2026-09-02):**
  | Model | RPM | RPD | TPM | TPD |
  |---|---|---|---|---|
  | groq/compound & compound-mini (agentic) | 30 | 250 | 70K | – |
  | openai/gpt-oss-120b | 30 | 1K | 8K | 200K |
  | openai/gpt-oss-20b | 30 | 1K | 8K | 200K |
  | openai/gpt-oss-safeguard-20b | 30 | 1K | 8K | 200K |
  | qwen/qwen3.6-27b, qwen/qwen3.8-27b | 30 | 1K | 8K | 200K |
  | meta-llama/llama-prompt-guard-2 (22m/86m) | 30 | 14.4K | 15K | 500K |
  | whisper-large-v3 / whisper-large-v3-turbo (STT) | 20 | 2K | – | – (7.2K audio-sec/hr, 28.8K audio-sec/day) |
  | canopylabs/orpheus TTS | 10 | 100 | 1.2K | 3.6K |
- **Notes:** Cached tokens do NOT count against rate limits (prompt caching = free throughput). Limits at organization level. Rate-limit headers exposed. Free STT file limit 25MB. **Llama chat models no longer in the free table** — 2025 blogs citing "Llama 3.3 70B, 30 RPM/30K TPM/14.4K RPD" are stale; don't quote.
- **ToS:** Groq Services Agreement (2026-06-22): "Groq has no obligation to provide multiple accounts" — multi-accounting not sanctioned.
- **Sources:** https://console.groq.com/docs/rate-limits ; https://console.groq.com/docs/billing-faqs ; https://console.groq.com/docs/legal/services-agreement
- **Confidence:** verified-official.

## 3. OpenRouter (:free models) — verified-official
- **What's free:** ~dozens of `:free` model variants (incl. DeepSeek, Qwen, Llama, gpt-oss lineups) routed through one OpenAI-compatible API. No card needed.
- **Rate limits (official):** Free models: **20 RPM always**; **50 RPD** if lifetime credits < $10; **1,000 RPD** once you've ever purchased ≥ $10 credits (one-time unlock, credits never expire).
- **BYOK:** bring your own provider keys — $25,000/month list-price inference included free on Pay-as-you-go; 5% fee above that.
- **ToS/data:** OpenRouter doesn't log prompts unless you enable logging; but free/stealth models may use inputs for training — OpenRouter privacy policy (2026-07-06): "If you do not want your Inputs used for model training, select a Model or Model Provider that commits to not using your data." Anti-multi-account: "Making additional accounts or API keys will not affect your rate limits, as we govern capacity globally."
- **Sources:** https://openrouter.ai/docs/api_reference/limits ; https://openrouter.ai/docs/faq ; https://openrouter.ai/privacy
- **Confidence:** verified-official.

## 4. Cerebras — verified-official (⚠️ no longer permanently free)
- **What's free:** **"Is there a permanently free tier? No."** Free Trial = **$5 credits that expire 30 days** after grant; access to all Cerebras models, no card stated.
- **Free Trial limits (official):** gpt-oss-120b: 5 RPM, 30K TPM, 1M TPH, 1M TPD; gemma-4-31b: 5 RPM, 30K TPM, 1M TPH, 1M TPD (footnote: images 2/req, 4MB).
- **Paid:** Developer from $10 (10x limits: gpt-oss-120b 1K RPM/1M TPM). Dual-bucket rate limiting (uncached + total tokens) — prompt caching multiplies effective throughput.
- **Sources:** https://inference-docs.cerebras.ai/support/pricing ; https://inference-docs.cerebras.ai/support/rate-limits
- **Confidence:** verified-official.

## 5. Together AI — mostly secondary (⚠️ free tier effectively dead)
- **What's free:** $25 signup credit retired (July 2025, per pricepertoken). Official docs: "Access to the Together platform requires a minimum $5 credit purchase. Together AI is fully prepaid." → **no $0 starting path** except: one free serverless model found in official table: **Prism-ML/Ternary-Bonsai-27B** (262K ctx, Free in/out); plus invite-only Research Credits Program and startup grants ($15k–$50k, not for individuals).
- **Old free endpoints** (`meta-llama/Llama-3.3-70B-Instruct-Turbo-Free`, Llama-Vision-Free, R1-distill-free): the official model page now says Llama-3.3-70B-Turbo-Free "is not available on Together's Serverless API" — treat as retired.
- **Sources:** https://docs.together.ai/docs/serverless/models ; https://www.together.ai/models/llama-3-3-70b-free ; https://docs.together.ai/docs/credits ; pricepertoken.com
- **Confidence:** docs table verified-official (free Ternary-Bonsai-27B; retired free-Llama); credits history secondary-source.

## 6. Hugging Face Inference Providers — verified-official
- **What's free (official pricing page):** Monthly credits for **every** account: Free users **$0.10/month** ("subject to change"), PRO $2.00/month, Team/Enterprise $2.00/seat/month. Credits auto-apply to 200+ models routed through HF (Groq, Cerebras, Together, DeepInfra, Novita, OVH, Scaleway, etc.), no HF markup. Extra usage = pay-as-you-go (credits purchase required beyond free credits).
- **Note:** This is a big downgrade vs the 2024-25 "free serverless inference" era — $0.10/mo ≈ a handful of requests on 8B models. Useful mainly as a unified fallback and for rare/long-tail models.
- **Card required?** No for the free monthly credits.
- **Source:** https://huggingface.co/docs/inference-providers/pricing
- **Confidence:** verified-official (credits table); per-provider sub-limits unverified (depend on underlying provider).

## 7. Cloudflare Workers AI — verified-official
- **What's free:** **10,000 Neurons/day** free allocation (on Workers Free plan AND as the free allowance on Workers Paid). Resets daily 00:00 UTC. No card on Workers Free.
- **Overage:** $0.011 per 1,000 Neurons.
- **Models:** llama-3.2-1b (2,457 neurons/M in ⇒ ≈4M input tok/day free), llama-3.2-3b, llama-3.1-8b-fp8-fast, llama-3.2-11b-vision, llama-3.1/3.3-70b-fp8-fast, DeepSeek-R1-distill-32b, Whisper, embeddings, image models. ⚠️ Frontier models (kimi-k2.6/2.7, glm-5.2/5.3/5.3-flash, deepseek-v4-*) require Workers Paid or prepaid AI Gateway credits.
- **Example paid price:** llama-3.1-8b-fast $0.045/M in, $0.384/M out; llama-3.3-70b $0.293/$2.253.
- **Source:** https://developers.cloudflare.com/workers-ai/platform/pricing/
- **Confidence:** verified-official.

## 8. Mistral (La Plateforme) — secondary-source
- **What's free:** "Experiment" free API tier: **~1 billion tokens/month**, rate-limited (~1 req/sec), **no billing card required**, intended for evaluation/training data caveats apply.
- **Notes:** Consistent across 2026 secondary sources (help.mistral.ai article "Why am I hitting API rate limits" confirms limits measured in RPS + tokens/min + tokens/month; exact per-workspace numbers shown in console). Paid "Build" tier details: unverified this session.
- **Sources:** help.mistral.ai (rate-limits article, updated 2026-08-12); amnic.com (Jun 2026); pricepertoken.com; rapidevelopers.com (Jul 2026).
- **Confidence:** secondary-source (official article confirmed structure; the ~1B tok/mo number from multiple secondary sources).

## 9. GitHub Models — verified-official (⚠️ RETIRED)
- **GitHub Models was fully retired as of July 30, 2026** — playground, model catalog, inference API, and BYOK "no longer available to any customer." Separate from GitHub Copilot. Successor path for free model access: Azure AI Foundry (model catalog) or GitHub Copilot.
- **Impact:** Any 2025 plan that lists GitHub Models as a free-tier provider is obsolete. Remove from the router lineup.
- **Source:** https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models
- **Confidence:** verified-official.

## 10. NVIDIA NIM / build.nvidia.com — secondary-source (official-forum corroborated)
- **What's free:** Free API key via NVIDIA Developer Program (no card): **~1,000 API credits on signup** (1 credit ≈ 1 API call), raiseable to ~5,000 on request; **~40 RPM** free-tier rate limit. Production usage requires paid deployment of NIM microservices.
- **Notes:** Official 2024 forum post states the trial catalog grants 1,000 credits (5,000 possible); 2026 forum threads show NVIDIA actively enforcing/limiting free-tier abuse (e.g., banning "OpenClaw-style" agentic abuse, May 2026).
- **Sources:** https://build.nvidia.com ; forums.developer.nvidia.com/t/api-credits-for-build-nvidia-com/306633 ; /376049 ; decodethefuture.org guide (May 2026); sidsaladi.substack.com.
- **Confidence:** secondary-source (numbers consistent; build.nvidia.com page itself is JS-rendered, not directly parsed).

## 11. Cohere — verified-official
- **What's free:** Trial API keys (free, no card) — **1,000 API calls/month** total (also applies to prod keys on newest model variants).
- **Trial rate limits (official):** Chat 20 req/min per model (Command A/A+/Reasoning/Vision/Translate, Command R/R+/R7B, North Mini Code); Audio transcriptions 5 req/min; Embed 2,000 inputs/min (images 5/min); EmbedJob 5 req/min; Rerank 10 req/min; Parse 500 req/min; default 500 req/min.
- **Sources:** https://docs.cohere.com/docs/rate-limits
- **Confidence:** verified-official. (Card-free signup per trial-key design — standard; not explicitly stated on the page: minor caveat.)

## 12. SambaNova Cloud — verified-official
- **What's free:** **Free Tier = account with NO payment method linked** (card optional!). Official limits, production models (DeepSeek-V3.1, Meta-Llama-3.3-70B-Instruct, gpt-oss-120b): **20 RPM / 20 RPD / 200K TPD**. Preview models (DeepSeek-V3.2, gemma-4-31B-it): same 20/20/200K.
- **Developer tier** (payment method linked): 60 RPM / 12,000 RPD (Llama-3.3-70B: 240 RPM / 48,000 RPD), capped 20M tokens/day across all models.
- **Sources:** https://docs.sambanova.ai/docs/en/models/rate-limits ; https://cloud.sambanova.ai/plans
- **Confidence:** verified-official. (Tiny RPD but 200K TPD + no-card = real $0 fallback; 20 req/day is the binding constraint.)

## 13. Local inference (llama.cpp / Ollama on Android Termux) — secondary-source
- **Feasibility (2026 evidence):** Works. llama.cpp compiles/runs natively in Termux; Ollama available via community Termux builds. Qwen-class 0.5B–1.5B quantized (Q4) fit in ~1GB; 2B-3B (Gemma, Qwen) comfortable on 6–8GB-RAM phones; measured 6–25 tok/s on Snapdragon 8 Gen 1 (Qwen3-class). Aug 2026 demos: Qwen3.8 ~1GB weights, 262K ctx loaded in Termux on Android.
- **Constraints:** RAM is the binding limit (Android kills background processes); thermal throttling; no GPU acceleration in Termux (CPU-only llama.cpp; Vulkan experimental). Serve to localhost apps via Ollama's OpenAI-compatible API (127.0.0.1:11434) or llama.cpp server — perfect for an offline-fallback route in the gateway.
- **$0 cloud fallback:** Oracle Cloud Always Free VM (2026 update: 2 CPU / 12 GB RAM ARM) can host small models 24/7.
- **Sources:** yutori.com scouts summary; ai.gopubby.com (Jun 2026); scribd Android-LLM report; Facebook/Termux demo posts (Aug 2026); r/oraclecloud Always Free thread (Jun 2026).
- **Confidence:** secondary-source (feasible; exact tok/s varies by device). Recommended pilot models: qwen2.5/qwen3 0.5B–1.5B, gemma-2-2b, SmolLM2-360M.

## 14. Whisper-class speech-to-text, free — verified-official (Groq) + secondary (local)
- **Groq (best free STT):** whisper-large-v3 & whisper-large-v3-turbo on free tier: **20 RPM, 2,000 RPD, 7,200 audio-sec/hour, 28,800 audio-sec/day (~8 hours of audio/day)**, 25MB/file. Verified in official rate-limits table. Paid comparison: Whisper v3 Turbo $0.04/hour vs OpenAI ~$0.36/hour.
- **Local:** whisper.cpp with tiny/base quantized models runs real-time on desktop CPUs and high-end Android (Termux); tiny.en ≈ <1GB RAM. Feasible offline fallback; exact speeds device-dependent (secondary-source).
- **Also free-ish:** Hugging Face Inference Providers $0.10/mo credits can route STT models; Cloudflare Workers AI includes Whisper under the 10k Neurons/day free allocation.
- **Confidence:** Groq verified-official; local secondary-source.

## 15. ToS red flags / compliance notes for a $0 router
- **Multi-accounting:** Prohibited/futile across the board. OpenRouter: extra accounts/API keys don't change limits ("we govern capacity globally"). Groq: "no obligation to provide multiple accounts" (Services Agreement, 2026-06-22). NVIDIA bans abusive free-tier automation patterns (forum enforcement, May 2026). Generic AI-API ToS language: multiple accounts to circumvent limits = grounds for ban. → **Design the router to aggregate MANY providers with ONE account each.**
- **Data training opt-out:** Gemini free tier = data IS used to improve products (official). OpenRouter free models = may train on inputs; choose zero-retention providers via provider-preference settings. Groq/Cerebras/Together paid = no training on API data (industry standard); Groq free-tier training policy page didn't load this session (unverified).
- **Reselling:** No explicit "reselling prohibited" clause captured for these free tiers this session — **unverified**; check each provider's terms before exposing the gateway as a public product. (OpenRouter has a separate provider/partner program for reselling inference.)
- **Caching:** Allowed and even rewarded: Groq explicitly excludes cached tokens from rate limits; Cerebras dual-bucket favors cache hits; Gemini paid has context caching (50% cheaper... free tier: caching free-of-charge row exists). No provider found that prohibits client-side response caching, but don't serve one user another user's cached PII (unverified-generalization, flag in report).
- **Stability risk:** Free tiers change without notice (Gemini cut Dec 2025 with no email; GitHub Models retired Jul 2026; Cerebras/Together free tiers ended). → Router MUST treat every free provider as disposable, with health checks + graceful failover.

---

## Cost economics of cheap paid tiers (per 1M tokens, for the pay-per-use case)
Checked 2026-09-02.

| Model / Provider | Input $/1M | Output $/1M | Confidence |
|---|---|---|---|
| DeepSeek V4 Flash (1M ctx, off-peak) | $0.22 ($0.014 cache-hit) | $0.66 | verified-official (api-docs.deepseek.com) |
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 | verified-official (ai.google.dev/pricing) |
| Gemini 2.5 Flash / 3.5 Flash-Lite | $0.30 | $2.50 | verified-official |
| Gemini 3.7 Flash (until Dec 31 2026; 2x in 2027) | $0.75 | $3.75 | verified-official |
| Gemini 3.5 Flash | $1.50 | $9.00 | verified-official |
| Cloudflare Workers AI llama-3.1-8b-fast | $0.045 | $0.384 | verified-official |
| Cloudflare Workers AI llama-3.3-70b-fast | $0.293 | $2.253 | verified-official |
| OpenAI GPT-4o-mini | $0.15 | $0.60 | secondary-source (stable since 2024; openai pricing page JS-blocked) |
| OpenAI GPT-5 nano | ~$0.05 | ~$0.40 | secondary-source (benchlm.ai, Sep 2026) |
| Claude Haiku 4.5 (200K ctx) | $1.00 | $5.00 | secondary-source (multi-source consistent) |
| Claude Sonnet 5 | $2.00–$3.00 | $10–$15 | secondary-source (conflicting reports; verify) |

**Business-case framing:** A $0 multi-provider stack (Groq 1K RPD + Gemini ~20 RPD + OpenRouter 50–1,000 RPD + SambaNova 200K TPD + Cloudflare 10k Neurons + Mistral ~1B tok/mo) covers prototype/MVP traffic; the moment a customer pays anything, DeepSeek V4 Flash or Gemini 2.5 Flash-Lite at $0.2–0.3/M input / $0.7–2.5/M output caps worst-case COGS at ~1–5% of revenue for typical chat workloads.

## Free-tier capacity math (per single accounts, per day, rough)
- Text gen: Groq gpt-oss/qwen 8K TPM×30 RPM (200K TPD) + Gemini Flash ~20 RPD + OpenRouter 50 RPD (1,000 RPD w/ $10 unlock) + SambaNova 200K TPD (20 RPD) + Cloudflare ~0.5M output tok/day (1b model) ⇒ comfortably ~500–2,000 requests/day of mixed small-model traffic at $0.
- STT: Groq whisper 28.8K audio-sec/day (≈8 h/day) at $0.
- Fallback/eval: Mistral ~1B tok/month; HF $0.10/mo credits; NVIDIA ~1,000 one-off calls.

*End of file. All official pages re-readable at the source URLs above.*
