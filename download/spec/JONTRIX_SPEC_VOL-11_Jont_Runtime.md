# Volume 11 — Jont Runtime & Jont-Kit

**Document:** JONTRIX Build Specification — VOL-11
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED except where marked AGENT CHOICE
**Depends on:** VOL-00 (C5, C6), VOL-01 §4 (limits), VOL-04 §4 (registry), VOL-05 §4/§10 (dispatch, AI router). Referenced by: VOL-12/13 (every card uses these contracts), VOL-07 §4 (client loader), VOL-10 §4.5 (tool specs).

---

## §1 The Deterministic-First Law (LOCKED, C5)

Every Jont's core transformation is a **deterministic algorithm whenever one exists**; AI is a capped fallback for genuinely fuzzy steps (e.g., fuzzy column matching in messy CSVs), and every AI call is cached (VOL-05 §10). The runtime enforces the law structurally: a manifest that declares `ai_steps` must declare the deterministic path first and the fallback second, and Free-tier users (0 AI quota) must always get the deterministic path or an honest error — never a silent quality drop. **MUST:** identical inputs produce byte-identical outputs for the deterministic path (a DoD test re-runs fixtures); **NEVER** an AI call where a documented algorithm suffices, and never an AI call that skips its cache.

## §2 The Manifest Contract (LOCKED)

Every Jont ships a `jont.manifest.json`, validated at build time by `packages/jont-kit/src/manifest.ts` (zod) and stored in the `jonts` registry (VOL-04 §4). The interface, binding:

```ts
interface JontManifest {
  id: string;                       // "jont_j001_pdf-table-extractor"
  title: string; family: string;    // VOL-13 family id
  pattern: 'converter'|'validator'|'generator'|'extractor'|'fixer';
  context: 'client'|'server'|'hybrid';   // C6: client whenever possible
  io: { input: JSONSchema; output: JSONSchema; preview_rows?: number };
  engine: { client?: string; server?: string };  // module paths (content-hashed at build)
  ai_steps?: string[];              // fuzzy steps only; deterministic path declared first
  tier_fit: 'FREE'|'PRO'|'MAX'; mcp_exposed: boolean;
  evidence: { problem_row: string; score: number };  // traceability, VOL-02 §7
}
```

**MUST:** a client `context` Jont never declares a server engine route, and its manifest must pass the C6 leak test (T7.1); a `hybrid` Jont states exactly which steps run where. **NEVER:** a manifest field that duplicates the registry (manifest is the source; the registry row is the projection).

## §3 The Five Patterns (LOCKED)

`packages/jont-kit/src/patterns/` exports exactly five — every one of the 247 Jonts is an instance of one, which is what makes the long tail cheap (VOL-01 §1):

| Pattern | Input → Output shape | Deterministic core | Notes |
|---|---|---|---|
| **converter** | bytes/text → bytes/text | parsing + re-serializing | PDF→CSV, JSON→YAML class; output byte-identical for identical input |
| **validator** | data + rule set → findings[] | rule evaluation | schema/lint/compliance checks; findings carry row/field pointers |
| **generator** | params → artifact | templating | invoices, feeds, sitemaps; templates versioned in the manifest |
| **extractor** | bytes → structured rows | parsing + selection rules | tables, links, entities; `preview_rows` powers the free preview (VOL-07 §3) |
| **fixer** | data → data + change log | transforms + rules | CSV repair, date normalization; every mutation is logged in the output |

**MUST:** each pattern's runtime signature is `(input, options) → Result` with a uniform `Result` envelope (`data`, `warnings[]`, `change_log?`, `ms`); **NEVER** a sixth pattern without a spec revision — a Jont that seems to need one is mis-modeled.

## §4 Server Dispatch (LOCKED)

`POST /api/jonts/{id}/run` (VOL-05 §4) executes: **(1)** manifest fetch from registry; **(2)** argument validation against `io.input` (422 on fail); **(3)** concurrency slot check (`concurrent_jobs`, D1 counter, 429 on saturation — queued jobs are *not* held, the client retries); **(4)** engine execution in the Worker with a hard timeout (10 s CPU-equivalent; larger jobs are the batch API's problem via `batch_rows_max` chunking); **(5)** metering row in `jont_usage` (VOL-04 §4) and counter increment in the same transaction as the dispatch decision (VOL-10 §7 semantics); **(6)** result: ≤ 64 KB inline, larger to R2 with a handle (VOL-04 §4). **MUST:** inputs stream and die with the request (C6 — no upload-at-rest); **NEVER** a server route that executes a client-context Jont (the dispatcher refuses by manifest and says so).

## §5 Client Engine Packing (LOCKED)

Client engines are ES modules (+ WASM) built per Jont, content-hashed, uploaded as Pages static assets, loaded lazily by the PWA loader (VOL-07 §4) — the extension never bundles them (T9.4). Packing rules: one engine per Jont (no shared mutable state), memory guard 2 GB, cancelable, progress events at defined percentages for long transforms. **MUST:** a client engine and its server twin (hybrid Jonts) pass the **same** pattern-level fixtures — the harness (§7) runs both; **NEVER** a client engine fetching anything but its own static assets and the platform API for saves/presets.

## §6 Chaining and Presets (LOCKED)

The DR-D2 insight (VOL-02 §3) becomes a runtime feature: a Jont's output shape (`io.output`) can feed another Jont whose input it matches; the PWA run panel offers "send to…" filtered by schema compatibility, and a chain is saved as a preset whose payload records the ordered steps (VOL-04 §4 `presets.payload_json`). **MUST:** each chain step meters and gates independently (a chain is sugar over N runs, not a bypass); **NEVER** a chain that hides a PRO-fit step behind a FREE-fit entry point — the gate fires at the step, honestly.

## §7 The Testing Harness (LOCKED)

`packages/jont-kit/src/testing/harness.ts` runs a Jont against its card's fixture table (VOL-12/13): given input → assert output byte-equality (deterministic), warnings, preview rows, timing budget, and (for AI steps) cache-hit behavior with a stubbed router. The harness is the *only* sanctioned way to satisfy "acceptance tests passing" per Jont (VOL-00 §0.1) — VOL-12/13 tables are its input format, and `npm run test:jonts` iterates the registry. **MUST:** fixtures live beside the card data, versioned; **NEVER** a Jont marked `built` in the registry with a red harness.

## §8 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T11.1 | Any deterministic Jont | run same input twice (client and server where hybrid) | byte-identical outputs both times, both contexts |
| T11.2 | Manifest with ai_steps | Free user runs it | deterministic path executes; zero AI-provider contact (T5.10 shared) |
| T11.3 | U-MAX, concurrent_jobs = 10 | 11th simultaneous run | 429 with retry hint; no slot leak after cancel |
| T11.4 | Server run, 1 MB result | dispatch completes | R2 handle returned; inline threshold respected; `jont_usage` row has bytes_out |
| T11.5 | client-context Jont | POST to `/api/jonts/{id}/run` | refused with honest "this runs in your browser" message |
| T11.6 | Chain preset (3 steps, middle = PRO-fit) | Free user runs it | steps 1–3 gate independently; step 2 → 402; steps 1 and 3 metered |
| T11.7 | Every `built` Jont | `npm run test:jonts` | harness green; registry and manifest agree (`mcp_exposed`, `tier_fit`, score) |
| T11.8 | AI step, warm cache | repeat run | cache hit; no provider call; `ai_YYYYMM` counter unmoved |

**DoD hooks (VOL-14):** "harness green for all built Jonts" (G-10), "determinism double-run proof" (G-11), "C6 leak test" (G-07 shared), "AI fallback caps + cache verified" (G-14 shared).
