# Volume 13 — The Long Tail: J051–J247 (Family-Batch Catalog)

**Document:** JONTRIX Build Specification — VOL-13 · **Version:** 1.0 (2026-09-03) · **Status:** LOCKED roster; working names refineable at card time without changing `src_id`, score, tier, or pattern
**Sources:** generated from `research/opportunities.json` (frozen). This volume also defines `spec/catalog/jonts.seed.json`, the machine-readable registry VOL-04 §5 seeds.

## §1 Generation Contract

The long tail exists by the founder directive "even a tool used once a month is included" (VOL-01 §1). Roster = all 197 rows outside VOL-12, ordered by cluster (cluster average score, descending) then by row score. Names printed below are **working names** derived mechanically; at card time the build agent may polish a name without touching `src_id`, `score`, `tier_fit`, `pattern`, or `context` — the seed file carries the authoritative values and `db:verify` (VOL-04 §6) checks the counts. Card format = the VOL-11 manifest plus the same acceptance-template contract as VOL-12 §4; long-tail cards use the pattern template acceptance rows verbatim (no bespoke rows) unless the agent adds fixture-specific ones. MCP exposure defaults to `true` for every row; `context` obeys the frozen `client_side` flag (client engines run in-browser per C6).

## §2 The Catalog (by family batch)


## Batch 1 — Data & File Repair (33 Jonts · avg 6.43)

| ID | Working name | Pattern | Ctx | Tier | Role | Score | Ev | Rank |
|----|--------------|---------|-----|------|------|-------|----|------|
| J052 | XLSX to CSV | converter | C | FREE | HOOK | 7.00 | E3 | 51 |
| J059 | PDF Compressor | converter | C | FREE | HOOK | 6.90 | E3 | 58 |
| J067 | Youtube Auto | generator | C | FREE | GLUE | 6.80 | E1 | 66 |
| J068 | CSV Merger | converter | C | FREE | HOOK | 6.80 | E3 | 67 |
| J069 | Subtitle Sync Offset Fixer | fixer | C | FREE | GLUE | 6.78 | E1 | 68 |
| J071 | PDF Merge | converter | C | FREE | HOOK | 6.75 | E3 | 70 |
| J072 | PDF Form Flattener | converter | C | PRO | PRO | 6.75 | E3 | 71 |
| J075 | CSV Encoding Repair | converter | C | FREE | HOOK | 6.73 | E1 | 74 |
| J077 | CSV Cleaner | fixer | C | PRO | PRO | 6.70 | E3 | 76 |
| J078 | SRT Offset | converter | C | FREE | GLUE | 6.70 | E3 | 77 |
| J080 | PDF Split | extractor | C | FREE | HOOK | 6.65 | E3 | 79 |
| J081 | WooCommerce Image URL Fixer | converter | C | PRO | PRO | 6.62 | E1 | 80 |
| J084 | Receipt Data Pull | extractor | S | MAX | LTV | 6.60 | E2 | 83 |
| J090 | CSV to SQL INSERT Generator | generator | C | FREE | GLUE | 6.55 | E3 | 90 |
| J091 | SRT to VTT Converter | converter | C | FREE | GLUE | 6.55 | E3 | 91 |
| J095 | OFX/QBO → CSV Converter | converter | C | PRO | LTV | 6.50 | E3 | 95 |
| J103 | CSV Column Remover | converter | C | FREE | GLUE | 6.40 | E3 | 103 |
| J104 | PDF Owner-Password Remover | converter | C | FREE | PRO | 6.40 | E3 | 104 |
| J106 | Subtitle QC Checker | validator | C | PRO | PRO | 6.38 | E1 | 106 |
| J111 | PDF Page Organizer | converter | C | FREE | HOOK | 6.35 | E3 | 111 |
| J120 | CSV to QBO | extractor | C | PRO | LTV | 6.30 | E3 | 120 |
| J123 | Ragged CSV Repair | converter | C | FREE | HOOK | 6.28 | E1 | 123 |
| J128 | Subtitle Encoding Fixer | fixer | C | FREE | GLUE | 6.25 | E3 | 128 |
| J129 | Receipt | extractor | S | PRO | LTV | 6.25 | E3 | 129 |
| J133 | Subtitle Encoding Fixer | converter | C | FREE | GLUE | 6.20 | E1 | 133 |
| J135 | Images to PDF | converter | C | FREE | HOOK | 6.20 | E3 | 135 |
| J136 | Subtitle CPS | validator | C | PRO | PRO | 6.20 | E3 | 136 |
| J151 | VTT to SRT Converter | converter | C | FREE | GLUE | 6.10 | E3 | 151 |
| J164 | Multi-Bank Statement Merger & Deduper | fixer | C | PRO | LTV | 6.05 | E3 | 164 |
| J169 | Duplicate Subtitle Remover | converter | C | FREE | GLUE | 6.00 | E3 | 169 |
| J174 | PDF Metadata Scrubber | converter | C | FREE | GLUE | 5.95 | E3 | 174 |
| J187 | TSV / PSV | converter | C | FREE | GLUE | 5.80 | E3 | 187 |
| J192 | MT940/SWIFT → CSV Converter | converter | C | PRO | LTV | 5.75 | E3 | 192 |

## Batch 2 — E-commerce & SMB Ops (42 Jonts · avg 6.23)

| ID | Working name | Pattern | Ctx | Tier | Role | Score | Ev | Rank |
|----|--------------|---------|-----|------|------|-------|----|------|
| J051 | Merchant Center Fixer | validator | C | PRO | LTV | 7.03 | E1 | 50 |
| J053 | Amazon Flat File Pre-flight | converter | S | PRO | LTV | 7.00 | E3 | 52 |
| J054 | Amazon 8541 Match Fixer | converter | C | FREE | GLUE | 6.98 | E1 | 53 |
| J061 | Shopify Metafield Importer | converter | C | PRO | PRO | 6.88 | E1 | 60 |
| J062 | Bulk Product | converter | C | FREE | GLUE | 6.88 | E1 | 61 |
| J070 | Settlement Reconciler | converter | C | PRO | LTV | 6.78 | E1 | 69 |
| J079 | Woocommerce Import Monopoly Pricing | extractor | C | PRO | PRO | 6.65 | E1 | 78 |
| J082 | Product | converter | C | PRO | LTV | 6.62 | E1 | 81 |
| J085 | Shopify Variant Sorter | converter | C | PRO | PRO | 6.60 | E1 | 84 |
| J087 | Etsy CSV Importer | extractor | C | PRO | PRO | 6.58 | E1 | 86 |
| J088 | Polite Invoice Reminder Generator | converter | C | FREE | GLUE | 6.55 | E1 | 88 |
| J099 | Receipt OCR (Free Tier) | extractor | S | PRO | LTV | 6.48 | E1 | 99 |
| J100 | Meta Catalog Feed Fixer | validator | C | FREE | GLUE | 6.45 | E1 | 100 |
| J107 | Shopify Image Import Fixer | extractor | C | FREE | GLUE | 6.38 | E1 | 107 |
| J108 | Monthly Bookkeeping Grind For Micro | converter | C | PRO | PRO | 6.38 | E1 | 108 |
| J115 | Etsy→Shopify Migration | converter | C | FREE | GLUE | 6.30 | E1 | 115 |
| J116 | eBay Bulk CSV Formatter | generator | C | FREE | GLUE | 6.30 | E1 | 116 |
| J117 | Listing Localizer | converter | C | FREE | GLUE | 6.30 | E1 | 117 |
| J118 | Quote & Estimate Generator | converter | C | PRO | LTV | 6.30 | E1 | 118 |
| J121 | Supplier Price-List to Shopify Mapper | converter | S | PRO | LTV | 6.30 | E3 | 121 |
| J122 | Per-SKU Profit Margin Calculator | converter | C | FREE | GLUE | 6.30 | E3 | 122 |
| J124 | Spreadsheet | converter | S | PRO | PRO | 6.28 | E1 | 124 |
| J130 | Google Merchant Feed Fixer | fixer | S | PRO | LTV | 6.25 | E3 | 130 |
| J144 | TikTok Shop Template Filler | generator | C | FREE | GLUE | 6.18 | E1 | 144 |
| J145 | Quickbooks Online Hatred + Pricing Churn | converter | S | FREE | GLUE | 6.17 | E1 | 145 |
| J147 | Etsy to Shopify Migration Fixer | fixer | C | PRO | PRO | 6.15 | E3 | 147 |
| J148 | Marketplace Image Requirements Resizer | converter | C | FREE | GLUE | 6.15 | E3 | 148 |
| J149 | Inventory Two-File Diff Checker | validator | C | PRO | PRO | 6.15 | E3 | 149 |
| J152 | Barcode | generator | C | FREE | PRO | 6.10 | E3 | 152 |
| J160 | Walmart Feed Validator | converter | C | FREE | GLUE | 6.05 | E1 | 160 |
| J165 | VAT/Mushak 6.3 Invoice Generator | generator | C | PRO | LTV | 6.05 | E3 | 165 |
| J178 | TikTok Shop Upload Fixer | fixer | C | PRO | PRO | 5.90 | E3 | 178 |
| J183 | Taka Amount-in-Words | converter | C | FREE | GLUE | 5.85 | E3 | 183 |
| J188 | eBay CSV Template Validator | validator | C | PRO | PRO | 5.80 | E3 | 188 |
| J189 | Order Deduper across Channels | fixer | C | PRO | PRO | 5.80 | E3 | 189 |
| J190 | bKash/Nagad Fee Calculator | converter | C | FREE | HOOK | 5.80 | E3 | 190 |
| J196 | English to Bangla Date Converter | converter | C | FREE | GLUE | 5.70 | E3 | 196 |
| J202 | Meta Catalog Validator | validator | C | PRO | PRO | 5.65 | E3 | 202 |
| J206 | Walmart Feed Validator | validator | C | PRO | PRO | 5.60 | E3 | 206 |
| J218 | SKU Code Generator | generator | C | FREE | GLUE | 5.35 | E3 | 218 |
| J225 | Product Listing Translator | converter | S | PRO | PRO | 5.25 | E3 | 225 |
| J226 | Payment Screenshot to Ledger Entry | converter | S | PRO | LTV | 5.25 | E3 | 226 |

## Batch 3 — Telegram / BD (4 Jonts · avg 6.09)

| ID | Working name | Pattern | Ctx | Tier | Role | Score | Ev | Rank |
|----|--------------|---------|-----|------|------|-------|----|------|
| J060 | Telegram Mini App Shell | validator | S | MAX | LTV | 6.90 | E3 | 59 |
| J143 | Telegram Bot: File-to-Tool Bridge | converter | S | PRO | LTV | 6.20 | E3 | 143 |
| J181 | Telegram Post Formatter | generator | C | FREE | GLUE | 5.90 | E3 | 181 |
| J222 | Telegram Group Export Analyzer | converter | S | MAX | PRO | 5.35 | E3 | 222 |

## Batch 4 — Developer Tools (47 Jonts · avg 6.06)

| ID | Working name | Pattern | Ctx | Tier | Role | Score | Ev | Rank |
|----|--------------|---------|-----|------|------|-------|----|------|
| J055 | JSON ↔ JSONL Converter | converter | C | FREE | GLUE | 6.98 | E1 | 54 |
| J056 | JSON Formatter & Validator | validator | C | FREE | HOOK | 6.95 | E3 | 55 |
| J057 | Webhook Test URL & Inspector | converter | C | PRO | PRO | 6.92 | E1 | 56 |
| J064 | JSON Diff Checker | validator | C | FREE | HOOK | 6.85 | E3 | 109 |
| J065 | JSON to TypeScript / Go | converter | C | FREE | HOOK | 6.85 | E3 | 64 |
| J089 | JSON Escape | converter | C | FREE | GLUE | 6.55 | E3 | 89 |
| J092 | SQL Formatter | generator | C | FREE | HOOK | 6.55 | E3 | 92 |
| J093 | Unix Timestamp Converter | converter | C | FREE | GLUE | 6.53 | E2 | 93 |
| J094 | Cryptic Api Error Responses Cost Hours | converter | S | FREE | HOOK | 6.50 | E1 | 94 |
| J096 | Epoch / ISO | converter | C | FREE | GLUE | 6.50 | E3 | 96 |
| J097 | YAML to JSON to TOML Converter | converter | C | FREE | HOOK | 6.50 | E3 | 97 |
| J102 | JSONPath | converter | C | FREE | GLUE | 6.40 | E3 | 102 |
| J109 | JSON Minify | converter | C | FREE | HOOK | 6.35 | E3 | 109 |
| J110 | JSON Schema Instance Validator | validator | C | FREE | GLUE | 6.35 | E3 | 110 |
| J114 | Schema→Sample-Data | validator | C | FREE | GLUE | 6.33 | E2 | 114 |
| J126 | API Replay Tester | converter | C | FREE | GLUE | 6.25 | E2 | 126 |
| J131 | Schema Diff | converter | C | PRO | PRO | 6.25 | E3 | 131 |
| J134 | MCP Dev Toolbox | converter | C | FREE | GLUE | 6.20 | E1 | 134 |
| J137 | Ephemeral Request Bin | converter | S | MAX | PRO | 6.20 | E3 | 137 |
| J138 | HTTP Status Code Explainer | converter | C | FREE | HOOK | 6.20 | E3 | 138 |
| J139 | Static JSON Mock API Server | generator | S | MAX | PRO | 6.20 | E3 | 139 |
| J140 | Cron Explainer | converter | C | FREE | HOOK | 6.20 | E3 | 140 |
| J150 | YAML ↔ JSON ↔ TOML Converter | converter | C | FREE | GLUE | 6.12 | E3 | 150 |
| J153 | Webhook Replay Tool | converter | S | MAX | PRO | 6.10 | E3 | 153 |
| J154 | PostgreSQL to MySQL Converter | converter | C | PRO | LTV | 6.10 | E3 | 154 |
| J155 | Timezone-aware Cron Preview | converter | C | FREE | GLUE | 6.10 | E3 | 155 |
| J156 | Docker Compose Validator | validator | C | FREE | GLUE | 6.10 | E3 | 156 |
| J161 | Cron Syntax Is Not Human | generator | C | FREE | GLUE | 6.05 | E2 | 161 |
| J167 | JSON Escape/Unescape | converter | C | FREE | GLUE | 6.03 | E3 | 167 |
| J170 | HTTP Header Parser | extractor | C | FREE | GLUE | 6.00 | E3 | 170 |
| J172 | Regex Explainer & Builder | converter | C | FREE | GLUE | 5.98 | E1 | 172 |
| J175 | Webhook Signature Tester | converter | C | FREE | GLUE | 5.95 | E3 | 175 |
| J177 | NDJSON | converter | C | FREE | GLUE | 5.90 | E3 | 177 |
| J179 | .env to JSON | converter | C | FREE | GLUE | 5.90 | E3 | 179 |
| J182 | Env→Json | converter | C | FREE | GLUE | 5.85 | E3 | 182 |
| J193 | MCP Server Config Validator | validator | S | PRO | LTV | 5.75 | E3 | 193 |
| J197 | Nginx/Apache Config Tester | generator | C | PRO | PRO | 5.70 | E3 | 197 |
| J203 | SQL Query Explainer | converter | S | PRO | PRO | 5.65 | E3 | 203 |
| J207 | User-Agent String Parser | extractor | C | FREE | GLUE | 5.60 | E3 | 207 |
| J208 | SQL to ORM Model | converter | C | PRO | PRO | 5.55 | E3 | 208 |
| J223 | .gitignore Generator | generator | C | FREE | HOOK | 5.30 | E3 | 223 |
| J224 | JWT Decoder & Verifier | validator | S | FREE | GLUE | 5.25 | E2 | 224 |
| J232 | Webhook Capture Bin | converter | S | MAX | GLUE | 5.17 | E2 | 232 |
| J236 | Changelog Generator from git log | generator | S | FREE | GLUE | 5.15 | E3 | 236 |
| J238 | Rate-Limit Retry Planner | converter | C | FREE | GLUE | 5.10 | E3 | 238 |
| J244 | OSS License | generator | C | FREE | HOOK | 4.85 | E3 | 244 |
| J246 | Natural Language to Cron | converter | S | FREE | GLUE | 4.80 | E3 | 246 |

## Batch 5 — Media & Image (7 Jonts · avg 5.87)

| ID | Working name | Pattern | Ctx | Tier | Role | Score | Ev | Rank |
|----|--------------|---------|-----|------|------|-------|----|------|
| J073 | Image Compressor | converter | C | FREE | HOOK | 6.75 | E3 | 72 |
| J141 | Batch Image Resizer | converter | C | FREE | HOOK | 6.20 | E3 | 141 |
| J142 | Batch Watermark Adder | converter | C | FREE | PRO | 6.20 | E3 | 142 |
| J166 | Image Format Converter | converter | C | FREE | HOOK | 6.05 | E3 | 166 |
| J209 | Favicon Generator | generator | C | FREE | HOOK | 5.50 | E3 | 209 |
| J214 | Color Palette Extractor from Image | extractor | C | FREE | GLUE | 5.40 | E3 | 214 |
| J240 | Placeholder Image Generator | generator | C | FREE | GLUE | 5.00 | E3 | 240 |

## Batch 6 — Weird Gold / Education (43 Jonts · avg 5.78)

| ID | Working name | Pattern | Ctx | Tier | Role | Score | Ev | Rank |
|----|--------------|---------|-----|------|------|-------|----|------|
| J058 | Spreadsheets | generator | S | PRO | PRO | 6.90 | E1 | 57 |
| J063 | Gig Driver Expense Tracker | converter | S | FREE | GLUE | 6.85 | E1 | 62 |
| J066 | Podcast Show Notes | converter | S | FREE | GLUE | 6.83 | E1 | 65 |
| J074 | MCQ Practice Web App + Telegram Bot | converter | S | PRO | LTV | 6.75 | E3 | 73 |
| J076 | Landlord Rent Ledgers | converter | S | MAX | LTV | 6.73 | E1 | 75 |
| J083 | Wedding Guest List Planner | converter | S | FREE | HOOK | 6.62 | E1 | 82 |
| J112 | Flashcard Converter | converter | C | FREE | PRO | 6.35 | E3 | 112 |
| J113 | Citation Formatter | generator | S | FREE | HOOK | 6.35 | E3 | 113 |
| J119 | Flashcard Data Portability | converter | S | FREE | HOOK | 6.30 | E2 | 119 |
| J125 | Worksheet / Rubric Generation For Teachers | generator | S | FREE | HOOK | 6.28 | E2 | 125 |
| J127 | Church Announcement Slides | converter | S | FREE | GLUE | 6.25 | E1 | 127 |
| J146 | Ai Code | converter | S | PRO | GLUE | 6.15 | E1 | 146 |
| J162 | Bangla Typing / Unicode On The Web | converter | C | FREE | GLUE | 6.05 | E2 | 162 |
| J163 | Free Review Widgets For Small | converter | S | FREE | GLUE | 6.05 | E2 | 163 |
| J168 | Chatgpt Conversation Export / Backup Mess | converter | S | FREE | GLUE | 6.03 | E1 | 168 |
| J171 | AI Code Review Linter | validator | S | PRO | PRO | 6.00 | E3 | 171 |
| J173 | Seating Charts / Random Group Makers | converter | S | FREE | HOOK | 5.95 | E1 | 173 |
| J184 | ChatGPT Export Cleaner | fixer | C | FREE | GLUE | 5.85 | E3 | 184 |
| J185 | Vibe-coder Code Error Fixer | fixer | S | PRO | PRO | 5.85 | E3 | 185 |
| J186 | Citation Formatting Pain (Students) | converter | S | FREE | GLUE | 5.83 | E1 | 186 |
| J191 | Bijoy to Unicode Converter | converter | C | FREE | GLUE | 5.80 | E3 | 191 |
| J194 | Spaced-Repetition Flashcard Mini App | converter | S | PRO | PRO | 5.75 | E3 | 194 |
| J195 | Prayer-time | generator | C | FREE | GLUE | 5.75 | E3 | 195 |
| J201 | Quiz Generator from Notes | generator | S | PRO | PRO | 5.70 | E3 | 201 |
| J205 | GPA/CGPA Calculator (BD) | converter | C | FREE | GLUE | 5.65 | E3 | 205 |
| J210 | Assignment Deadline | converter | C | FREE | GLUE | 5.50 | E3 | 210 |
| J211 | AI-slop Text Linter | validator | S | FREE | GLUE | 5.50 | E3 | 211 |
| J212 | Seating Chart | converter | C | FREE | GLUE | 5.45 | E3 | 212 |
| J213 | Event Announcement Slide Generator | generator | S | FREE | GLUE | 5.45 | E3 | 213 |
| J215 | League Fixture Scheduler | fixer | C | FREE | GLUE | 5.40 | E3 | 215 |
| J216 | Wedding Planner Mini-Suite | converter | S | FREE | PRO | 5.40 | E3 | 216 |
| J217 | Embeddable Review Widget | converter | S | MAX | PRO | 5.40 | E3 | 217 |
| J220 | Question Bank Shuffler | converter | C | FREE | GLUE | 5.35 | E3 | 220 |
| J221 | Gig-Driver Earnings Tracker | converter | S | FREE | PRO | 5.35 | E3 | 221 |
| J229 | Sports League Scheduling For Volunteers | converter | S | FREE | GLUE | 5.22 | E2 | 229 |
| J231 | Podcast Show Notes Generator | generator | S | PRO | PRO | 5.20 | E3 | 231 |
| J233 | Bijoy↔Unicode Bangla Text Conversion | converter | S | FREE | GLUE | 5.15 | E3 | 233 |
| J234 | Bd Gig | converter | S | FREE | GLUE | 5.15 | E3 | 234 |
| J235 | AI Code Fixer for Non-Devs | fixer | S | FREE | GLUE | 5.15 | E3 | 235 |
| J239 | Mosque/Islamic | generator | S | FREE | GLUE | 5.08 | E3 | 239 |
| J242 | Print-perfect Worksheet Generator | generator | S | PRO | PRO | 4.95 | E3 | 242 |
| J243 | Pta / School | validator | S | PRO | GLUE | 4.88 | E3 | 243 |
| J247 | PTA Dues & Attendance Tracker | converter | S | FREE | PRO | 4.55 | E3 | 247 |

## Batch 7 — Web & Text Utilities (21 Jonts · avg 5.77)

| ID | Working name | Pattern | Ctx | Tier | Role | Score | Ev | Rank |
|----|--------------|---------|-----|------|------|-------|----|------|
| J086 | QR Code Generator | generator | C | FREE | HOOK | 6.60 | E3 | 85 |
| J098 | Base64 Encoder | converter | C | FREE | HOOK | 6.50 | E3 | 98 |
| J101 | Word & Character Counter | converter | C | FREE | HOOK | 6.45 | E3 | 101 |
| J105 | Text Diff Checker | validator | C | FREE | HOOK | 6.40 | E3 | 105 |
| J132 | Regex Tester + Multi-language Export | converter | C | FREE | GLUE | 6.25 | E3 | 132 |
| J157 | Markdown to HTML | converter | C | FREE | HOOK | 6.10 | E3 | 157 |
| J158 | Password Generator | generator | C | FREE | HOOK | 6.10 | E3 | 158 |
| J159 | EXIF Scrubber | converter | C | FREE | PRO | 6.10 | E3 | 159 |
| J176 | URL Encoder | converter | C | FREE | HOOK | 5.95 | E3 | 176 |
| J180 | Hash Generator | generator | C | FREE | HOOK | 5.90 | E3 | 180 |
| J198 | Case Converter | converter | C | FREE | HOOK | 5.70 | E3 | 198 |
| J199 | Batch Find & Replace | converter | C | FREE | GLUE | 5.70 | E3 | 199 |
| J200 | HMAC Signature Generator | generator | C | FREE | GLUE | 5.70 | E3 | 200 |
| J204 | JWT Decoder | converter | C | FREE | GLUE | 5.65 | E3 | 204 |
| J219 | Line Sorter | fixer | C | FREE | GLUE | 5.35 | E3 | 219 |
| J227 | HTML Entity Encoder | converter | C | FREE | GLUE | 5.25 | E3 | 227 |
| J228 | UUID v4 | generator | C | FREE | HOOK | 5.25 | E3 | 228 |
| J230 | Unicode-aware Slug Generator | generator | C | FREE | GLUE | 5.20 | E3 | 230 |
| J237 | Whitespace | fixer | C | FREE | GLUE | 5.15 | E3 | 237 |
| J241 | Reading Time | validator | C | FREE | GLUE | 4.95 | E3 | 241 |
| J245 | Lorem Placeholder Generator | generator | C | FREE | HOOK | 4.85 | E3 | 245 |

## §3 Batch Build Protocol (Phase 9)

Batches build in the numbered order above (cluster average descending — the highest-expectation families ship first). A batch is done when: every Jont's manifest validates, its acceptance rows run green in the harness, its registry row flips `status: planned → live`, its SEO page renders, and the batch lands as one FRAZIYM feature release (VOL-00 §0.7: FF bump per batch). Client-side Jonts build fastest (no server budget concerns) and may ship several per release; server Jonts land subject to the VOL-01 §6 load budget. The batch loop is deliberately boring: manifest → engine → harness → page → flip → commit.

## §4 The Seed File (`spec/catalog/jonts.seed.json`)

Generated by the same run that produced this volume; 247 rows total (50 roster + 197 tail). Row contract: `jont_id, src_id, slug, name, pattern, context, tier_fit, platform_role, score, mcp_exposed (always true), context_note (only where the Phase-7 mandates apply: DV-B3, DV-B5), seo{slug, canonical, description}, faq (3 templated Q/A pairs — honest defaults; cards may refine). The seed is the single artifact VOL-04 §5 loads and VOL-04 §6 verifies; regenerating it (re-running the generator against a changed opportunities.json) requires a founder directive, because the scoring is frozen (VOL-02 §1).

