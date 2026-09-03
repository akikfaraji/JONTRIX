#!/usr/bin/env python3
"""Generate VOL-12 (top-50 Jont cards), VOL-13 (long-tail catalog), and
spec/catalog/jonts.seed.json from the frozen research/opportunities.json.
Contracts-only output; names marked as working names refineable at card time."""
import json, re, html
from collections import OrderedDict, Counter

BASE = '/home/z/my-project'
rows = json.load(open(f'{BASE}/research/opportunities.json'))
for r in rows:
    r['score'] = float(r['composite'])
rows.sort(key=lambda r: -r['score'])
rank_of = {r['id']: i + 1 for i, r in enumerate(rows)}

# ---------- curated first ten (VOL-00 Phase 3: all 5 patterns x both contexts; + DV-B3/DV-B5 Phase-7 mandate) ----------
FIRST_TEN = ['DR-C3', 'GT-PDF-extract-DR-C2', 'DR-F1', 'GT-CSV-excel-DR-A2', 'DV-B3',
             'DR-A2', 'GT-JSON-fix-DV-B20', 'EC-C9', 'WG-G17', 'DV-B5']
MANDATED = {'DV-B3', 'DV-B5'}
SWAP_OUT = 'EC-C15'  # natural rank 50; moves to head of long tail so roster stays exactly 50

# ---------- working names ----------
NAME = {
 'DR-C3': 'PDF Edit & Merge Toolkit', 'DR-F1': 'Bank Statement PDF → CSV',
 'GT-PDF-extract-DR-C2': 'PDF Table Extractor', 'DR-D2': 'File Converter Chain',
 'DR-B2': 'Big JSON Splitter & Viewer', 'DR-H1': 'Receipt & Invoice Data Extractor',
 'WG-G4': 'Citation Verifier', 'GT-CSV-split-DR-B2': 'CSV Splitter',
 'GT-CSV-excel-DR-A2': 'Leading-Zero & Date Guard', 'EC-C21': 'Payment ↔ Invoice Matcher',
 'DV-B1': 'Big JSON Viewer & Query', 'DR-A2': 'CSV Column Split Repair',
 'EC-C28': 'Micro-seller Order Book', 'EC-C29': 'WhatsApp Order Parser',
 'WG-G5': 'AI-Provenance Report', 'EC-C3': 'Shopify CSV Preflight',
 'DV-B3': 'CORS Echo & Diagnose', 'DR-C4': 'PDF Form Flattener',
 'EC-C26': 'Bank PDF → CSV (Local)', 'DR-C2': 'Scanned PDF OCR',
 'DR-D1': 'File Safety Scanner', 'DV-B10': 'SQL Dialect Migrator',
 'GT-JSON-json-DV-B2': 'JSON to CSV (Flatten)', 'GT-CSV-csv-DR-A1-2': 'Universal CSV Pre-flight Validator',
 'GT-MKT-shopify-EC-C1': 'Shopify Product CSV Preflight', 'DR-F2': 'CSV → QBO/OFX Converter',
 'DR-F4': 'Statement Data Pull (No-CSV Banks)', 'DR-A1': 'Excel Import Guard',
 'DV-B6': 'Postman Collection Migrator', 'GT-CSV-csv-DR-A1': 'CSV Delimiter Fixer',
 'DR-B1': 'LLM JSON Cleaner', 'DR-C1': 'PDF → Excel (Scans & Merged)',
 'GT-CSV-find-DR-F1': 'Duplicate Row Finder', 'DR-A5': 'Supplier CSV Mapper',
 'EC-C1': 'Supplier Catalog Normalizer', 'DR-A6': 'Big CSV → Excel Batches',
 'EC-C7': 'Inventory Sync Mapper', 'GT-JSON-fix-DV-B20': 'JSON Repair',
 'GT-CSV-convert-DR-A2': 'CSV Encoding Converter', 'DR-G3': 'PDF Line-break Repair',
 'WG-G17': 'Exam Question Bank Builder', 'DR-G2': 'Unmerge & Fill (Excel)',
 'WG-G1': 'Study Deck Converter', 'GT-JSON-csv-DV-B2': 'CSV to JSON',
 'EC-C6': 'Price/Stock Sync Re-pull', 'WG-G6': 'AI Text De-slopper',
 'DR-B3': 'Nested JSON ↔ CSV', 'DR-G1': 'Fuzzy Company Dedupe',
 'EC-C9': 'Amazon Flat File Formatter', 'EC-C15': 'Merchant Center Fixer',
 'DV-B5': 'cURL to Code',
}
LONGTAIL = {  # long-tail working-name fixes (mechanical derivation too ugly to ship)
 'EC-C8': 'Amazon 8541 Match Fixer', 'DV-B2': 'JSON ↔ JSONL Converter', 'DV-B7': 'Webhook Test URL & Inspector',
 'EC-C5': 'Shopify Metafield Importer', 'WG-G10': 'Gig Driver Expense Tracker', 'DR-S1': 'Subtitle Sync Offset Fixer',
 'EC-C22': 'Settlement Reconciler', 'DR-A3': 'CSV Encoding Repair', 'DR-F5': 'WooCommerce Image URL Fixer',
 'WG-G15': 'Wedding Guest List Planner', 'DR-F3': 'Receipt Data Pull', 'EC-C4': 'Shopify Variant Sorter',
 'EC-C10': 'Etsy CSV Importer', 'EC-C23': 'Polite Invoice Reminder Generator', 'DV-B15': 'Unix Timestamp Converter',
 'GT-FIN-convert-DR-D1': 'OFX/QBO → CSV Converter', 'EC-C25': 'Receipt OCR (Free Tier)', 'EC-C16': 'Meta Catalog Feed Fixer',
 'GT-TXT-word-WG-G3': 'Word & Character Counter', 'DR-S4': 'Subtitle QC Checker', 'EC-C2': 'Shopify Image Import Fixer',
 'EC-C12': 'eBay Bulk CSV Formatter', 'EC-C19': 'Listing Localizer', 'EC-C30': 'Quote & Estimate Generator',
 'DR-A4': 'Ragged CSV Repair', 'DV-B17': 'API Replay Tester', 'DR-S2': 'Subtitle Encoding Fixer',
 'DV-B12': 'MCP Dev Toolbox', 'EC-C14': 'TikTok Shop Template Filler', 'DV-B19': 'YAML ↔ JSON ↔ TOML Converter',
 'EC-C13': 'Walmart Feed Validator', 'GT-OPS-mushak-EC-C27': 'VAT/Mushak 6.3 Invoice Generator',
 'DV-B20': 'JSON Escape/Unescape', 'DV-B9': 'Regex Explainer & Builder', 'GT-OPS-bkash-EC-C28': 'bKash/Nagad Fee Calculator',
 'GT-FIN-mt940-DR-D1': 'MT940/SWIFT → CSV Converter', 'GT-CFG-nginx-DV-B19': 'Nginx/Apache Config Tester',
 'GT-EDU-bd-WG-G3': 'GPA/CGPA Calculator (BD)', 'DV-B13': 'JWT Decoder & Verifier', 'DV-B8': 'Webhook Capture Bin',
 'WG-G25': 'AI Code Fixer for Non-Devs', 'GT-TXT-lorem-WG-G3': 'Lorem Placeholder Generator',
 'GT-WG-pta-WG-G19': 'PTA Dues & Attendance Tracker',
}
NAME.update(LONGTAIL)
PATTERN = {  # deterministic overrides (keyword fallback below)
 'DR-C3': 'converter', 'DR-F1': 'extractor', 'GT-PDF-extract-DR-C2': 'extractor', 'DR-D2': 'converter',
 'DR-B2': 'converter', 'DR-H1': 'extractor', 'WG-G4': 'validator', 'GT-CSV-split-DR-B2': 'converter',
 'GT-CSV-excel-DR-A2': 'validator', 'EC-C21': 'extractor', 'DV-B1': 'converter', 'DR-A2': 'fixer',
 'EC-C28': 'generator', 'EC-C29': 'extractor', 'WG-G5': 'validator', 'EC-C3': 'validator',
 'DV-B3': 'validator', 'DR-C4': 'converter', 'EC-C26': 'converter', 'DR-C2': 'extractor',
 'DR-D1': 'validator', 'DV-B10': 'converter', 'GT-JSON-json-DV-B2': 'converter',
 'GT-CSV-csv-DR-A1-2': 'validator', 'GT-MKT-shopify-EC-C1': 'validator', 'DR-F2': 'converter',
 'DR-F4': 'extractor', 'DR-A1': 'fixer', 'DV-B6': 'converter', 'GT-CSV-csv-DR-A1': 'fixer',
 'DR-B1': 'fixer', 'DR-C1': 'converter', 'GT-CSV-find-DR-F1': 'validator', 'DR-A5': 'converter',
 'EC-C1': 'converter', 'DR-A6': 'converter', 'EC-C7': 'converter', 'GT-JSON-fix-DV-B20': 'fixer',
 'GT-CSV-convert-DR-A2': 'converter', 'DR-G3': 'fixer', 'WG-G17': 'generator', 'DR-G2': 'fixer',
 'WG-G1': 'converter', 'GT-JSON-csv-DV-B2': 'converter', 'EC-C6': 'converter', 'WG-G6': 'fixer',
 'DR-B3': 'converter', 'DR-G1': 'validator', 'EC-C9': 'generator', 'EC-C15': 'validator',
 'DV-B5': 'converter',
}
AI_ROWS = {'DR-F1', 'DR-H1', 'DR-C2', 'DR-F4', 'DR-C1'}  # ai_required=True among roster candidates

def clean_gt(title):
    t = re.sub(r'\s*\([^)]*\)\s*', ' ', title)          # drop parentheticals
    t = re.sub(r'\s*/\s*[^/]*$', '', t)                  # "Repair / Error Fixer" tail
    t = re.sub(r'\s+', ' ', t).strip(' ,–-')
    return t or title

def kw_name(r):
    if r['id'].startswith('GT-'):
        return clean_gt(r['title'])
    t = r['title']
    for pat in [r'([\w\-/&]+→[\w\-/&]+(?: [\w\-]+)?)', r'([\w\-]+ (?:extractor|converter|validator|fixer|repair|finder|guard|viewer|splitter|mapper|parser|formatter|migrator|scanner|builder|dedupe))']:
        m = re.search(pat, t, re.I)
        if m:
            return m.group(1).strip().title()
    return re.split(r'[—:\-]', t)[0].strip()[:48].title()

def kw_pattern(r):
    t = (r['title'] + ' ' + (r.get('seo_query') or '')).lower()
    for k, p in [('extract', 'extractor'), ('pull ', 'extractor'), ('parse', 'extractor'), ('ocr', 'extractor'), ('import ', 'extractor'),
                 ('valid', 'validator'), ('check', 'validator'), ('verif', 'validator'), ('guard', 'validator'), ('preflight', 'validator'),
                 ('diagnos', 'validator'), ('scanner', 'validator'), ('detect', 'validator'),
                 ('fix', 'fixer'), ('repair', 'fixer'), ('dedupe', 'fixer'), ('clean', 'fixer'), ('unmerge', 'fixer'),
                 ('generat', 'generator'), ('mock', 'generator'), ('template', 'generator'), ('builder', 'generator'), ('formatter', 'generator'),
                 ('migrat', 'converter'), ('sync', 'converter')]:
        if k in t:
            return p
    return 'converter'

ACCEPT = {
 'converter': 'H1 fixture converts, structural match · H2 byte-stable rerun · H3 chunked == single-pass · E1 empty input → 422 · F1 wrong media → 422',
 'validator': 'H1 findings match on dirty fixture · H2 clean input passes · H3 findings order stable · E1 empty input → 422 · F1 wrong media → 422',
 'extractor': 'H1 records + source spans match · H2 heuristic rows carry confidence · H3 AI-off hint path (col_N) · E1 empty input → 422 · F1 unsupported media → 422',
 'generator': 'H1 default options byte-stable · H2 custom option reflected · H3 metadata stamps VERSION · E1 empty spec → 422 · F1 invalid option → 422',
 'fixer':     'H1 repair + change log match · H2 idempotent (fix∘fix = fix) · H3 ambiguity → finding, not silent fix · E1 empty input → 422 · F1 unrecoverable → 422',
}
MAXMB = {'FREE': 2, 'PRO': 25, 'MAX': 100}

def slugify(n):
    s = re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')
    return re.sub(r'-+', '-', s)

def fmt_faq(name, tier, ctx):
    free = {'FREE': 'Yes — {n} is free with a JONTRIX Free account, subject to daily quotas.',
            'PRO': '{n} unlocks with JONTRIX Pro (part of one subscription for the whole toolbox).',
            'MAX': '{n} unlocks with JONTRIX Max (part of one subscription for the whole toolbox).'}[tier].format(n=name)
    local = ('No — the file is processed in your browser and never uploaded.'
             if ctx == 'client' else
             'Only for this run: the file is processed in memory on our server and never stored.')
    return [['Is {} free?'.format(name), free],
            ['Does my file leave my device?', local],
            ['Can I use {} from an AI agent?'.format(name),
             'Yes — install jontrix-gateway and call it as an MCP tool; see "Connect your agent" in the app.']]

# ---------- roster ----------
by_id = {r['id']: r for r in rows}
first_ten = [by_id[s] for s in FIRST_TEN]
natural50 = rows[:50]
rest = [r for r in natural50 if r['id'] not in FIRST_TEN and r['id'] != SWAP_OUT]
roster = first_ten + rest                       # 10 + 40 = 50
assert len(roster) == 50, len(roster)
longtail = [r for r in rows if r['id'] not in FIRST_TEN and r not in rest]   # 197
assert len(longtail) == 197, len(longtail)

# ids, names, slugs
used_slugs = Counter()
entries = []
for i, r in enumerate(roster + longtail, 1):
    jid = f'J{i:03d}'
    name = NAME.get(r['id']) or kw_name(r)
    pattern = PATTERN.get(r['id']) or kw_pattern(r)
    slug = slugify(name)
    while used_slugs[slug]:
        used_slugs[slug] += 1
        slug = f"{slug}-{used_slugs[slug]}"
    used_slugs[slug] += 1
    ctx = 'server' if str(r['client_side']) in ('False', 'false') else 'client'
    if r['id'] in MANDATED:
        ctx = 'server'
    note = ('Phase-7 mandate: engine executes server-side by design (see card); source row marks the pain client-solvable.'
            if r['id'] in MANDATED else None)
    entries.append({'jont_id': jid, 'src_id': r['id'], 'rank': rank_of[r['id']], 'name': name, 'slug': slug,
                    'pattern': pattern, 'context': ctx, 'tier_fit': r['tier_fit'], 'role': r['platform_role'],
                    'score': r['score'], 'ev': r['ev_norm'], 'cluster': r['cluster'], 'title': r['title'],
                    'ai': r['id'] in AI_ROWS, 'context_note': note, 'seo_query': r.get('seo_query')})

# QA counts
print('roster:', len(roster), 'longtail:', len(longtail))
print('tier counts (roster):', Counter(e['tier_fit'] for e in entries[:50]))
print('tier counts (all 247):', Counter(e['tier_fit'] for e in entries))
ft = entries[:10]
print('first-ten pattern x context:', {(e['pattern'], e['context']) for e in ft})
cov = {p: {c for e in ft if e['pattern'] == p for c in [e['context']]} for p in ACCEPT}
print('coverage:', cov)
assert all({'client', 'server'} <= v for v in cov.values()), cov
print('slug collisions resolved; unique:', len(used_slugs))

# ---------- seed ----------
seed = []
for e in entries:
    seed.append({
        'jont_id': e['jont_id'], 'src_id': e['src_id'], 'slug': e['slug'], 'name': e['name'],
        'pattern': e['pattern'], 'context': e['context'], 'tier_fit': e['tier_fit'],
        'platform_role': e['role'], 'score': round(e['score'], 2), 'mcp_exposed': True,
        'context_note': e['context_note'], 'seo': {
            'slug': e['slug'], 'canonical': f"/jonts/{e['slug']}/",
            'description': e['title'][:155]},
        'faq': fmt_faq(e['name'], e['tier_fit'], e['context'])})
json.dump(seed, open(f'{BASE}/spec/catalog/jonts.seed.json', 'w'), indent=1, ensure_ascii=False)
print('seed written:', len(seed), 'rows')

# ---------- VOL-12 ----------
L = []
L.append('# Volume 12 — The Fifty: J001–J050 Build Cards\n')
L.append('**Document:** JONTRIX Build Specification — VOL-12 · **Version:** 1.0 (2026-09-03) · **Status:** LOCKED roster, cards refineable at build time only within the stated contracts')
L.append('**Sources:** generated from `research/opportunities.json` (frozen); acceptance templates from VOL-11 §6; registry seed = `spec/catalog/jonts.seed.json`.\n')
L.append('## §1 Roster Rules (LOCKED)\n')
L.append('**J001–J010 are curated, not raw rank order**, to satisfy VOL-00 Phase 3 (the first ten must exercise all five patterns and both execution contexts) and Phase 7 (the extension fixtures CORS Echo and cURL-to-Code must be among them). **J011–J050 are the remaining top-50 rows in strict descending score order.** Two documented deviations: (1) `DV-B5` (cURL to Code) sits at natural rank 87 but enters at J005 by Phase-7 mandate; (2) `EC-C15` (natural rank 50) swaps out to head the long tail (J051) so the roster stays exactly fifty. Every card prints its source row, rank, and frozen score — provenance is auditable against the seed file.\n')
L.append('## §2 First-Ten Coverage Matrix (Phase-3 exit contract)\n')
L.append('| # | Jont | Pattern | Context | Tier | Score | Why here |')
L.append('|---|------|---------|---------|------|-------|----------|')
WHY = {'DR-C3': 'converter·client cell; highest score (8.20), the Acrobat-outrage hook',
       'GT-PDF-extract-DR-C2': 'extractor·client cell; top GT row',
       'DR-F1': 'extractor·server cell; flagship LTV, AI-fallback exercised',
       'GT-CSV-excel-DR-A2': 'validator·client cell',
       'DV-B3': 'validator·server cell; Phase-7 mandate, CORS traffic wedge',
       'DR-A2': 'fixer·client cell; hook-class',
       'GT-JSON-fix-DV-B20': 'fixer·server cell',
       'EC-C9': 'generator·client cell; ecom anchor',
       'WG-G17': 'generator·server cell',
       'DV-B5': 'converter·server cell; Phase-7 mandate (natural rank 87)'}
for e, src in zip(ft, FIRST_TEN):
    L.append(f"| {e['jont_id']} | {e['name']} | {e['pattern']} | {e['context']} | {e['tier_fit']} | {e['score']:.2f} | {WHY[src]} |")
L.append('\nEvery pattern appears ≥2× and every context ≥5× across the ten; the five patterns × two contexts grid is fully covered.\n')
L.append('## §3 Build Order\n')
L.append('Phase 3 builds J001–J010 (per the matrix above). Phase 9 builds J011–J050 in the numbered order below (descending score), then VOL-13\'s long tail in family batches. A card is "done" only when the VOL-11 harness runs its acceptance rows green, the PWA page renders, tier gating works, and its SEO page is live — the VOL-14 §2 per-Jont DoD.\n')
L.append('## §4 The Cards\n')
for e in entries[:50]:
    tool = f"jont_{e['jont_id'].lower()}_{e['slug']}"
    mb = MAXMB[e['tier_fit']]
    ai = ('ai_fallback: {} (cache_ns `{}`, hint per VOL-11 §5)' if e['ai'] else 'ai_fallback: — (deterministic only)')
    step = 'header-column mapping' if e['src_id'] in ('DR-F1', 'DR-H1') else 'fuzzy step'
    L.append(f"\n### {e['jont_id']} · {e['name']}\n")
    L.append(f"`{e['pattern']} · {e['context']} · tier {e['tier_fit']} · role {e['role']} · score {e['score']:.2f} · evidence {e['ev']} (source rank {e['rank']})`\n")
    L.append(f"| Field | Contract |\n|---|---|")
    L.append(f"| Source row | `{e['src_id']}` — provenance in `research/opportunities.json` |")
    L.append(f"| H1 subtitle (verbatim, VOL-00 §0.5) | {e['title'][:180]} |")
    L.append(f"| Input → Output | per manifest `input.schema` (fixture set `tests/fixtures/jonts/{e['jont_id']}/`); max upload {mb} MB (tier cap, VOL-01 §4.2) |")
    L.append(f"| Engine | {e['context']}; pattern skeleton `jont-kit/src/patterns/{e['pattern']}.ts` + card algorithm |")
    L.append(f"| AI fallback | {ai.format(step, e['slug']+'-fb') if e['ai'] else '—'} |")
    L.append(f"| MCP | exposed → tool `{tool}` (schema = manifest `input.schema`) |")
    L.append(f"| Acceptance (VOL-11 §6) | {ACCEPT[e['pattern']]} |")
    L.append(f"| SEO | `/jonts/{e['slug']}/`" + (f" · query `{e['seo_query']}`" if e['seo_query'] else ' · query from card-time refinement') + ' |')
    if e['context_note']:
        L.append(f"| Context note | {e['context_note']} |")
open(f'{BASE}/spec/12-top-fifty.md', 'w').write('\n'.join(L) + '\n')
print('VOL-12 written:', len(L), 'lines')

# ---------- VOL-13 ----------
clusters = OrderedDict()
for e in entries[50:]:
    clusters.setdefault(e['cluster'], []).append(e)
order = sorted(clusters, key=lambda c: -sum(x['score'] for x in clusters[c]) / len(clusters[c]))
M = []
M.append('# Volume 13 — The Long Tail: J051–J247 (Family-Batch Catalog)\n')
M.append('**Document:** JONTRIX Build Specification — VOL-13 · **Version:** 1.0 (2026-09-03) · **Status:** LOCKED roster; working names refineable at card time without changing `src_id`, score, tier, or pattern')
M.append('**Sources:** generated from `research/opportunities.json` (frozen). This volume also defines `spec/catalog/jonts.seed.json`, the machine-readable registry VOL-04 §5 seeds.\n')
M.append('## §1 Generation Contract\n')
M.append('The long tail exists by the founder directive "even a tool used once a month is included" (VOL-01 §1). Roster = all 197 rows outside VOL-12, ordered by cluster (cluster average score, descending) then by row score. Names printed below are **working names** derived mechanically; at card time the build agent may polish a name without touching `src_id`, `score`, `tier_fit`, `pattern`, or `context` — the seed file carries the authoritative values and `db:verify` (VOL-04 §6) checks the counts. Card format = the VOL-11 manifest plus the same acceptance-template contract as VOL-12 §4; long-tail cards use the pattern template acceptance rows verbatim (no bespoke rows) unless the agent adds fixture-specific ones. MCP exposure defaults to `true` for every row; `context` obeys the frozen `client_side` flag (client engines run in-browser per C6).\n')
M.append('## §2 The Catalog (by family batch)\n')
batch_no = 0
for c in order:
    batch_no += 1
    es = clusters[c]
    avg = sum(x['score'] for x in es) / len(es)
    M.append(f"\n## Batch {batch_no} — {c} ({len(es)} Jonts · avg {avg:.2f})\n")
    M.append('| ID | Working name | Pattern | Ctx | Tier | Role | Score | Ev | Rank |')
    M.append('|----|--------------|---------|-----|------|------|-------|----|------|')
    for e in es:
        M.append(f"| {e['jont_id']} | {e['name']} | {e['pattern']} | {'C' if e['context']=='client' else 'S'} | {e['tier_fit']} | {e['role']} | {e['score']:.2f} | {e['ev']} | {e['rank']} |")
M.append('\n## §3 Batch Build Protocol (Phase 9)\n')
M.append('Batches build in the numbered order above (cluster average descending — the highest-expectation families ship first). A batch is done when: every Jont\'s manifest validates, its acceptance rows run green in the harness, its registry row flips `status: planned → live`, its SEO page renders, and the batch lands as one FRAZIYM feature release (VOL-00 §0.7: FF bump per batch). Client-side Jonts build fastest (no server budget concerns) and may ship several per release; server Jonts land subject to the VOL-01 §6 load budget. The batch loop is deliberately boring: manifest → engine → harness → page → flip → commit.\n')
M.append('## §4 The Seed File (`spec/catalog/jonts.seed.json`)\n')
M.append('Generated by the same run that produced this volume; 247 rows total (50 roster + 197 tail). Row contract: `jont_id, src_id, slug, name, pattern, context, tier_fit, platform_role, score, mcp_exposed (always true), context_note (only where the Phase-7 mandates apply: DV-B3, DV-B5), seo{slug, canonical, description}, faq (3 templated Q/A pairs — honest defaults; cards may refine). The seed is the single artifact VOL-04 §5 loads and VOL-04 §6 verifies; regenerating it (re-running the generator against a changed opportunities.json) requires a founder directive, because the scoring is frozen (VOL-02 §1).\n')
open(f'{BASE}/spec/13-long-tail.md', 'w').write('\n'.join(M) + '\n')
print('VOL-13 written:', len(M), 'lines; batches:', batch_no)
