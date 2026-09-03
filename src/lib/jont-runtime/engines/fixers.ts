// Fixer-pattern engines — VOL-11 §3: data → data + change log; every
// mutation logged. Deterministic cores only (C5).

import type { JontEngine, JontResult } from '../types';

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

export const FIXER_ENGINES = [jsonRepair, aiTextDeSlopper];
