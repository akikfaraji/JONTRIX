// Client-context validator engines — run entirely in the browser (VOL-11 §4).
// Deterministic verdicts (C5); every finding is concrete (row/column/path).

import type { JontEngine, JontResult } from '../types';
import { parseCsv } from '../util';
import { detectDelimiter, leafPaths } from './shared';

/* ------------------------------------------------------------------ */
/* j056 json-formatter-validator                                       */
/* ------------------------------------------------------------------ */

const jsonFormatterValidator: JontEngine = {
  manifest: {
    id: 'jont_j056_json-formatter-validator',
    pattern: 'validator',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          json: { type: 'string', format: 'textarea', description: 'JSON to validate and format — parsed locally in your browser.' },
          indent: { type: 'string', enum: ['2', '4', 'tab', 'minify'], description: 'Indentation of the formatted result (default 2).' },
        },
        required: ['json'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-JSON-json-DV-B1', score: 6.95 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.json ?? '');
    if (!src.trim()) throw new Error('JSON_BOX_EMPTY|the JSON box is empty');

    let parsed: unknown;
    let valid = true;
    let errorLine: number | null = null;
    try {
      parsed = JSON.parse(src);
    } catch (err) {
      valid = false;
      const message = err instanceof Error ? err.message : String(err);
      const posMatch = /position (\d+)/.exec(message);
      if (posMatch) {
        const pos = Number(posMatch[1]);
        errorLine = src.slice(0, pos).split('\n').length;
      }
      return {
        data: {
          output: `Invalid JSON: ${message}${errorLine ? ` (around line ${errorLine})` : ''}`,
          filename: null,
          valid: false,
          error_line: errorLine,
        },
        warnings,
        ms: Date.now() - started,
      } satisfies JontResult;
    }

    const indentOpt = input.indent;
    const formatted =
      indentOpt === 'minify'
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, indentOpt === 'tab' ? '\t' : indentOpt === '4' ? 4 : 2);

    const stats = {
      bytes: new Blob([src]).size,
      top_level: Array.isArray(parsed) ? `array (${parsed.length})` : parsed === null || typeof parsed !== 'object' ? typeof parsed : `object (${Object.keys(parsed).length} keys)`,
    };

    return {
      data: {
        output: formatted,
        filename: 'formatted.json',
        valid: true,
        stats,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j064 json-diff-checker                                              */
/* ------------------------------------------------------------------ */

const jsonDiffChecker: JontEngine = {
  manifest: {
    id: 'jont_j064_json-diff-checker',
    pattern: 'validator',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          json_a: { type: 'string', format: 'textarea', description: 'The original JSON.' },
          json_b: { type: 'string', format: 'textarea', description: 'The changed JSON.' },
        },
        required: ['json_a', 'json_b'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-JSON-json-DV-B1-2', score: 6.85 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const aSrc = String(input.json_a ?? '').trim();
    const bSrc = String(input.json_b ?? '').trim();
    if (!aSrc || !bSrc) throw new Error('INPUT_EMPTY|both JSON boxes are required');

    const a = JSON.parse(aSrc) as unknown;
    const b = JSON.parse(bSrc) as unknown;

    const leavesA = leafPaths(a);
    const leavesB = leafPaths(b);
    const mapA = new Map(leavesA.map((l) => [l.path, l.value]));
    const mapB = new Map(leavesB.map((l) => [l.path, l.value]));

    const added: string[] = [];
    const removed: string[] = [];
    const changed: Array<{ path: string; from: unknown; to: unknown }> = [];

    for (const [path, value] of mapA) {
      if (!mapB.has(path)) removed.push(path);
      else if (JSON.stringify(value) !== JSON.stringify(mapB.get(path))) {
        changed.push({ path, from: value, to: mapB.get(path) });
      }
    }
    for (const path of mapB.keys()) if (!mapA.has(path)) added.push(path);

    const identical = added.length === 0 && removed.length === 0 && changed.length === 0;
    const cap = 200;
    const lines: string[] = [];
    if (identical) lines.push('The two JSON documents are identical.');
    else {
      if (added.length) {
        lines.push(`Added (${added.length}):`);
        lines.push(...added.slice(0, cap).map((p) => `  + ${p}`));
        if (added.length > cap) lines.push(`  ... ${added.length - cap} more`);
      }
      if (removed.length) {
        lines.push(`Removed (${removed.length}):`);
        lines.push(...removed.slice(0, cap).map((p) => `  - ${p}`));
        if (removed.length > cap) lines.push(`  ... ${removed.length - cap} more`);
      }
      if (changed.length) {
        lines.push(`Changed (${changed.length}):`);
        for (const c of changed.slice(0, cap)) {
          lines.push(`  ~ ${c.path}: ${JSON.stringify(c.from)} -> ${JSON.stringify(c.to)}`);
        }
        if (changed.length > cap) lines.push(`  ... ${changed.length - cap} more`);
      }
    }
    if (changed.length > cap || added.length > cap || removed.length > cap) {
      warnings.push('Report truncated to 200 entries per section; full structured lists are in the JSON result.');
    }

    return {
      data: {
        output: lines.join('\n'),
        filename: null,
        identical,
        added,
        removed,
        changed,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j004 leading-zero-date-guard                                        */
/* ------------------------------------------------------------------ */

const leadingZeroDateGuard: JontEngine = {
  manifest: {
    id: 'jont_j004_leading-zero-date-guard',
    pattern: 'validator',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'CSV you plan to open in Excel/Sheets — checked locally, nothing uploaded.' },
        },
        required: ['csv'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-CSV-excel-DR-A2', score: 7.6 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');

    const det = detectDelimiter(src);
    const rows = parseCsv(src, det.delimiter);
    if (rows.length === 0) throw new Error('NO_ROWS|no rows found');

    const risky: Array<{ row: number; column: number; header: string; value: string; reason: string }> = [];
    const header = rows[0];
    const checks: Array<{ re: RegExp; reason: string }> = [
      { re: /^0\d+$/, reason: 'leading zero is stripped by spreadsheet apps (zip codes, phone numbers, SKU codes)' },
      { re: /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, reason: 'ambiguous date format is auto-converted depending on locale' },
      { re: /^\d{1,2}-\d{1,2}$/, reason: 'may be coerced to a date (e.g. 1-2 becomes Feb 1)' },
      { re: /^\d{12,}$/, reason: 'long digit strings (barcodes, order ids) are shown in scientific notation' },
      { re: /^[=+-@]/, reason: 'formula-like cell — spreadsheet may execute it (CSV injection risk)' },
    ];

    rows.slice(1).forEach((row, ri) => {
      row.forEach((cell, ci) => {
        for (const c of checks) {
          if (c.re.test(cell.trim())) {
            risky.push({ row: ri + 2, column: ci + 1, header: header[ci] ?? `column_${ci + 1}`, value: cell, reason: c.reason });
            break;
          }
        }
      });
    });

    const lines: string[] = risky.length === 0
      ? ['No mangle risks found. Every cell should survive a spreadsheet round-trip.']
      : [`${risky.length} cell(s) may be mangled when opened in Excel/Sheets:`, ''];
    for (const r of risky.slice(0, 200)) {
      lines.push(`  row ${r.row}, column ${r.column} (${r.header}): "${r.value}" — ${r.reason}`);
    }
    if (risky.length > 200) {
      lines.push(`  ... ${risky.length - 200} more`);
      warnings.push('Report truncated to the first 200 risky cells.');
    }
    if (risky.length > 0) {
      warnings.push('Fix: format those columns as text before import, or quote the cells ("0042") — quoting alone does not protect Excel; a tab prefix or import wizard does.');
    }

    return {
      data: {
        output: lines.join('\n'),
        filename: null,
        clean: risky.length === 0,
        risky_cells: risky,
        detected_delimiter: det.delimiter === '\t' ? 'tab' : det.delimiter,
        rows_scanned: rows.length - 1,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j037 duplicate-row-finder                                           */
/* ------------------------------------------------------------------ */

const duplicateRowFinder: JontEngine = {
  manifest: {
    id: 'jont_j037_duplicate-row-finder',
    pattern: 'validator',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'CSV to scan for duplicates — locally, nothing uploaded.' },
          columns: { type: 'string', description: 'Comma-separated header names to compare (default: all columns).' },
          mode: { type: 'string', enum: ['exact', 'fuzzy'], description: 'Exact cell match, or normalized fuzzy match (case/spacing-insimilar).' },
          threshold: { type: 'number', description: 'Fuzzy mode: token-overlap threshold 0..1 (default 0.9).' },
        },
        required: ['csv'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-CSV-find-DR-F1', score: 7.25 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');

    const det = detectDelimiter(src);
    const rows = parseCsv(src, det.delimiter);
    if (rows.length < 2) throw new Error('NO_DATA|CSV needs a header row and at least one data row');
    const header = rows[0];
    const body = rows.slice(1);

    let useCols: number[];
    const colSpec = String(input.columns ?? '').trim();
    if (colSpec) {
      const names = colSpec.split(',').map((c) => c.trim()).filter(Boolean);
      useCols = [];
      for (const n of names) {
        const idx = header.indexOf(n);
        if (idx < 0) throw new Error(`COLUMN_MISSING|column "${n}" is not in the header`);
        useCols.push(idx);
      }
    } else {
      useCols = header.map((_, i) => i);
    }

    const mode = input.mode === 'fuzzy' ? 'fuzzy' : 'exact';
    const threshold = Math.min(1, Math.max(0, Number(input.threshold) || 0.9));
    const norm = (s: string): string => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const keyOf = (row: string[]): string => useCols.map((i) => norm(row[i] ?? '')).join('\u0000');

    const groups: Array<number[]> = [];
    if (mode === 'exact') {
      const seen = new Map<string, number[]>();
      body.forEach((row, ri) => {
        const k = keyOf(row);
        const bucket = seen.get(k);
        if (bucket) bucket.push(ri + 2);
        else seen.set(k, [ri + 2]);
      });
      for (const bucket of seen.values()) if (bucket.length > 1) groups.push(bucket);
    } else {
      // fuzzy: bucket by exact key first (fast path), then token overlap within candidates
      const tokensOf = (row: string[]): Set<string> =>
        new Set(keyOf(row).split(/[\s,;|\u0000]+/).filter(Boolean));
      const processed = new Set<number>();
      const tokenCache = body.map(tokensOf);
      body.forEach((row, ri) => {
        if (processed.has(ri)) return;
        const group = [ri + 2];
        for (let rj = ri + 1; rj < body.length; rj++) {
          if (processed.has(rj)) continue;
          const sim = jaccard(tokenCache[ri], tokenCache[rj]);
          if (sim >= threshold) {
            group.push(rj + 2);
            processed.add(rj);
          }
        }
        if (group.length > 1) {
          groups.push(group);
          processed.add(ri);
        }
      });
      if (body.length > 5000) warnings.push(`${body.length} rows scanned pairwise in your browser; this can take a few seconds for large files.`);
    }

    const cap = 200;
    const lines: string[] = groups.length === 0
      ? ['No duplicate rows found.']
      : [`${groups.length} duplicate group(s), ${groups.reduce((n, g) => n + g.length, 0)} rows involved:`, ''];
    for (const g of groups.slice(0, cap)) lines.push(`  rows ${g.join(', ')}`);
    if (groups.length > cap) {
      lines.push(`  ... ${groups.length - cap} more groups`);
      warnings.push('Report truncated to the first 200 groups.');
    }

    return {
      data: {
        output: lines.join('\n'),
        filename: null,
        duplicate_groups: groups,
        total_duplicate_rows: groups.reduce((n, g) => n + g.length, 0),
        mode,
        columns_used: useCols.map((i) => header[i]),
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

export const CLIENT_VALIDATOR_ENGINES: JontEngine[] = [
  jsonFormatterValidator,
  jsonDiffChecker,
  leadingZeroDateGuard,
  duplicateRowFinder,
];
