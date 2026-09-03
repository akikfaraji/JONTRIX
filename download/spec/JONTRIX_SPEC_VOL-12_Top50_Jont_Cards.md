# Volume 12 — The Top-50 Jont Build Cards

**Document:** JONTRIX Build Specification — VOL-12
**Publisher:** Fraziym Soft
**Version:** 1.0 (2026-09-03)
**Status:** LOCKED (scores, order, tier_fit from the frozen `research/opportunities.json`; details per this volume)
**Depends on:** VOL-11 (patterns, manifest, harness), VOL-02 (evidence tracing), VOL-01 §4 (tier gates). Referenced by: VOL-13 (long-tail), VOL-07 §3 (page template), VOL-14 (DoD).

---

## §1 How To Read The Cards (LOCKED)

Cards are listed in **descending composite score — that is the build order** (VOL-00 Phase 3/9). Every card inherits the VOL-11 contracts (manifest, pattern, harness) and states only its specifics: I/O contract, behavior rules, and the fixture rows the harness (VOL-11 §7) must run. Fields `score`, `tier_fit`, and the evidence row id are **traced, never re-derived** (T2.2). Card fields map into `jont.manifest.json` and the registry row; `mcp_exposed = true` for every server-context Jont and every client Jont whose arguments are all primitive (file-bearing client Jonts are not MCP-exposable — agents cannot upload local files). Client-side Jonts must satisfy C6 (files never leave the browser); server-side ones are labeled as such on every surface.

Notation per card: **Score X.XX · TIER · ROLE · pattern · context · family** · trace row.

## §2 Batch 1 — J001–J017 (Data & Repair core + chain runner)

### J001 · `pdf-edit-merge` — PDF Edit & Merge Toolkit
**8.20 · FREE · HOOK · converter · hybrid · `data-repair` · trace DR-C3 (E1)**
**I/O:** `pdf(s) + ops[]{merge|split|rotate|delete|reorder|extract-pages|metadata} → pdf bytes`
**Behavior:** all page ops run client-side (WASM, C6); ops validated against page count with precise errors; output linearized; hybrid = optional server path for >100 MB files with the visible "runs on our server" label. Free preview: page thumbnails always render.
**Accept:** merge 3 PDFs → page order exact; rotate 90° renders in 3 viewers; 150 MB merge via server path labeled honestly; FREE tier never 402s.

### J002 · `bank-statement-pdf-to-csv` — Bank Statement PDF→CSV (QuickBooks-class)
**8.03 · PRO · LTV · extractor · server · `data-repair` · trace DR-F1 (E1)**
**I/O:** `pdf (statement, ≤100 MB) + bank_profile → csv{date, description, ref, debit, credit, balance}`
**Behavior:** text-layer extraction first; OCR fallback (ai_steps, VOL-05 §10 cache); per-bank column profiles in fixtures; balance-chain validation warns on gaps; output opens in QuickBooks/Xero importers without mapping edits.
**Accept:** 10-bank fixture set → 100% row reconciliation (debits+credits=balance delta); scanned fixture → OCR path with confidence warnings; Free tier → first 10 rows preview then 402.

### J003 · `pdf-table-extractor` — PDF Table Extractor to CSV (text-layer)
**7.75 · PRO · LTV · extractor · server · `data-repair` · trace GT-PDF-extract-DR-C2 (E1)**
**I/O:** `pdf → csv[] (one per detected table) + table_bboxes`
**Behavior:** deterministic lattice/stream detection; multi-page tables stitch with a `continued` warning; confidence score per table; no OCR at this tier (that is J002/J031).
**Accept:** 25-fixture corpus ≥ 95% cell accuracy vs ground truth; borderless-table fixture extracts with warning; multi-page table stitches once.

### J004 · `chain-runner` — The Tool-Stitching Chain Runner
**7.67 · FREE · HOOK · converter · hybrid · `data-repair` · trace DR-D2 (E2)**
**I/O:** `chain{steps:[jont_id…], io_bindings} + initial_input → final_output + per-step_results`
**Behavior:** the DR-D2 meta-tool — presets of ordered Jonts (VOL-11 §6); each step gates and meters independently; failure stops the chain with the step id and the produced-so-far artifacts.
**Accept:** PDF→CSV→dedupe chain runs; PRO-fit middle step on Free → 402 at that step, steps 1 and 3 metered (T11.6); chain preset re-runs byte-identical.

### J005 · `json-giant-inspector` — Giant JSON/JSONL Inspector & Splitter
**7.62 · FREE · HOOK · validator · client · `devtools` · trace DR-B2 (E1)**
**I/O:** `json|jsonl (≤2 GB) → structure_report{depth, keys, row_count, types} + split_plan`
**Behavior:** streaming parser in a Web Worker — the tab never freezes (the DR-B2 complaint is literally "crash or freeze"); ND/JSONL auto-detect; split by count/size produces valid fragments; everything client-side (C6).
**Accept:** 1.5 GB JSONL streams at < 200 MB RAM; split 1M rows into 10 valid files; malformed tail reports byte offset; Free 402 never fires.

### J006 · `receipt-invoice-extractor` — Invoice/Receipt Data Extraction
**7.60 · MAX · LTV · extractor · server · `data-repair` · trace DR-H1 (E1)**
**I/O:** `image|pdf (receipts, invoices) → json{vendor, date, lines[], totals, tax, currency}`
**Behavior:** OCR + ai_steps for vendor/line normalization (deterministic geometry first); per-line confidence; CSV/JSON export; batch mode up to `batch_rows_max`.
**Accept:** 50-receipt fixture ≥ 90% field accuracy; totals reconcile or warn; MAX-fit gate 402s at Studio (T1.3 analog).

### J007 · `citation-verifier` — Hallucinated Citation Verifier
**7.60 · MAX · LTV · validator · server · `edu-gold` · trace WG-G4 (E1)**
**I/O:** `text|bibliography + style → findings[{citation, verdict, doi_or_url, confidence}]`
**Behavior:** deterministic DOI/ISBN/URL syntax + resolver checks first (Crossref-class public APIs, C7); ai_steps only for fuzzy title matching; verdicts: `verified | doi-mismatch | not-found | fabricated-suspect` with evidence links.
**Accept:** 100-citation fixture with 12 fabricated → all 12 flagged, zero false "verified"; DOI syntax errors caught deterministically; no resolver call repeated within 30 days (cache).

### J008 · `csv-splitter` — CSV Splitter (rows/size)
**7.60 · PRO · PRO · converter · client · `data-repair` · trace GT-CSV-split-DR-B2 (E2)**
**I/O:** `csv + {by: rows|bytes, value, header_repeat: bool} → csv[]`
**Behavior:** streaming RFC 4180 parsing (quoted newlines never split mid-record); header repeated per part optional; naming pattern `file_part001.csv`.
**Accept:** 5 GB file splits by 100k rows on client; quoted-embedded-newline record stays intact across boundary check; header repeat on/off exact.

### J009 · `csv-open-guard` — Leading-Zero & Date Guard
**7.60 · PRO · PRO · fixer · client · `data-repair` · trace GT-CSV-excel-DR-A2 (E2)**
**I/O:** `csv → fixed_csv + change_log{column, rule, count}`
**Behavior:** detects Excel-mangle hazards (leading zeros, date-ambiguous `01-02`, scientific notation, `SEP=` hacks) and emits Excel-safe forms (`="0100"`, ISO dates) with a per-column change log; round-trip proof included in fixtures.
**Accept:** ID column `0100` survives Excel open-close round trip; `01-02-2026` normalized to ISO with log; zero false positives on 10k-row fixture.

### J010 · `payment-invoice-matcher` — Bank/UPI Payment ↔ Invoice Matcher
**7.58 · PRO · LTV · fixer · server · `ecom-smb` · trace EC-C21 (E1)**
**I/O:** `bank_export + invoice_list → matches[{invoice, payment, score}], unmatched[]`
**Behavior:** deterministic rules first (amount exact, ref-substring, date window); ai_steps only for fuzzy memo matching; every match carries the rule or confidence that fired; exports a posting-ready CSV.
**Accept:** 200-payment fixture ≥ 95% auto-match with zero wrong-positives at threshold; ambiguous memo → ai path with cache; unmatched list actionable.

### J011 · `json-big-editor` — Large-JSON Viewer/Editor (server path)
**7.58 · PRO · PRO · validator · server · `devtools` · trace DV-B1 (E2)**
**I/O:** `json (100 MB–1 GB) + jsonpath_edits[] → edited_json | report`
**Behavior:** server-side streaming edit (the client J005 handles inspection; this edits); JSONPath subset documented in fixtures; edits validated before write; output byte-stable ordering preserved.
**Accept:** 800 MB file: 3-path edit round-trips without OOM; invalid path → 422 naming the path; identical input+edits → byte-identical output.

### J012 · `csv-delimiter-doctor` — CSV One-Column Fixer
**7.55 · FREE · HOOK · fixer · client · `data-repair` · trace DR-A2 (E1)**
**I/O:** `csv(text) → diagnosis{delimiter, encoding, quote_style} + fixed_csv`
**Behavior:** auto-sniffs delimiter/encoding/quote rules with a confidence table shown to the user (honest diagnosis before fix); one-click re-parse preview (first 20 rows always free).
**Accept:** semicolon-UTF-8 fixture → diagnosis correct, preview renders columns; pipe-delimited with quoted commas parses exact; FREE, never 402.

### J013 · `bkash-receipt-parser` — bKash/Nagad Receipt → Order Entry
**7.55 · FREE · HOOK · extractor · server · `bd-telegram` · trace EC-C28 (E2)**
**I/O:** `screenshot|sms_text → json{trx_id, amount, time, sender, network}`
**Behavior:** OCR + deterministic regex layer for BD wallet formats (bKash/Nagad/Rocket templates versioned); trx_id checksum-ish validation flags suspicious reads; feeds J010 matching as a chain suggestion.
**Accept:** 40-screenshot BD fixture ≥ 92% trx_id accuracy; SMS-text path 100% on templates; chain suggestion into J010 one tap.

### J014 · `whatsapp-order-triage` — WhatsApp Chats → Orders CSV
**7.55 · PRO · LTV · extractor · server · `ecom-smb` · trace EC-C29 (E1)**
**I/O:** `whatsapp_export.txt + menu_schema → orders_csv + exceptions[]`
**Behavior:** parses chat export (deterministic format parser); item/qty extraction via menu_schema matching; ai_steps for free-text orders; exceptions list is first-class (unparsed orders are revenue — never dropped silently).
**Accept:** 200-order fixture ≥ 90% parsed, 100% accounted (parsed+exceptions); multilingual fixture (bengali+english) parses; date/time timezone rules explicit.

### J015 · `ai-provenance-trail` — Student AI-Use Provenance Builder
**7.55 · PRO · PRO · generator · client · `edu-gold` · trace WG-G5 (E1)**
**I/O:** `draft_versions[] + prompts[] → provenance_report (pdf/md)`
**Behavior:** the anti-false-positive tool: builds a timestamped trail of drafts, prompts, and edits from files the student already has; fully client-side (C6 — drafts never upload); deterministic report generator.
**Accept:** 5-version draft → report renders hashes + timestamps; no network calls during generation (leak test); report opens in Word.

### J016 · `shopify-csv-sanitizer` — Shopify Import Sanitizer
**7.53 · PRO · PRO · fixer · server · `ecom-smb` · trace EC-C3 (E1)**
**I/O:** `csv + shopify_profile → clean_csv + rejection_report`
**Behavior:** encodes to UTF-8, strips illegal control chars, normalizes HTML fields, enforces Shopify column contract; the rejection report names every fix (C8 — no silent mutations); re-import success is the metric.
**Accept:** 20-known-rejection fixtures → all import clean on retry; report lists every mutation; idempotent (sanitize twice = second no-op).

### J017 · `cors-explainer` — CORS Echo & Explainer
**7.53 · FREE · HOOK · validator · client · `devtools` · trace DV-B3 (E2)**
**I/O:** `url + method + headers → echo_result + explanation{missing_header, cause, fix}`
**Behavior:** calls the target from the browser (the only honest way to test CORS), explains the failure in one deterministic paragraph from observed headers; no server proxy (that would lie about CORS).
**Accept:** 10-scenario fixture (no ACAO, bad origin, preflight fail) → all explained with the exact missing header; no request leaves the user's machine except to the target URL; FREE.

## §3 Batch 2 — J018–J034 (Repair depth + DevTools + Ecom validators)

### J018 · `pdf-form-flattener` — PDF Form Flatten & Lock
**7.48 · PRO · PRO · converter · client · `data-repair` · trace DR-C4 (E1)**
**I/O:** `pdf(filled form) → pdf(flattened) | report{fields_found, fields_flattened}`
**Behavior:** AcroForm → page content in-browser (C6); report names any field that could not flatten; optional read-only permission flag; the DR-C4 complaint ("data disappears when printing") is the acceptance lens.
**Accept:** 15-form fixture flattens 100% of fillable fields; print-preview of output shows values; report on a corrupt-field fixture names it.

### J019 · `statement-trust-preview` — Bank Statement PDF→CSV (Free trust preview)
**7.42 · FREE · GLUE · extractor · client · `data-repair` · trace EC-C26 (E2)**
**I/O:** `pdf (text-layer statement) → csv (first 10 rows full quality) + trust_report`
**Behavior:** the "shady website" antidote: runs entirely in-browser (C6, nothing uploads), shows exactly what the paid J002 would produce — first 10 rows + a per-column mapping report; the pitch for Pro is the whole file, not a crippled format.
**Accept:** fixture matches J002 output on the first 10 rows byte-for-byte; zero network calls during parse (leak test); upgrade card cites row count only.

### J020 · `scanned-pdf-ocr` — Scanned PDF OCR & Text Layer
**7.40 · PRO · PRO · extractor · server · `data-repair` · trace DR-C2 (E1)**
**I/O:** `pdf(scanned) → pdf(with text layer) | txt`
**Behavior:** deterministic image preprocessing (deskew, binarize) then OCR; per-page confidence; ai_steps only for garbage-line cleanup; searchable output preserves page images byte-exact.
**Accept:** 30-page fixture ≥ 97% word accuracy on clean scans; noisy scan → confidence warnings per page; output PDF text-selectable.

### J021 · `file-safety-analyzer` — Download Safety Pre-Check
**7.40 · FREE · HOOK · validator · client · `data-repair` · trace DR-D1 (E1)**
**I/O:** `file → report{magic_bytes, extension_mismatch, macro_presence, entropy, sha256}`
**Behavior:** answers "is this sketchy free-tool download safe to open?" locally: magic-byte vs extension check, Office macro presence, archive nesting, entropy; fully offline; the report explains each verdict in one sentence (C8).
**Accept:** renamed-exe-as-pdf fixture flagged (mismatch); macro-bearing docx flagged; 1 GB file hashes in-stream; FREE never 402.

### J022 · `sql-dialect-rewriter` — MySQL↔PostgreSQL Dialect Rewriter
**7.40 · PRO · LTV · converter · server · `devtools` · trace DV-B10 (E2)**
**I/O:** `sql_script + {from,to} → sql_script + change_log{rule, count}`
**Behavior:** deterministic rule table (backticks→quotes, AUTO_INCREMENT→serial, ENGINE clauses, LIMIT syntax, type maps); every rewrite logged; untranslatable constructs listed, never guessed (C8).
**Accept:** 30-rule fixture corpus round-trips psql/pg_dump clean; change_log counts match; untranslatable fixture surfaces in report, output still parses.

### J023 · `json-to-csv` — JSON→CSV (arrays-safe flatten)
**7.40 · PRO · PRO · converter · server · `devtools` · trace GT-JSON-json-DV-B2 (E2)**
**I/O:** `json[] + flatten_options{array_strategy, key_case} → csv`
**Behavior:** documented array strategies (join `|` / index columns / rows-out); nested-key flattening with `.` separator; column order = first-seen, stable.
**Accept:** nested+array fixture per strategy exact; 100 MB input streams server-side; identical input → byte-identical output.

### J024 · `csv-preflight-validator` — Universal CSV Pre-flight Validator
**7.40 · PRO · PRO · validator · client · `data-repair` · trace GT-CSV-csv-DR-A1-2 (E2)**
**I/O:** `csv + target_profile{column_types, required, ranges} → findings[] + fix_suggestions`
**Behavior:** rule-based validation before an import ruins your day: type/range/required/encoding/duplicate-key checks with row pointers; suggestions are one-click fixes into the sibling fixer Jonts.
**Accept:** 12-defect fixture → 12/12 found with row/field pointers; clean file → zero findings in < 5 s for 1M rows (client streaming).

### J025 · `shopify-product-preflight` — Shopify Product CSV Pre-flight
**7.40 · PRO · LTV · validator · server · `ecom-smb` · trace GT-MKT-shopify-EC-C1 (E1)**
**I/O:** `product_csv + shopify_version → findings[] + corrected_csv (opt-in)`
**Behavior:** the full Shopify product-import contract as rules (Handle uniqueness, BodyHTML sanity, image URLs, Variant option grammar, weight units); rejection rate against a 200-row real-shaped fixture is the score.
**Accept:** seeded rejection fixtures caught 100%; corrected output imports in test store fixture; rule table versioned per Shopify profile.

### J026 · `csv-to-qbo-ofx` — CSV→QBO/OFX Bank Converter
**7.35 · PRO · PRO · converter · server · `data-repair` · trace DR-F2 (E1)**
**I/O:** `bank_csv + column_map + account_meta → qbo|ofx`
**Behavior:** produces QBO/OFX that passes Intuit's validator (the DR-F2 complaint is validators failing on bank IDs/dates/amounts): deterministic date/amount normalization, FITID generation rules, debit/credit sign conventions; validation report included.
**Accept:** output imports into QuickBooks test fixture with zero validator errors; duplicate FITID impossible; amounts round-trip to the cent.

### J027 · `business-bank-statement-csv` — Business-Bank Statement → CSV
**7.35 · MAX · LTV · extractor · server · `data-repair` · trace DR-F4 (E1)**
**I/O:** `pdf (business statement, ≤100 MB) → csv + audit_trail`
**Behavior:** business-format profiles (multi-page, multi-currency, fee lines); the audit_trail lists page→row provenance for every line (bookkeepers ask "can I trust row 400?" — the answer ships in the file); OCR fallback as J002.
**Accept:** multi-currency fixture reconciles; provenance spot-check on 10 random rows resolves to the right page/coords; MAX gate enforced.

### J028 · `excel-safe-importer` — Excel Row-Limit & Mangle Guard
**7.33 · FREE · GLUE · fixer · client · `data-repair` · trace DR-A1 (E1)**
**I/O:** `csv → report{row_count_vs_limit, mangle_risks[]} + safe_split_plan`
**Behavior:** pre-open check: warns >1,048,575 rows, leading-zero/date columns (hands to J009/J008); explains in one sentence why Excel will lie about the file; everything local.
**Accept:** 1.2M-row file → warning + split plan exact; zero-row-loss plan verified by re-count; FREE.

### J029 · `csv-delimiter-fix` — CSV Delimiter Fixer (manual override)
**7.30 · PRO · PRO · fixer · client · `data-repair` · trace GT-CSV-csv-DR-A1 (E2)**
**I/O:** `csv + {delimiter, quote, escape} → normalized_csv`
**Behavior:** J012's diagnosis, PRO-grade action: manual delimiter/quote/escape override with instant re-parse preview and RFC 4180-normalized output; handles `""` escaping edge cases.
**Accept:** torture-quote fixture normalizes; preview updates < 200 ms on 100k rows; byte-stable output.

### J030 · `llm-json-repair` — LLM JSON Repair (client)
**7.25 · FREE · HOOK · fixer · client · `devtools` · trace DR-B1 (E2)**
**I/O:** `broken_json(text) → fixed_json + repair_log{rule, position}`
**Behavior:** the trailing-comma/single-quote/unquoted-key/markdown-fence class, fixed deterministically in-browser (no AI — the input *is* AI output; rules beat vibes); repair_log is copy-pasteable.
**Accept:** 40-broken-output fixture (real LLM failure shapes) → 40/40 repaired; unrecoverable fixture → precise byte-offset error; FREE.

### J031 · `pdf-to-excel-reconstruct` — PDF→Excel Table Reconstructor
**7.25 · MAX · PRO · extractor · server · `data-repair` · trace DR-C1 (E1)**
**I/O:** `pdf(scanned/complex tables) → xlsx{sheets per page, merged-cell map}`
**Behavior:** the MAX flagship above J003: OCR + grid reconstruction with merged-cell semantics restored as real merged ranges; column-type inference; confidence per cell; the "scrambles tables" complaint is the fixture set.
**Accept:** merged-header fixture reconstructs merges; financial fixture totals tie out; MAX gate.

### J032 · `duplicate-row-finder` — Duplicate Row Finder (exact + fuzzy)
**7.25 · PRO · PRO · validator · server · `data-repair` · trace GT-CSV-find-DR-F1 (E2)**
**I/O:** `csv + key_columns + fuzzy_threshold → duplicate_groups[] + deduped_csv`
**Behavior:** exact key match first (deterministic); fuzzy via normalized edit distance with the threshold shown; every group lists all members and a keep/drop recommendation the user confirms (never auto-delete).
**Accept:** seeded typo-dupes group correctly at threshold; auto-keep rule documented; 1M rows < 30 s.

### J033 · `marketplace-quote-fix` — Supplier CSV Quoting Fixer
**7.22 · PRO · PRO · fixer · server · `ecom-smb` · trace DR-A5 (E1)**
**I/O:** `supplier_csv → marketplace_safe_csv + change_log`
**Behavior:** fixes the quoting/embedded-separator class that breaks platform importers; per-marketplace profile presets; round-trip diff view before/after.
**Accept:** broken-quote fixture imports clean post-fix; diff shows every mutation; idempotent.

### J034 · `supplier-catalog-normalizer` — Supplier Catalog → Import Format
**7.17 · PRO · PRO · converter · server · `ecom-smb` · trace EC-C1 (E1)**
**I/O:** `supplier_csv/xlsx + mapping_template → normalized_csv + unmapped_fields[]`
**Behavior:** column mapping with saved templates per supplier (presets are the retention hook); unit normalization (pieces/dozen, cm/inch); category mapping table user-editable; unmapped fields surfaced, never dropped.
**Accept:** 3-supplier fixtures map via templates in < 5 min of config; unmapped field appears in report; template reuse runs deterministic.

## §4 Batch 3 — J035–J050 (Utilities, Education, Merchant fixes)

### J035 · `csv-sampler` — Big-CSV Sampler (head/tail/random)
**7.15 · FREE · GLUE · extractor · client · `data-repair` · trace DR-A6 (E1)**
**I/O:** `csv + {mode: head|tail|random, n} → sample_csv + total_rows`
**Behavior:** the "I just need to see what's in this 3 GB file" tool: streaming sample extraction (seeded random for reproducibility), row count without full load; pairs with J008/J028 via chain suggestions.
**Accept:** 2 GB fixture samples 1k random rows < 10 s; seeded re-run identical; row count exact; FREE.

### J036 · `inventory-merge` — Multichannel Inventory Merge
**7.15 · PRO · PRO · fixer · server · `ecom-smb` · trace EC-C7 (E1)**
**I/O:** `channel_exports[] + sku_key + rules{priority} → unified_stock_csv + conflicts[]`
**Behavior:** merges Shopify/Etsy/eBay/POS stock files on SKU; conflict rows (same SKU, different counts) are listed, not resolved silently (C8); priority rules documented per merge.
**Accept:** 4-channel fixture → unified file + conflict report exact; priority rule deterministic; conflict list actionable.

### J037 · `json-repair-server` — JSON Repair (server, big files)
**7.15 · PRO · PRO · fixer · server · `devtools` · trace GT-JSON-fix-DV-B20 (E2)**
**I/O:** `broken_json (≤1 GB) → fixed_json + repair_log`
**Behavior:** J030's rule engine server-side for sizes a browser can't hold; streaming repair; same rule ids as J030 so logs cross-reference.
**Accept:** 500 MB broken file repairs; rule parity with J030 on shared fixtures; byte-stable.

### J038 · `csv-encoding-converter` — CSV Encoding Converter (UTF-8/GBK/1252)
**7.15 · PRO · PRO · converter · client · `data-repair` · trace GT-CSV-convert-DR-A2 (E2)**
**I/O:** `csv(any encoding) + target → utf-8_csv + detected_encoding`
**Behavior:** detection table (BOM, heuristics) shown honestly before conversion; GBK/1252/UTF-16 fixtures; newline normalization optional.
**Accept:** GBK fixture → valid UTF-8, lossless round-trip; detection correct on 10-encoding corpus; mojibake flagged, not silently converted.

### J039 · `text-reflow-fixer` — Pasted-Text Line-Break Fixer
**7.12 · FREE · GLUE · fixer · client · `web-text` · trace DR-G3 (E2)**
**I/O:** `text + {join_rule, paragraph_detection} → clean_text`
**Behavior:** un-breaks mid-word/mid-sentence wraps while preserving real paragraphs; join rules are explicit and previewed; the "PDF paste garbage" class, fixed locally.
**Accept:** PDF-paste fixture reflows with paragraphs intact; hyphenated line-ends de-hyphenate per rule; FREE.

### J040 · `question-bank-builder` — Exam Question-Bank Builder
**7.12 · FREE · HOOK · generator · client · `edu-gold` · trace WG-G17 (E1)**
**I/O:** `question_sources[] (csv/md/docx-text) → question_bank (csv|quiz_json|printable_pdf)`
**Behavior:** parses MCQ/short-answer banks from messy sources; dedupe by normalized stem; outputs a print practice set or quiz JSON; education pricing promise: the bank builder stays FREE (WG-G17's whole point is access).
**Accept:** 500-question messy fixture parses ≥ 95%; dupes grouped; printable PDF renders math text without loss; FREE.

### J041 · `xlsx-unmerge` — Merged-Cell Un-Merger
**7.10 · FREE · GLUE · fixer · client · `data-repair` · trace DR-G2 (E2)**
**I/O:** `xlsx → flat_csv + unmerge_log{range, fill_strategy}`
**Behavior:** converts merged cells to filled flat data (fill strategy: copy value / blank), making sort/filter/pivot possible again; log lists every unmerge; all local.
**Accept:** pretty-report fixture unmerges and pivots in a test spreadsheet; both fill strategies exact; FREE.

### J042 · `flashcard-set-converter` — Study-Set Converter (Quizlet-class export)
**7.10 · FREE · HOOK · converter · client · `edu-gold` · trace WG-G1 (E1)**
**I/O:** `csv|tsv|quiz_json → deck exports (csv, Anki-importable tsv, printable cards)`
**Behavior:** the paywall-betrayal antidote: teachers keep their decks in open formats; term/definition separator detection; deck stats shown (card count, blanks).
**Accept:** 3-format fixtures round-trip; Anki tsv imports in fixture; FREE.

### J043 · `csv-to-json` — CSV→JSON
**7.10 · FREE · HOOK · converter · client · `devtools` · trace GT-JSON-csv-DV-B2 (E2)**
**I/O:** `csv + {type_inference, nesting} → json`
**Behavior:** type inference on/off (numbers, bools, nulls) with the inference report; flat output is the default; nesting by `.` column names; streaming for big files.
**Accept:** type-inference fixtures exact; 500 MB input streams in-worker; FREE.

### J044 · `price-stock-diff` — Supplier Price/Stock Diff Engine
**7.05 · PRO · PRO · validator · server · `ecom-smb` · trace EC-C6 (E1)**
**I/O:** `old_feed + new_feed + sku_key → diff{added, removed, price_changed, stock_changed}`
**Behavior:** scheduled-sync core: deterministic diff with percentage-bucket summaries; output is a re-price action CSV; runs on cron for presets (the SMB "re-pull weekly" pain).
**Accept:** 10k-SKU diff exact vs hand-computed; price-bucket summary correct; repeat run idempotent.

### J045 · `ai-text-deglosser` — AI-Text De-Slopper
**7.05 · PRO · PRO · fixer · client · `web-text` · trace WG-G6 (E2)**
**I/O:** `text + intensity{light|medium|deep} → revised_text + change_log{phrase, rule}`
**Behavior:** deterministic rule lists (the "delve/tapestry/in today's fast-paced world" glossary, em-dash storms, rule-of-three tics), versioned; every change logged and reversible; NOT an AI humanizer — rules, shown honestly (C8).
**Accept:** slop-corpus fixture hits ≥ 90% of seeded tells; clean human text → near-zero false positives; change_log reversible.

### J046 · `nested-json-csv` — Nested JSON↔CSV Two-Way (client)
**7.03 · FREE · GLUE · converter · client · `devtools` · trace DR-B3 (E2)**
**I/O:** `nested_json | csv → the other side + strategy_report`
**Behavior:** the practitioner's "almost impossible" pairing, solved in-browser both directions with the strategy visible (array columns vs rows-out, key flattening); shares rule ids with J023.
**Accept:** nested fixture round-trips with documented lossless strategy; lossy strategy warns exactly what is lost; FREE.

### J047 · `company-name-dedupe` — Fuzzy Company-Name Dedupe
**7.03 · PRO · PRO · fixer · server · `data-repair` · trace DR-G1 (E1)**
**I/O:** `csv + name_column → groups[] + merged_csv`
**Behavior:** normalization rules (Ltd/LLC/limited, punctuation, case) + edit-distance clustering beyond Excel's powers; groups confirmed by the user; merge writes the survivor rule.
**Accept:** seeded typo/abbrev corpus groups ≥ 95%; acronyms not over-merged at default threshold; 500k rows < 60 s.

### J048 · `amazon-flatfile-format` — Amazon Flat File Formatter
**7.03 · PRO · LTV · converter · server · `ecom-smb` · trace EC-C9 (E1)**
**I/O:** `product_csv + category_template → amazon_flatfile + preflight_report`
**Behavior:** category-template-driven column mapping (templates versioned, their churn is the research finding); required-field completion; output pre-flighted against the 8541-class error shapes (J's sibling validator J050 in VOL-13 family batches covers the error decoder).
**Accept:** 3 category templates produce import-clean files in fixture; template-version bump requires explicit update (no silent drift); preflight report accurate.

### J049 · `merchant-feed-fix` — Google Merchant Center Feed Fixer
**7.03 · PRO · LTV · validator · server · `ecom-smb` · trace EC-C15 (E1)**
**I/O:** `product_feed → disapproval_findings[] + fixed_feed`
**Behavior:** encodes the bulk-disapproval classes (price mismatch, missing GTIN, image policy strings) as deterministic checks; fixed feed re-runs the checks until clean; findings cite the policy class name.
**Accept:** seeded disapproval fixture caught 100%; fixed feed passes re-check; policy-class names in every finding row.

### J050 · `xlsx-csv-converter` — XLSX↔CSV Converter
**7.00 · FREE · HOOK · converter · client · `data-repair` · trace GT-CSV-xlsx-DR-A1 (E2)**
**I/O:** `xlsx | csv → the other side + sheet_picker`
**Behavior:** sheet selection, formula-as-value option, date/locale-safe serialization; the highest-volume utility on the shelf — speed is the feature; all local.
**Accept:** 1M-row xlsx converts < 20 s in-worker; formulas exported as values when chosen; date columns round-trip; FREE.

## §5 Card Registry Sync and Build Order (LOCKED)

These 50 cards seed `jonts` with `status='planned'` in build order (J001→J050). Phase 3 builds J001–J010 (chosen to exercise all five patterns and both contexts); Phase 9 completes the rest in score order. Tier counts in this volume: **18 FREE · 28 PRO · 4 MAX** — with VOL-13's 197 long-tail Jonts (137 FREE / 51 PRO / 9 MAX) this reproduces the catalog distribution exactly: **155 / 79 / 13** (VOL-02 §2, T2.1). **MUST:** every card's harness fixtures live in `tests/jonts/<id>/`; a card without fixtures cannot be marked `built`; **NEVER** a score/tier edit that does not come from `opportunities.json` re-freeze. Cards marked `hybrid` or `server` with `mcp_exposed=true` appear in the MCP catalog (VOL-10 §4.5); file-bearing client-only Jonts do not.

**DoD hooks (VOL-14):** "top-50 all built + harness green" (G-10 shared), "score/tier traceability audit vs research JSON" (G-28), "MAX gate proven on J006/J007/J027/J031" (G-29).
