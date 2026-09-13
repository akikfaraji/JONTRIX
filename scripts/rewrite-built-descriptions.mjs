// Rewrites the `seo.description` of the 60 BUILT jonts in
// spec/catalog/jonts.seed.json with plain, concrete one-liners.
// Planned tools are left untouched (batch 2, when their engines land).
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = 'spec/catalog/jonts.seed.json';
const data = JSON.parse(readFileSync(PATH, 'utf8'));

const COPY = {
  J007: "Fixes broken JSON — trailing commas, single quotes, unquoted keys, smart quotes — and lists every change it made so you can trust the output.",
  J048: "Rewrites AI-assisted drafts into plain prose: strips filler phrases, em-dash spam, and the stock patterns that make text read as generated.",
  J130: "Validates and repairs Google Merchant Center product feeds before upload — missing required attributes, wrong formats, invalid prices.",
  J005: "Echoes your request back with the exact headers it received, plus the CORS headers a browser would need — so you can see which side is misconfigured.",
  J020: "Reads EXIF, XMP and C2PA metadata from a file and reports what it says about how the file was created or edited.",
  J029: "Checks a Shopify product CSV against the import spec and reports every row that would fail — before you upload it.",
  J193: "Validates an MCP server configuration file — schema errors, missing fields, bad commands — before your agent fails to start.",
  J211: "Scans text for the stock phrases and structural tics common in generated writing and flags each hit with its location.",
  J224: "Decodes a JWT's header and payload, checks structure and expiry, and verifies the signature when you supply the secret or public key.",
  J014: "Checks citations in a text for formatting problems and missing pieces — authors, years, URLs — against common styles.",
  J060: "Generates a ready-to-deploy Telegram Mini App starter with init-data validation wired for your bot token.",
  J113: "Turns raw references into consistent citations — pick a style, paste the sources, get clean APA, MLA or Chicago output.",
  J125: "Builds worksheets and grading rubrics from a topic and grade level — editable text you can print or paste into your docs.",
  J236: "Turns git log output into a grouped changelog by version or date, with breaking changes and fixes sorted out.",
  J201: "Turns study notes into multiple-choice or short-answer quizzes with answer keys — several question types from one paste.",
  J058: "Generates starter spreadsheets from templates — inventory, invoice lines, budgets, attendance — ready to download as CSV.",
  J139: "Turns a JSON file into a mock REST API spec with deterministic routes, so frontend work can start before the backend exists.",
  J009: "Organizes questions into a tagged, filterable bank with difficulty and topic fields, exported in a format exam tools accept.",
  J045: "Converts notes and tables into flashcard decks — Anki- and Quizlet-compatible CSV with front, back and tags columns sorted out.",
  J083: "Tracks guests, RSVPs, dietary needs and plus-ones in one table, with live counts and seat-list exports.",
  J119: "Converts flashcard exports between Anki, Quizlet and CSV formats, keeping front, back and tag fields aligned.",
  J168: "Parses a ChatGPT conversations.json backup into readable per-conversation text and markdown files, indexed by date and title.",
  J173: "Makes classroom seating charts or random groups from a student list, with avoid-pair constraints and group sizes.",
  J203: "Explains a SQL query clause by clause in plain language, and flags pitfalls like SELECT *, implicit joins, and DELETE without WHERE.",
  J246: "Converts schedule phrases like 'every monday at 9am' into cron expressions, echoing back what it understood in plain language.",
  J010: "Converts a curl command into ready-to-run code for Python, JavaScript (fetch/axios) or PHP — headers and auth included.",
  J094: "Paste a raw HTTP error — status, headers, body — and get a plain-language reading of what failed, common causes, and what to check first.",
  J222: "Analyzes a Telegram group export: activity by member and hour, top links, and message volume over time.",
  J229: "Generates round-robin schedules for any number of teams, courts and byes — fair rest time, printable tables.",
  J053: "Validates Amazon flat files against category templates before upload — required fields, value formats, and the errors Seller Central reports too late.",
  J063: "Turns rideshare and delivery trip logs into a categorized expense ledger with per-mile deductions, exportable for tax filing.",
  J076: "Builds rent ledgers per unit and tenant — payments, late fees, balances — with month-by-month statements.",
  J124: "Reshapes table data — transpose, sort, dedupe, split or merge columns — a dozen operations on pasted CSV, no formulas needed.",
  J153: "Captures a webhook payload and replays it against a new endpoint with the original headers, so you can debug handlers without waiting on the provider.",

  J046: "Converts CSV to JSON in your browser, with type inference for numbers and booleans and an option to nest dotted headers.",
  J027: "Flattens nested JSON arrays into flat CSV rows, choosing which fields become columns.",
  J055: "Converts between pretty JSON and JSON Lines (one object per line) — the format log pipelines and stream tools expect.",
  J049: "Converts deeply nested JSON to CSV and back, expanding and collapsing paths with dot notation.",
  J065: "Generates TypeScript interfaces or Go structs from a JSON sample, with nullable and array fields handled.",
  J026: "Converts SQL between dialects — MySQL, PostgreSQL, SQLite, T-SQL — and flags constructs with no direct equivalent.",
  J015: "Splits a large CSV into smaller files by row count, keeping the header row on every part.",
  J068: "Merges multiple CSVs into one, aligning columns by header name instead of position.",
  J012: "Opens JSON files too big for a text editor, previews the structure, and splits them into chunks on demand.",
  J017: "Filters huge JSON files with JSONPath-style queries without loading the whole file into memory.",
  J042: "Converts CSV files between encodings (UTF-8, Latin-1, Windows-1252) and fixes the mojibake Excel exports leave behind.",
  J056: "Formats and validates JSON with exact error positions — line and column, not just 'unexpected token'.",
  J064: "Compares two JSON documents and shows added, removed and changed paths side by side.",
  J004: "Stops Excel from eating leading zeros and reformatting dates — generates import-safe CSVs where IDs like 00123 survive.",
  J037: "Finds duplicate rows in a CSV by the columns you choose, with exact and fuzzy matching, and shows every duplicate group.",
  J021: "Validates Shopify product and import CSVs in the browser — required columns, variant structure, image URL formats.",
  J025: "Scans a file for common hazards before you open or share it — macros, embedded scripts, mismatched extensions.",
  J028: "Checks any CSV against a ruleset you define — column names, types, ranges, required fields — before it reaches your importer.",
  J019: "Parses order details from WhatsApp chats — items, quantities, addresses — into a clean orders table.",
  J034: "Detects and repairs wrong delimiters — comma vs semicolon vs tab — and re-quotes fields where needed.",
  J077: "Cleans messy CSVs: trims whitespace, normalizes headers, drops empty rows and columns.",
  J069: "Shifts SRT/ASS subtitle timings by a constant offset or scales them, re-syncing subs to your video.",
  J006: "Fixes CSVs where columns collapsed into one or split wrongly — re-splits by the actual delimiter and re-aligns rows.",
  J032: "Pre-checks a CSV against Excel's import quirks — date mangling, scientific notation, encoding — and fixes what would break.",
  J035: "Repairs JSON from LLM outputs — markdown fences, trailing commas, comments, truncated lines — into parseable form.",
  J171: "Reviews code for real defects — unsafe patterns, dead branches, inconsistent error handling — and comments each finding with a suggested fix.",
};

let hit = 0;
const missing = [];
for (const [id, desc] of Object.entries(COPY)) {
  const row = data.find((r) => r.jont_id === id);
  if (!row) { missing.push(id); continue; }
  row.seo.description = desc;
  hit++;
}
writeFileSync(PATH, JSON.stringify(data, null, 1) + '\n');
console.log(`updated descriptions: ${hit}/${Object.keys(COPY).length}`);
if (missing.length) console.log('MISSING ROWS:', missing.join(', '));
