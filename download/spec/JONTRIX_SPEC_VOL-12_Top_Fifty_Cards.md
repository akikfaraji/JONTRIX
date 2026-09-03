# Volume 12 — The Fifty: J001–J050 Build Cards

**Document:** JONTRIX Build Specification — VOL-12 · **Version:** 1.0 (2026-09-03) · **Status:** LOCKED roster, cards refineable at build time only within the stated contracts
**Sources:** generated from `research/opportunities.json` (frozen); acceptance templates from VOL-11 §6; registry seed = `spec/catalog/jonts.seed.json`.

## §1 Roster Rules (LOCKED)

**J001–J010 are curated, not raw rank order**, to satisfy VOL-00 Phase 3 (the first ten must exercise all five patterns and both execution contexts) and Phase 7 (the extension fixtures CORS Echo and cURL-to-Code must be among them). **J011–J050 are the remaining top-50 rows in strict descending score order.** Two documented deviations: (1) `DV-B5` (cURL to Code) sits at natural rank 87 but enters at J005 by Phase-7 mandate; (2) `EC-C15` (natural rank 50) swaps out to head the long tail (J051) so the roster stays exactly fifty. Every card prints its source row, rank, and frozen score — provenance is auditable against the seed file.

## §2 First-Ten Coverage Matrix (Phase-3 exit contract)

| # | Jont | Pattern | Context | Tier | Score | Why here |
|---|------|---------|---------|------|-------|----------|
| J001 | PDF Edit & Merge Toolkit | converter | client | FREE | 8.20 | converter·client cell; highest score (8.20), the Acrobat-outrage hook |
| J002 | PDF Table Extractor | extractor | client | PRO | 7.75 | extractor·client cell; top GT row |
| J003 | Bank Statement PDF → CSV | extractor | server | PRO | 8.03 | extractor·server cell; flagship LTV, AI-fallback exercised |
| J004 | Leading-Zero & Date Guard | validator | client | PRO | 7.60 | validator·client cell |
| J005 | CORS Echo & Diagnose | validator | server | FREE | 7.53 | validator·server cell; Phase-7 mandate, CORS traffic wedge |
| J006 | CSV Column Split Repair | fixer | client | FREE | 7.55 | fixer·client cell; hook-class |
| J007 | JSON Repair | fixer | server | PRO | 7.15 | fixer·server cell |
| J008 | Amazon Flat File Formatter | generator | client | PRO | 7.03 | generator·client cell; ecom anchor |
| J009 | Exam Question Bank Builder | generator | server | FREE | 7.12 | generator·server cell |
| J010 | cURL to Code | converter | server | FREE | 6.58 | converter·server cell; Phase-7 mandate (natural rank 87) |

Every pattern appears ≥2× and every context ≥5× across the ten; the five patterns × two contexts grid is fully covered.

## §3 Build Order

Phase 3 builds J001–J010 (per the matrix above). Phase 9 builds J011–J050 in the numbered order below (descending score), then VOL-13's long tail in family batches. A card is "done" only when the VOL-11 harness runs its acceptance rows green, the PWA page renders, tier gating works, and its SEO page is live — the VOL-14 §2 per-Jont DoD.

## §4 The Cards


### J001 · PDF Edit & Merge Toolkit

`converter · client · tier FREE · role HOOK · score 8.20 · evidence E1 (source rank 1)`

| Field | Contract |
|---|---|
| Source row | `DR-C3` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Adobe Acrobat's subscription-only pricing outrages buyers who need occasional PDF editing/merging/forms. |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J001/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j001_pdf-edit-merge-toolkit` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/pdf-edit-merge-toolkit/` · query from card-time refinement |

### J002 · PDF Table Extractor

`extractor · client · tier PRO · role LTV · score 7.75 · evidence E3 (source rank 3)`

| Field | Contract |
|---|---|
| Source row | `GT-PDF-extract-DR-C2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | PDF Table Extractor to CSV (text-layer) |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J002/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/extractor.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j002_pdf-table-extractor` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 records + source spans match · H2 heuristic rows carry confidence · H3 AI-off hint path (col_N) · E1 empty input → 422 · F1 unsupported media → 422 |
| SEO | `/jonts/pdf-table-extractor/` · query `extract tables from pdf to csv` |

### J003 · Bank Statement PDF → CSV

`extractor · server · tier PRO · role LTV · score 8.03 · evidence E1 (source rank 2)`

| Field | Contract |
|---|---|
| Source row | `DR-F1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Bookkeepers cannot import bank transactions from PDF statements — QuickBooks Online users beg for PDF→CSV/Q... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J003/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/extractor.ts` + card algorithm |
| AI fallback | ai_fallback: header-column mapping (cache_ns `bank-statement-pdf-csv-fb`, hint per VOL-11 §5) |
| MCP | exposed → tool `jont_j003_bank-statement-pdf-csv` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 records + source spans match · H2 heuristic rows carry confidence · H3 AI-off hint path (col_N) · E1 empty input → 422 · F1 unsupported media → 422 |
| SEO | `/jonts/bank-statement-pdf-csv/` · query from card-time refinement |

### J004 · Leading-Zero & Date Guard

`validator · client · tier PRO · role PRO · score 7.60 · evidence E3 (source rank 9)`

| Field | Contract |
|---|---|
| Source row | `GT-CSV-excel-DR-A2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Leading-Zero & Date Guard (CSV open protector) |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J004/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j004_leading-zero-date-guard` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/leading-zero-date-guard/` · query `excel removes leading zeros fix` |

### J005 · CORS Echo & Diagnose

`validator · server · tier FREE · role HOOK · score 7.53 · evidence E1 (source rank 17)`

| Field | Contract |
|---|---|
| Source row | `DV-B3` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | CORS errors remain a top chronic frustration — devs don't understand why requests fail and the error masks ... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J005/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j005_cors-echo-diagnose` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/cors-echo-diagnose/` · query from card-time refinement |
| Context note | Phase-7 mandate: engine executes server-side by design (see card); source row marks the pain client-solvable. |

### J006 · CSV Column Split Repair

`fixer · client · tier FREE · role HOOK · score 7.55 · evidence E1 (source rank 12)`

| Field | Contract |
|---|---|
| Source row | `DR-A2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | CSVs open with all data in one column or split wrongly because the delimiter is comma vs semicolon (Europea... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J006/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/fixer.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j006_csv-column-split-repair` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 repair + change log match · H2 idempotent (fix∘fix = fix) · H3 ambiguity → finding, not silent fix · E1 empty input → 422 · F1 unrecoverable → 422 |
| SEO | `/jonts/csv-column-split-repair/` · query from card-time refinement |

### J007 · JSON Repair

`fixer · server · tier PRO · role PRO · score 7.15 · evidence E3 (source rank 38)`

| Field | Contract |
|---|---|
| Source row | `GT-JSON-fix-DV-B20` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | JSON Repair / Error Fixer |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J007/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/fixer.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j007_json-repair` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 repair + change log match · H2 idempotent (fix∘fix = fix) · H3 ambiguity → finding, not silent fix · E1 empty input → 422 · F1 unrecoverable → 422 |
| SEO | `/jonts/json-repair/` · query `fix invalid json online` |

### J008 · Amazon Flat File Formatter

`generator · client · tier PRO · role LTV · score 7.03 · evidence E1 (source rank 49)`

| Field | Contract |
|---|---|
| Source row | `EC-C9` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | "Amazon flat file formatting is hell": category templates keep changing, one blank required field fails the... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J008/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/generator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j008_amazon-flat-file-formatter` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 default options byte-stable · H2 custom option reflected · H3 metadata stamps VERSION · E1 empty spec → 422 · F1 invalid option → 422 |
| SEO | `/jonts/amazon-flat-file-formatter/` · query from card-time refinement |

### J009 · Exam Question Bank Builder

`generator · server · tier FREE · role HOOK · score 7.12 · evidence E2 (source rank 41)`

| Field | Contract |
|---|---|
| Source row | `WG-G17` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | BCS & competitive-exam prep: question banks exist, access costs |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J009/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/generator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j009_exam-question-bank-builder` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 default options byte-stable · H2 custom option reflected · H3 metadata stamps VERSION · E1 empty spec → 422 · F1 invalid option → 422 |
| SEO | `/jonts/exam-question-bank-builder/` · query from card-time refinement |

### J010 · cURL to Code

`converter · server · tier FREE · role GLUE · score 6.58 · evidence E2 (source rank 87)`

| Field | Contract |
|---|---|
| Source row | `DV-B5` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Converting curl commands (copied from docs/DevTools) into Python/JS/PHP code is a standing need — proven by... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J010/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j010_curl-to-code` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/curl-to-code/` · query from card-time refinement |
| Context note | Phase-7 mandate: engine executes server-side by design (see card); source row marks the pain client-solvable. |

### J011 · File Converter Chain

`converter · client · tier FREE · role HOOK · score 7.67 · evidence E1 (source rank 4)`

| Field | Contract |
|---|---|
| Source row | `DR-D2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | One conversion job requires stitching 3-5 different single-purpose sites/tools; users lose track and hit ea... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J011/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j011_file-converter-chain` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/file-converter-chain/` · query from card-time refinement |

### J012 · Big JSON Splitter & Viewer

`converter · client · tier FREE · role HOOK · score 7.62 · evidence E1 (source rank 5)`

| Field | Contract |
|---|---|
| Source row | `DR-B2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Multi-hundred-MB/GB JSON & JSONL files crash or freeze editors (VS Code 5MB JSON mode limit; 700MB jsonline... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J012/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j012_big-json-splitter-viewer` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/big-json-splitter-viewer/` · query from card-time refinement |

### J013 · Receipt & Invoice Data Extractor

`extractor · server · tier MAX · role LTV · score 7.60 · evidence E1 (source rank 6)`

| Field | Contract |
|---|---|
| Source row | `DR-H1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | SMBs and individuals still spend hours monthly on manual invoice/receipt data entry and want any automation... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J013/`); max upload 100 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/extractor.ts` + card algorithm |
| AI fallback | ai_fallback: header-column mapping (cache_ns `receipt-invoice-data-extractor-fb`, hint per VOL-11 §5) |
| MCP | exposed → tool `jont_j013_receipt-invoice-data-extractor` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 records + source spans match · H2 heuristic rows carry confidence · H3 AI-off hint path (col_N) · E1 empty input → 422 · F1 unsupported media → 422 |
| SEO | `/jonts/receipt-invoice-data-extractor/` · query from card-time refinement |

### J014 · Citation Verifier

`validator · server · tier MAX · role LTV · score 7.60 · evidence E1 (source rank 7)`

| Field | Contract |
|---|---|
| Source row | `WG-G4` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Hallucinated citations — verifying AI-generated references |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J014/`); max upload 100 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j014_citation-verifier` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/citation-verifier/` · query from card-time refinement |

### J015 · CSV Splitter

`converter · client · tier PRO · role PRO · score 7.60 · evidence E3 (source rank 8)`

| Field | Contract |
|---|---|
| Source row | `GT-CSV-split-DR-B2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | CSV Splitter (rows / file size) |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J015/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j015_csv-splitter` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/csv-splitter/` · query `split large csv files` |

### J016 · Payment ↔ Invoice Matcher

`extractor · client · tier PRO · role LTV · score 7.58 · evidence E1 (source rank 10)`

| Field | Contract |
|---|---|
| Source row | `EC-C21` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Manually matching bank/UPI payments to invoices/orders — sellers literally work out "which combinations of ... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J016/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/extractor.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j016_payment-invoice-matcher` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 records + source spans match · H2 heuristic rows carry confidence · H3 AI-off hint path (col_N) · E1 empty input → 422 · F1 unsupported media → 422 |
| SEO | `/jonts/payment-invoice-matcher/` · query from card-time refinement |

### J017 · Big JSON Viewer & Query

`converter · client · tier PRO · role PRO · score 7.58 · evidence E1 (source rank 11)`

| Field | Contract |
|---|---|
| Source row | `DV-B1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | JSON viewers/editors crash or freeze on large (100MB–1GB+) JSON files, so devs fall back to command-line jq... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J017/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j017_big-json-viewer-query` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/big-json-viewer-query/` · query from card-time refinement |

### J018 · Micro-seller Order Book

`generator · client · tier FREE · role HOOK · score 7.55 · evidence E2 (source rank 13)`

| Field | Contract |
|---|---|
| Source row | `EC-C28` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | (Developing-market angle, partially inferred) Bangladesh/South-Asia micro-sellers keep records in manual kh... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J018/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/generator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j018_micro-seller-order-book` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 default options byte-stable · H2 custom option reflected · H3 metadata stamps VERSION · E1 empty spec → 422 · F1 invalid option → 422 |
| SEO | `/jonts/micro-seller-order-book/` · query from card-time refinement |

### J019 · WhatsApp Order Parser

`extractor · client · tier PRO · role LTV · score 7.55 · evidence E1 (source rank 14)`

| Field | Contract |
|---|---|
| Source row | `EC-C29` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | WhatsApp-order chaos: sellers take 20–30 orders/day as chat messages; tracking in notebook/Excel/memory; no... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J019/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/extractor.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j019_whatsapp-order-parser` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 records + source spans match · H2 heuristic rows carry confidence · H3 AI-off hint path (col_N) · E1 empty input → 422 · F1 unsupported media → 422 |
| SEO | `/jonts/whatsapp-order-parser/` · query from card-time refinement |

### J020 · AI-Provenance Report

`validator · server · tier PRO · role PRO · score 7.55 · evidence E1 (source rank 15)`

| Field | Contract |
|---|---|
| Source row | `WG-G5` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | AI-detector false positives — students need a provenance trail |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J020/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j020_ai-provenance-report` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/ai-provenance-report/` · query from card-time refinement |

### J021 · Shopify CSV Preflight

`validator · client · tier PRO · role PRO · score 7.53 · evidence E1 (source rank 16)`

| Field | Contract |
|---|---|
| Source row | `EC-C3` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Shopify rejects CSVs for invisible format reasons: non-UTF-8 encoding, illegal characters, wrong quoting — ... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J021/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j021_shopify-csv-preflight` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/shopify-csv-preflight/` · query from card-time refinement |

### J022 · PDF Form Flattener

`converter · client · tier PRO · role PRO · score 7.48 · evidence E1 (source rank 18)`

| Field | Contract |
|---|---|
| Source row | `DR-C4` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Filled PDF form data disappears when printing/emailing/saving (form fields not flattened), and users don't ... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J022/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j022_pdf-form-flattener` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/pdf-form-flattener/` · query from card-time refinement |

### J023 · Bank PDF → CSV (Local)

`converter · client · tier FREE · role GLUE · score 7.42 · evidence E1 (source rank 19)`

| Field | Contract |
|---|---|
| Source row | `EC-C26` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Bank-statement PDF→CSV: bookkeepers refuse "shady websites that claim to convert while also storing the dat... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J023/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j023_bank-pdf-csv-local` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/bank-pdf-csv-local/` · query from card-time refinement |

### J024 · Scanned PDF OCR

`extractor · server · tier PRO · role PRO · score 7.40 · evidence E1 (source rank 20)`

| Field | Contract |
|---|---|
| Source row | `DR-C2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Scanned PDFs have no text layer / OCR errors — users can't search, copy, or correct the text. |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J024/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/extractor.ts` + card algorithm |
| AI fallback | ai_fallback: fuzzy step (cache_ns `scanned-pdf-ocr-fb`, hint per VOL-11 §5) |
| MCP | exposed → tool `jont_j024_scanned-pdf-ocr` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 records + source spans match · H2 heuristic rows carry confidence · H3 AI-off hint path (col_N) · E1 empty input → 422 · F1 unsupported media → 422 |
| SEO | `/jonts/scanned-pdf-ocr/` · query from card-time refinement |

### J025 · File Safety Scanner

`validator · client · tier FREE · role HOOK · score 7.40 · evidence E1 (source rank 21)`

| Field | Contract |
|---|---|
| Source row | `DR-D1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Users are now *afraid* of free online converters — FBI + Malwarebytes confirm converter sites push malware/... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J025/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j025_file-safety-scanner` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/file-safety-scanner/` · query from card-time refinement |

### J026 · SQL Dialect Migrator

`converter · client · tier PRO · role LTV · score 7.40 · evidence E1 (source rank 22)`

| Field | Contract |
|---|---|
| Source row | `DV-B10` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | MySQL→PostgreSQL (and reverse) migrations require manual SQL dialect rewrites — type mappings, quote styles... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J026/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j026_sql-dialect-migrator` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/sql-dialect-migrator/` · query from card-time refinement |

### J027 · JSON to CSV (Flatten)

`converter · client · tier PRO · role PRO · score 7.40 · evidence E3 (source rank 23)`

| Field | Contract |
|---|---|
| Source row | `GT-JSON-json-DV-B2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | JSON to CSV (flatten, arrays-safe) |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J027/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j027_json-to-csv-flatten` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/json-to-csv-flatten/` · query `json to csv converter` |

### J028 · Universal CSV Pre-flight Validator

`validator · client · tier PRO · role PRO · score 7.40 · evidence E3 (source rank 24)`

| Field | Contract |
|---|---|
| Source row | `GT-CSV-csv-DR-A1-2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Universal CSV Pre-flight Validator |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J028/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j028_universal-csv-pre-flight-validator` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/universal-csv-pre-flight-validator/` · query `csv validator online` |

### J029 · Shopify Product CSV Preflight

`validator · server · tier PRO · role LTV · score 7.40 · evidence E3 (source rank 25)`

| Field | Contract |
|---|---|
| Source row | `GT-MKT-shopify-EC-C1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Shopify Product CSV Pre-flight Validator |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J029/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j029_shopify-product-csv-preflight` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/shopify-product-csv-preflight/` · query `shopify csv import errors` |

### J030 · CSV → QBO/OFX Converter

`converter · client · tier PRO · role PRO · score 7.35 · evidence E1 (source rank 26)`

| Field | Contract |
|---|---|
| Source row | `DR-F2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | CSV→QBO/OFX conversions fail validator checks (bank IDs, dates, amounts) and accounting software silently r... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J030/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j030_csv-qbo-ofx-converter` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/csv-qbo-ofx-converter/` · query from card-time refinement |

### J031 · Statement Data Pull (No-CSV Banks)

`extractor · server · tier MAX · role LTV · score 7.35 · evidence E1 (source rank 27)`

| Field | Contract |
|---|---|
| Source row | `DR-F4` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Banks simply don't offer CSV/data downloads for business accounts — statements are PDF-only — so conversion... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J031/`); max upload 100 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/extractor.ts` + card algorithm |
| AI fallback | ai_fallback: fuzzy step (cache_ns `statement-data-pull-no-csv-banks-fb`, hint per VOL-11 §5) |
| MCP | exposed → tool `jont_j031_statement-data-pull-no-csv-banks` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 records + source spans match · H2 heuristic rows carry confidence · H3 AI-off hint path (col_N) · E1 empty input → 422 · F1 unsupported media → 422 |
| SEO | `/jonts/statement-data-pull-no-csv-banks/` · query from card-time refinement |

### J032 · Excel Import Guard

`fixer · client · tier FREE · role GLUE · score 7.33 · evidence E1 (source rank 28)`

| Field | Contract |
|---|---|
| Source row | `DR-A1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Excel silently truncates/mangles big CSVs and strips leading zeros + rewrites dates, so re-imports into oth... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J032/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/fixer.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j032_excel-import-guard` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 repair + change log match · H2 idempotent (fix∘fix = fix) · H3 ambiguity → finding, not silent fix · E1 empty input → 422 · F1 unrecoverable → 422 |
| SEO | `/jonts/excel-import-guard/` · query from card-time refinement |

### J033 · Postman Collection Migrator

`converter · client · tier FREE · role HOOK · score 7.30 · evidence E1 (source rank 29)`

| Field | Contract |
|---|---|
| Source row | `DV-B6` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Postman gutted its free plan (Feb–Mar 2026: 1 user only, collaboration features removed, $14/mo/member) — a... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J033/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j033_postman-collection-migrator` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/postman-collection-migrator/` · query from card-time refinement |

### J034 · CSV Delimiter Fixer

`fixer · client · tier PRO · role PRO · score 7.30 · evidence E3 (source rank 30)`

| Field | Contract |
|---|---|
| Source row | `GT-CSV-csv-DR-A1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | CSV Delimiter Fixer |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J034/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/fixer.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j034_csv-delimiter-fixer` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 repair + change log match · H2 idempotent (fix∘fix = fix) · H3 ambiguity → finding, not silent fix · E1 empty input → 422 · F1 unrecoverable → 422 |
| SEO | `/jonts/csv-delimiter-fixer/` · query `csv wrong delimiter fix` |

### J035 · LLM JSON Cleaner

`fixer · client · tier FREE · role HOOK · score 7.25 · evidence E1 (source rank 31)`

| Field | Contract |
|---|---|
| Source row | `DR-B1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | LLM-generated and human-edited JSON breaks parsers on trailing commas, single quotes, comments, unquoted ke... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J035/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/fixer.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j035_llm-json-cleaner` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 repair + change log match · H2 idempotent (fix∘fix = fix) · H3 ambiguity → finding, not silent fix · E1 empty input → 422 · F1 unrecoverable → 422 |
| SEO | `/jonts/llm-json-cleaner/` · query from card-time refinement |

### J036 · PDF → Excel (Scans & Merged)

`converter · server · tier MAX · role PRO · score 7.25 · evidence E1 (source rank 32)`

| Field | Contract |
|---|---|
| Source row | `DR-C1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | PDF→Excel conversion scrambles tables (merged cells, no grid lines, spanning headers) and users spend hours... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J036/`); max upload 100 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | ai_fallback: fuzzy step (cache_ns `pdf-excel-scans-merged-fb`, hint per VOL-11 §5) |
| MCP | exposed → tool `jont_j036_pdf-excel-scans-merged` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/pdf-excel-scans-merged/` · query from card-time refinement |

### J037 · Duplicate Row Finder

`validator · client · tier PRO · role PRO · score 7.25 · evidence E3 (source rank 33)`

| Field | Contract |
|---|---|
| Source row | `GT-CSV-find-DR-F1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Duplicate Row Finder (exact + fuzzy) |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J037/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j037_duplicate-row-finder` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/duplicate-row-finder/` · query `find duplicate rows csv` |

### J038 · Supplier CSV Mapper

`converter · client · tier PRO · role PRO · score 7.22 · evidence E1 (source rank 34)`

| Field | Contract |
|---|---|
| Source row | `DR-A5` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Marketplace/platform CSV imports (Shopify) fail on supplier CSVs because quoting, encoding, and column orde... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J038/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j038_supplier-csv-mapper` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/supplier-csv-mapper/` · query from card-time refinement |

### J039 · Supplier Catalog Normalizer

`converter · client · tier PRO · role PRO · score 7.17 · evidence E1 (source rank 35)`

| Field | Contract |
|---|---|
| Source row | `EC-C1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | "Supplier CSV import hell" — every supplier catalog update requires hours of manual fixing before Shopify a... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J039/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j039_supplier-catalog-normalizer` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/supplier-catalog-normalizer/` · query from card-time refinement |

### J040 · Big CSV → Excel Batches

`converter · client · tier FREE · role GLUE · score 7.15 · evidence E1 (source rank 36)`

| Field | Contract |
|---|---|
| Source row | `DR-A6` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Files >1M rows can't be opened in Excel — users need to split huge CSVs and don't know how. |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J040/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j040_big-csv-excel-batches` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/big-csv-excel-batches/` · query from card-time refinement |

### J041 · Inventory Sync Mapper

`converter · client · tier PRO · role PRO · score 7.15 · evidence E1 (source rank 37)`

| Field | Contract |
|---|---|
| Source row | `EC-C7` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Multichannel inventory sync (Shopify+Etsy+eBay+Amazon+POS) for tiny sellers = overselling risk; enterprise ... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J041/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j041_inventory-sync-mapper` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/inventory-sync-mapper/` · query from card-time refinement |

### J042 · CSV Encoding Converter

`converter · client · tier PRO · role PRO · score 7.15 · evidence E3 (source rank 39)`

| Field | Contract |
|---|---|
| Source row | `GT-CSV-convert-DR-A2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | CSV Encoding Converter (UTF-8/GBK/1252) |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J042/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j042_csv-encoding-converter` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/csv-encoding-converter/` · query `convert csv encoding utf-8` |

### J043 · PDF Line-break Repair

`fixer · client · tier FREE · role GLUE · score 7.12 · evidence E3 (source rank 40)`

| Field | Contract |
|---|---|
| Source row | `DR-G3` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | PDF-pasted or exported text arrives with broken line breaks/mid-word wraps, and cleaning it into one-row-pe... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J043/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/fixer.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j043_pdf-line-break-repair` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 repair + change log match · H2 idempotent (fix∘fix = fix) · H3 ambiguity → finding, not silent fix · E1 empty input → 422 · F1 unrecoverable → 422 |
| SEO | `/jonts/pdf-line-break-repair/` · query from card-time refinement |

### J044 · Unmerge & Fill (Excel)

`fixer · client · tier FREE · role GLUE · score 7.10 · evidence E1 (source rank 42)`

| Field | Contract |
|---|---|
| Source row | `DR-G2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Merged cells destroy sort/filter/pivot operations; analysts inherit "pretty" reports and must un-merge + ba... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J044/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/fixer.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j044_unmerge-fill-excel` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 repair + change log match · H2 idempotent (fix∘fix = fix) · H3 ambiguity → finding, not silent fix · E1 empty input → 422 · F1 unrecoverable → 422 |
| SEO | `/jonts/unmerge-fill-excel/` · query from card-time refinement |

### J045 · Study Deck Converter

`converter · server · tier FREE · role HOOK · score 7.10 · evidence E1 (source rank 43)`

| Field | Contract |
|---|---|
| Source row | `WG-G1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Quizlet paywall betrayal — teachers can't assign study modes anymore |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J045/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j045_study-deck-converter` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/study-deck-converter/` · query from card-time refinement |

### J046 · CSV to JSON

`converter · client · tier FREE · role HOOK · score 7.10 · evidence E3 (source rank 44)`

| Field | Contract |
|---|---|
| Source row | `GT-JSON-csv-DV-B2` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | CSV to JSON |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J046/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j046_csv-to-json` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/csv-to-json/` · query `csv to json converter` |

### J047 · Price/Stock Sync Re-pull

`converter · client · tier PRO · role PRO · score 7.05 · evidence E1 (source rank 45)`

| Field | Contract |
|---|---|
| Source row | `EC-C6` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Supplier price/stock scheduled sync: tiny dropshippers must periodically re-pull supplier CSV/FTP feeds and... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J047/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j047_price-stock-sync-re-pull` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/price-stock-sync-re-pull/` · query from card-time refinement |

### J048 · AI Text De-slopper

`fixer · server · tier PRO · role PRO · score 7.05 · evidence E1 (source rank 46)`

| Field | Contract |
|---|---|
| Source row | `WG-G6` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | De-slopping AI text (writers/marketers) |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J048/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | server; pattern skeleton `jont-kit/src/patterns/fixer.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j048_ai-text-de-slopper` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 repair + change log match · H2 idempotent (fix∘fix = fix) · H3 ambiguity → finding, not silent fix · E1 empty input → 422 · F1 unrecoverable → 422 |
| SEO | `/jonts/ai-text-de-slopper/` · query from card-time refinement |

### J049 · Nested JSON ↔ CSV

`converter · client · tier FREE · role GLUE · score 7.03 · evidence E1 (source rank 47)`

| Field | Contract |
|---|---|
| Source row | `DR-B3` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | JSON↔CSV conversion of nested data is "almost impossible" for practitioners — array-of-struct nesting flatt... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J049/`); max upload 2 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/converter.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j049_nested-json-csv` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/nested-json-csv/` · query from card-time refinement |

### J050 · Fuzzy Company Dedupe

`validator · client · tier PRO · role PRO · score 7.03 · evidence E1 (source rank 48)`

| Field | Contract |
|---|---|
| Source row | `DR-G1` — provenance in `research/opportunities.json` |
| H1 subtitle (verbatim, VOL-00 §0.5) | Fuzzy duplicate removal (same company with typos/abbreviations) is beyond Excel's exact-match Remove Duplic... |
| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/J050/`); max upload 25 MB (tier cap, VOL-01 §4.2) |
| Engine | client; pattern skeleton `jont-kit/src/patterns/validator.ts` + card algorithm |
| AI fallback | — |
| MCP | exposed → tool `jont_j050_fuzzy-company-dedupe` (schema = manifest `input.schema`) |
| Acceptance (VOL-11 §6) | H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422 |
| SEO | `/jonts/fuzzy-company-dedupe/` · query from card-time refinement |
