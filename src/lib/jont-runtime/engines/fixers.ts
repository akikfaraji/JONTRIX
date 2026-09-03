// Fixer-pattern engines — VOL-11 §3: data → data + change log; every
// mutation logged. Deterministic cores only (C5).

import type { JontEngine, JontResult } from '../types';
import { parseCsv, toCsv } from '../util';

// ─── jont_j007_json-repair ─────────────────────────────────────────────────
// LLM-pasted JSON with markdown fences, trailing commas, comments, unquoted
// keys, single quotes. Deterministic repair pipeline, every fix reported.

export const jsonRepair: JontEngine = {
  manifest: {
    id: 'jont_j007_json-repair',
    pattern: 'fixer',
    context: 'server',
    io: {
      input: { type: 'object', required: ['text'], properties: { text: { type: 'string', description: 'possibly-broken JSON text' } } },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p35', score: 7.15 },
  },
  run(input): JontResult {
    const started = Buffer.from(String(input.text ?? ''), 'utf8').length;
    let text = String(input.text ?? '');
    const change_log: Array<{ at: string; from?: string; to?: string; note?: string }> = [];

    // 1. markdown fences
    const fenced = /^```[a-zA-Z]*\n([\s\S]*?)\n?```$/m.exec(text.trim());
    if (fenced) {
      text = fenced[1];
      change_log.push({ at: 'fence', note: 'stripped markdown code fence' });
    }
    // 2. // and /* */ comments outside strings
    let out = '';
    let inStr = false;
    let esc = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inStr) {
        out += ch;
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') {
        inStr = true;
        out += ch;
      } else if (ch === '/' && text[i + 1] === '/') {
        while (i < text.length && text[i] !== '\n') i++;
        change_log.push({ at: `offset:${i}`, note: 'removed line comment' });
      } else if (ch === '/' && text[i + 1] === '*') {
        i += 2;
        while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
        i++;
        change_log.push({ at: `offset:${i}`, note: 'removed block comment' });
      } else {
        out += ch;
      }
    }
    text = out;
    // 3. trailing commas
    const beforeTrailing = text;
    text = text.replace(/,(\s*[}\]])/g, '$1');
    if (text !== beforeTrailing) change_log.push({ at: 'commas', note: 'removed trailing comma(s)' });
    // 4. smart quotes
    const beforeQuotes = text;
    text = text.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");
    if (text !== beforeQuotes) change_log.push({ at: 'quotes', note: 'normalized smart quotes' });
    // 5. NaN / Infinity / undefined
    const beforeNan = text;
    text = text.replace(/\bNaN\b/g, 'null').replace(/\b-?Infinity\b/g, 'null').replace(/\bundefined\b/g, 'null');
    if (text !== beforeNan) change_log.push({ at: 'literals', note: 'replaced non-JSON literals with null' });
    // 6. single-quoted strings → double-quoted
    const beforeSingle = text;
    let fixed = '';
    inStr = false;
    let inSingle = false;
    esc = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inStr) {
        fixed += ch;
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
      } else if (inSingle) {
        if (esc) { esc = false; fixed += ch; }
        else if (ch === '\\') { esc = true; fixed += ch; }
        else if (ch === "'") { inSingle = false; fixed += '"'; }
        else fixed += ch;
      } else if (ch === '"') {
        inStr = true;
        fixed += ch;
      } else if (ch === "'") {
        inSingle = true;
        fixed += '"';
      } else {
        fixed += ch;
      }
    }
    text = fixed;
    if (text !== beforeSingle) change_log.push({ at: 'strings', note: 'converted single-quoted strings to double-quoted' });
    // 7. unquoted object keys
    const beforeKeys = text;
    text = text.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
    if (text !== beforeKeys) change_log.push({ at: 'keys', note: 'quoted unquoted object key(s)' });

    const warnings: string[] = [];
    let parsed: unknown = undefined;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      warnings.push(`still unparseable after repair: ${(e as Error).message}`);
    }
    change_log.push({ at: 'bytes', from: String(started), to: String(Buffer.byteLength(text)), note: 'size after repair' });

    return {
      data: { fixed: text, parsed_valid: parsed !== undefined, parsed },
      warnings,
      change_log,
      ms: 0,
    };
  },
};

// ─── jont_j048_ai-text-de-slopper ──────────────────────────────────────────
// Rule-based replacement of AI-slop phrasing with plain alternatives.

const SLOP_MAP: Array<[RegExp, string, string]> = [
  [/\bdelve into\b/gi, 'examine', 'delve into → examine'],
  [/\bin today's (?:fast-paced |modern )?world\b/gi, 'today', "in today's world → today"],
  [/\bit (?:is|'s) (?:important|crucial|essential) to note that\b/gi, 'note that', 'it is important to note that → note that'],
  [/\bplays a (?:crucial|vital|significant) role in\b/gi, 'matters for', 'plays a crucial role in → matters for'],
  [/\bwhen it comes to\b/gi, 'for', 'when it comes to → for'],
  [/\ba testament to\b/gi, 'evidence of', 'a testament to → evidence of'],
  [/\bnavigat(?:e|ing) the (?:complexities|landscape) of\b/gi, 'handle', 'navigate the complexities of → handle'],
  [/\bin the realm of\b/gi, 'in', 'in the realm of → in'],
  [/\bfurthermore\b/gi, 'also', 'furthermore → also'],
  [/\bmoreover\b/gi, 'and', 'moreover → and'],
  [/\bseamless(?:ly)? integrat(?:e|ion|ed)\b/gi, 'integrate', 'seamlessly integrate → integrate'],
  [/\bleverage\b/gi, 'use', 'leverage → use'],
  [/\butilize\b/gi, 'use', 'utilize → use'],
  [/\bunlock(?:ing)? the (?:full )?potential of\b/gi, 'get the most out of', 'unlock the potential of → get the most out of'],
  [/\bgame[- ]chang(?:er|ing)\b/gi, 'major improvement', 'game-changer → major improvement'],
  [/\bcutting[- ]edge\b/gi, 'modern', 'cutting-edge → modern'],
];

export const aiTextDeSlopper: JontEngine = {
  manifest: {
    id: 'jont_j048_ai-text-de-slopper',
    pattern: 'fixer',
    context: 'server',
    io: {
      input: { type: 'object', required: ['text'], properties: { text: { type: 'string', description: 'AI-assisted draft' } } },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p48', score: 7.0 },
  },
  run(input): JontResult {
    let text = String(input.text ?? '');
    const change_log: Array<{ at: string; from?: string; to?: string; note?: string }> = [];
    let replacements = 0;

    for (const [re, to, label] of SLOP_MAP) {
      const matches = text.match(re);
      if (matches && matches.length > 0) {
        replacements += matches.length;
        change_log.push({ at: label.split(' → ')[0], from: matches[0], to, note: `${matches.length} occurrence(s)` });
        text = text.replace(re, to);
      }
    }
    // collapse doubled spaces left by shorter replacements
    const beforeSpaces = text;
    text = text.replace(/ {2,}/g, ' ');
    if (text !== beforeSpaces) change_log.push({ at: 'whitespace', note: 'collapsed doubled spaces' });

    const warnings: string[] = [];
    if (replacements === 0) warnings.push('no listed slop phrases found — text passed unchanged');

    return {
      data: { text, replacements },
      warnings,
      change_log,
      ms: 0,
    };
  },
};

// ─── jont_j130_google-merchant-feed-fixer ──────────────────────────────────

export const merchantFeedFixer: JontEngine = {
  manifest: {
    id: 'jont_j130_google-merchant-feed-fixer',
    pattern: 'fixer',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['csv'],
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'Product feed (CSV/TSV) destined for Google Merchant Center.' },
          currency: { type: 'string', description: 'Currency appended to bare prices when none is present (default "USD").' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'GT-MKT-google-EC-C15', score: 6.25 },
  },
  run(input): JontResult {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('FEED_EMPTY|paste the product feed');

    // feeds are often TSV even when named .csv — detect honestly
    let delimiter = ',';
    let countsComma = 0;
    let countsTab = 0;
    for (const line of src.split('\n').slice(0, 20)) {
      countsComma += (line.match(/,/g) ?? []).length;
      countsTab += (line.match(/\t/g) ?? []).length;
    }
    if (countsTab > countsComma) delimiter = '\t';

    const rows = parseCsv(src, delimiter);
    if (rows.length < 2) throw new Error('NO_DATA|feed needs a header row and at least one product');
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name: string): number => header.indexOf(name);
    const requiredCols = ['id', 'title', 'link', 'image_link', 'price', 'availability'];
    const missing = requiredCols.filter((c) => col(c) < 0);
    if (missing.length > 0) warnings.push(`missing required Merchant Center column(s): ${missing.join(', ')} — they were added empty; fill them before submitting the feed.`);

    const currency = String(input.currency ?? 'USD').toUpperCase();
    const change_log: Array<{ at: string; note: string }> = [];
    const stats = { price_fixed: 0, availability_fixed: 0, condition_fixed: 0, http_upgraded: 0, title_trimmed: 0, gtin_cleaned: 0 };
    const rowWarnings: string[] = [];

    const width = Math.max(header.length, ...rows.slice(1).map((r) => r.length));
    for (const c of missing) header.push(c); // required columns added at the end, empty
    while (header.length < width) header.push(`column_${header.length + 1}`);

    const out: string[][] = [header];
    const idCounts = new Map<string, number>();
    const body = rows.slice(1);

    body.forEach((row, ri) => {
      const fixed = header.map((_, i) => (row[i] ?? '').trim());

      // id duplicates
      const idIdx = col('id');
      if (idIdx >= 0 && fixed[idIdx]) {
        const n = (idCounts.get(fixed[idIdx]) ?? 0) + 1;
        idCounts.set(fixed[idIdx], n);
        if (n === 2) rowWarnings.push(`row ${ri + 2}: duplicate id "${fixed[idIdx]}" — Merchant Center rejects duplicate item ids`);
      }

      // price → "29.99 USD"
      const pIdx = header.indexOf('price');
      if (pIdx >= 0 && fixed[pIdx]) {
        let p = fixed[pIdx].replace(/\u00a0/g, ' ').trim();
        if (p && !/^[0-9.]+\s+[A-Z]{3}$/.test(p)) {
          const num = p.replace(/[^0-9.,]/g, '').replace(',', '.');
          if (num && Number(num) > 0) {
            fixed[pIdx] = `${num} ${currency}`;
            stats.price_fixed++;
          }
        }
      }

      // availability → in_stock / out_of_stock / preorder / backorder
      const aIdx = header.indexOf('availability');
      if (aIdx >= 0 && fixed[aIdx]) {
        const a = fixed[aIdx].toLowerCase().replace(/[\s_-]+/g, '_').replace('instock', 'in_stock').replace('outofstock', 'out_of_stock');
        if (a !== fixed[aIdx].toLowerCase()) {
          fixed[aIdx] = a;
          stats.availability_fixed++;
        } else fixed[aIdx] = a;
      }

      // condition → new / refurbished / used
      const cIdx = header.indexOf('condition');
      if (cIdx >= 0 && fixed[cIdx]) {
        const c = fixed[cIdx].toLowerCase();
        if (['brand_new', 'brandnew', 'brand new'].includes(c)) {
          fixed[cIdx] = 'new';
          stats.condition_fixed++;
        } else if (c === fixed[cIdx] && !['new', 'refurbished', 'used'].includes(c)) {
          rowWarnings.push(`row ${ri + 2}: condition "${c}" is not new/refurbished/used — Merchant Center will reject it`);
        } else if (c !== fixed[cIdx]) {
          fixed[cIdx] = c;
          stats.condition_fixed++;
        }
      }

      // links: http → https, encode spaces
      for (const linkCol of ['link', 'image_link']) {
        const lIdx = header.indexOf(linkCol);
        if (lIdx >= 0 && fixed[lIdx].startsWith('http://')) {
          fixed[lIdx] = fixed[lIdx].replace('http://', 'https://');
          stats.http_upgraded++;
        }
        if (lIdx >= 0 && fixed[lIdx].includes(' ')) {
          fixed[lIdx] = fixed[lIdx].replace(/ /g, '%20');
        }
      }

      // title length cap 150
      const tIdx = header.indexOf('title');
      if (tIdx >= 0 && fixed[tIdx].length > 150) {
        fixed[tIdx] = `${fixed[tIdx].slice(0, 147)}...`;
        stats.title_trimmed++;
      }

      // gtin: digits only, sane length
      const gIdx = header.indexOf('gtin');
      if (gIdx >= 0 && fixed[gIdx]) {
        const digits = fixed[gIdx].replace(/\D/g, '');
        if (digits !== String(row[gIdx] ?? '')) stats.gtin_cleaned++;
        fixed[gIdx] = digits;
        if (digits && ![8, 12, 13, 14].includes(digits.length)) {
          rowWarnings.push(`row ${ri + 2}: gtin "${digits}" has ${digits.length} digits — expected 8/12/13/14`);
        }
      }

      out.push(fixed);
    });

    if (stats.price_fixed > 0) change_log.push({ at: new Date().toISOString(), note: `${stats.price_fixed} price(s) rewritten to "amount ${currency}"` });
    if (stats.availability_fixed > 0) change_log.push({ at: new Date().toISOString(), note: `${stats.availability_fixed} availability value(s) normalized` });
    if (stats.http_upgraded > 0) change_log.push({ at: new Date().toISOString(), note: `${stats.http_upgraded} http link(s) upgraded to https` });
    if (stats.title_trimmed > 0) change_log.push({ at: new Date().toISOString(), note: `${stats.title_trimmed} title(s) truncated to 150 chars` });
    if (stats.gtin_cleaned > 0) change_log.push({ at: new Date().toISOString(), note: `${stats.gtin_cleaned} gtin(s) cleaned to bare digits` });
    if (rowWarnings.length > 200) warnings.push(`row detail capped: showing the first 200 of ${rowWarnings.length} row-level problems.`);

    return {
      data: {
        output: toCsv(out, delimiter),
        filename: 'feed-fixed.csv',
        rows: body.length,
        stats,
        row_warnings: rowWarnings.slice(0, 200),
        detected_delimiter: delimiter === '\t' ? 'tab' : ',',
      },
      warnings,
      change_log,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

export const FIXER_ENGINES = [jsonRepair, aiTextDeSlopper, merchantFeedFixer];
