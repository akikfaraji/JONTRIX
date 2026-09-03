# Volume 13 — Long-Tail Catalog (Family Batches, J051–J247)

**Document:** JONTRIX Build Specification — VOL-13
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED (family structure, batch template, gates; individual long-tail specifics trace to `research/opportunities.json`)
**Depends on:** VOL-11 (patterns/manifest/harness), VOL-02 (evidence), VOL-12 (card format). Referenced by: VOL-07 §5 (family hubs), VOL-14 (DoD).

---

## §1 The Long-Tail Thesis and the Batch System (LOCKED)

The founder directive is LOCKED in VOL-01 §1: **a tool used once a month by one person ships anyway**, because the shared runtime (VOL-11) makes marginal cost ≈ 0 and existence strengthens the "everything is in here" promise. The remaining **197 Jonts (J051–J247)** therefore do not get 50-card treatment — they get **family batches**: each family shares one pattern profile, one manifest template, one fixture policy, and ships as a unit whose acceptance is family-wide (§4). Every long-tail Jont still carries its own manifest, fixtures, and research trace — batching changes the *documentation depth*, never the *test rigor*.

## §2 Family Table (LOCKED — counts from the frozen JSON)

| Family id | Cluster | Count | tier_fit mix | client/server | Default pattern profile |
|---|---|---|---|---|---|
| `devtools` | Developer Tools | 49 | 38 FREE · 7 PRO · 4 MAX | 39 · 10 | converter/validator (formatters, encoders, config tools, big-file split); server only for >100 MB inputs |
| `edu-gold` | Weird Gold / Education | 43 | 31 FREE · 10 PRO · 2 MAX | 10 · 33 | validator/generator (study tools, AI-era academic utilities); server where public-data lookups are needed (C7 rate-limited, cached) |
| `ecom-smb` | E-commerce & SMB Ops | 41 | 18 FREE · 23 PRO | 33 · 8 | validator/fixer (feed/marketplace utilities per J016/J025/J048 shapes) |
| `data-repair` | Data & File Repair | 32 | 21 FREE · 10 PRO · 1 MAX | 30 · 2 | converter/fixer (the CSV/XLSX/PDF utility bench under the flagships) |
| `web-text` | Web & Text Utilities | 21 | 21 FREE | 21 · 0 | converter/generator (text transforms, encoders, counters — all instant, all client) |
| `media` | Media & Image | 7 | 7 FREE | 7 · 0 | converter (image resize/format/strip-metadata — WASM codecs, C6) |
| `bd-telegram` | Telegram / BD | 4 | 1 FREE · 1 PRO · 2 MAX | 1 · 3 | extractor/generator (BD-specific operator tools; highest-context family, built last) |

**MUST:** family ids, per-Jont `tier_fit`, and scores come verbatim from the JSON (seed pipeline, VOL-03 §4); **NEVER** a long-tail Jont invented outside the corpus — if a build-time need appears, it goes to `docs/decisions.md` as a founder question.

## §3 The Family Batch Template (LOCKED)

A family batch ships one document (`spec/catalog/families/<family>.md`) containing: **(1)** the family problem thesis (2 paragraphs, E1/E2 cited from the JSON's evidence summaries); **(2)** the member table — `id · slug · title · pattern · context · tier_fit · score · trace_row` — generated from the JSON, one row per Jont; **(3)** the shared manifest template (defaults the members inherit: input limits, preview rows, export formats); **(4)** the fixture policy (§4); **(5)** the family hub page spec for the PWA (`/family/{family}`, VOL-07 §5). Member manifests still validate individually (VOL-11 §2) — the template only pre-fills defaults.

## §4 Fixture and Acceptance Policy (LOCKED)

Per-batch gates, enforced by the harness (VOL-11 §7) and `npm run test:jonts`:

1. **Every** long-tail Jont: ≥ 3 fixture rows (happy path, edge, failure) — no exceptions; the harness red-greens them all.
2. **Determinism spot-audit:** 20% of each batch (random, seeded) re-run byte-equality on 10× inputs (T11.1 discipline scaled).
3. **Family-level gate:** ≥ 95% of the batch's members green before the family counts as shipped; a red member blocks the family, not the catalog — and appears honestly as `planned` on its SEO page until green (C8: no "coming soon" fakery, the page renders only built Jonts).
4. **C6 leak test per batch:** every `client` member makes zero API execution calls (T7.1 discipline scaled); `server` members label themselves on their pages.
5. **Build order within Phase 9:** family by family in the table order above (devtools first — it feeds the Agent Operator persona; bd-telegram last — highest context, founder-reviewed).

## §5 MCP Exposure and Tier Gates (LOCKED)

Long-tail `server` members and primitive-argument client members set `mcp_exposed=true` in their manifests — the Agent Operator's catalog reaches ~150 tools after the long tail lands, and the VOL-10 filtered-catalog contract needs no changes. Tier gates are mechanical (`tier_fit`), preview rules follow VOL-01 §3.2 (first-N-rows free where a preview is honest — a formatter has no rows; it is simply FREE or gated). **NEVER** a long-tail Jont gated by anything except its frozen `tier_fit` — no "launch promo" gates, no per-tool pricing (VOL-01 §3.1).

## §6 Acceptance Tests

| # | Given | When | Then |
|---|-------|------|------|
| T13.1 | Family docs + JSON | generate member tables | 197 members total; per-family counts match §2 exactly; zero invented rows |
| T13.2 | Every long-tail manifest | validate | zod-clean; defaults inherited from family template; trace row resolves |
| T13.3 | Each family batch | `npm run test:jonts` | ≥ 95% green to ship; red members honest as `planned` |
| T13.4 | 20% spot-audit set | determinism re-run | byte-identical outputs, both contexts where hybrid |
| T13.5 | All client members | leak test | zero execution API calls; zero ad/telemetry code |
| T13.6 | Full catalog of 247 | `tier_fit` census | 155 FREE / 79 PRO / 13 MAX (T2.1) |

**DoD hooks (VOL-14):** "long-tail families shipped at the §4 gate" (G-30), "247-catalog census matches research JSON" (G-03/G-28 shared), "no unbuilt Jont renders a fake page" (G-19 shared).
