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

// ─── jont_j021_shopify-csv-preflight ───────────────────────────────────────
// Product-CSV structure check before the Shopify import button is pressed.

const shopifyCsvPreflightCheck: JontEngine = {
  manifest: {
    id: 'jont_j021_shopify-csv-preflight',
    pattern: 'validator',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'product CSV for Shopify import — inspected locally' },
        },
        required: ['csv'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'EC-C3', score: 7.53 },
  },
  run(input) {
    const started = Date.now();
    const findings: Array<{ severity: 'error' | 'warning' | 'info'; row?: number; message: string }> = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');
    const det = detectDelimiter(src);
    const rows = parseCsv(src, det.delimiter);
    if (rows.length < 2) throw new Error('NO_ROWS|header row plus at least one product row required');

    const header = rows[0].map((h) => h.trim());
    const lower = header.map((h) => h.toLowerCase());
    const REQUIRED = ['handle', 'title'];
    const RECOMMENDED = ['variant price', 'vendor', 'body (html)', 'image src'];
    REQUIRED.forEach((r) => { if (!lower.includes(r)) findings.push({ severity: 'error', message: `missing required column "${r}" — Shopify import fails without it` }); });
    RECOMMENDED.forEach((r) => { if (!lower.includes(r)) findings.push({ severity: 'warning', message: `recommended column "${r}" absent — products will import thin` }); });

    const handleIdx = lower.indexOf('handle');
    if (handleIdx >= 0) {
      const seen = new Map<string, number>();
      rows.slice(1).forEach((r, i) => {
        const h = (r[handleIdx] ?? '').trim();
        if (!h) { findings.push({ severity: 'error', row: i + 2, message: 'empty Handle — every row must repeat the product handle' }); return; }
        if (seen.has(h)) return; // multi-row variants are legal — repeats expected
        seen.set(h, i + 2);
        if (/\s/.test(h)) findings.push({ severity: 'warning', row: i + 2, message: `handle "${h}" contains spaces — Shopify rewrites handles to lowercase-hyphen; pre-normalize to keep URLs stable` });
      });
    }

    const priceIdx = lower.findIndex((h) => h.includes('variant price') || h === 'price');
    if (priceIdx >= 0) {
      rows.slice(1).forEach((r, i) => {
        const p = (r[priceIdx] ?? '').trim();
        if (p && !/^\d+([.,]\d{1,2})?$/.test(p)) findings.push({ severity: 'warning', row: i + 2, message: `price "${p}" is not a plain number — strip currency symbols` });
        if (p === '0') findings.push({ severity: 'info', row: i + 2, message: `row ${i + 2}: zero price — deliberate?` });
      });
    }

    const imgIdx = lower.findIndex((h) => h.includes('image src'));
    if (imgIdx >= 0) {
      rows.slice(1).forEach((r, i) => {
        const u = (r[imgIdx] ?? '').trim();
        if (u && !/^https?:\/\//i.test(u)) findings.push({ severity: 'error', row: i + 2, message: 'image URL must be absolute http(s) — relative paths import as broken' });
      });
    }

    // delimiter honesty: Shopify exports are comma-CSV
    if (det.delimiter !== ',') findings.push({ severity: 'error', message: `file looks ${det.delimiter === '\t' ? 'tab' : `"${det.delimiter}"`}-delimited — Shopify import expects comma-CSV` });

    const errors = findings.filter((f) => f.severity === 'error').length;
    return {
      data: {
        products: handleIdx >= 0 ? new Set(rows.slice(1).map((r) => (r[handleIdx] ?? '').trim()).filter(Boolean)).size : null,
        rows: rows.length - 1,
        error_count: errors,
        warning_count: findings.filter((f) => f.severity === 'warning').length,
        verdict: errors > 0 ? 'not-ready' : 'ready',
        findings: findings.slice(0, 300),
      },
      warnings: findings.length > 300 ? ['findings truncated at 300'] : [],
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

// ─── jont_j025_file-safety-scanner ─────────────────────────────────────────
// Signature scan of pasted text / base64 bytes for the dangerous patterns
// office files and scripts carry. Honest scope: pattern evidence, NOT antivirus.

const fileSafetyScanner: JontEngine = {
  manifest: {
    id: 'jont_j025_file-safety-scanner',
    pattern: 'validator',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          content: { type: 'string', format: 'textarea', description: 'pasted file content, XML/HTML source, or base64 of the raw file — scanned locally' },
          is_base64: { type: 'boolean', description: 'set true when content is base64 of the raw file' },
        },
        required: ['content'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'DR-D1', score: 7.4 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    let text = String(input.content ?? '');
    if (!text.trim()) throw new Error('CONTENT_EMPTY|paste content to scan');
    if (input.is_base64 === true) {
      try {
        text = atob(text.replace(/\s+/g, ''));
      } catch {
        throw new Error('BAD_BASE64|not valid base64');
      }
    }

    const SIGS: Array<{ name: string; re: RegExp; severity: 'error' | 'warning' | 'info'; note: string }> = [
      { name: 'macro-project', re: /vbaProject\.bin|vbaproject/i, severity: 'error', note: 'embedded VBA project — the classic Office macro carrier' },
      { name: 'auto-exec-macro', re: /Auto_?Open|Document_?Open|Workbook_?Open|Auto_?Close/i, severity: 'error', note: 'auto-executing macro hook — code runs on file open' },
      { name: 'shell-invoke', re: /Shell\s*\(|WScript\.Shell|CreateObject\(["'](WScript|Shell)/i, severity: 'error', note: 'shell/process invocation from a document context' },
      { name: 'powershell-dropper', re: /powershell(\.exe)?\s+(-enc|-ep\s+bypass|IEX|Invoke-Expression)/i, severity: 'error', note: 'PowerShell download/execute pattern' },
      { name: 'remote-template', re: /remote[_\s]?template|subdoc/i, severity: 'warning', note: 'remote template reference — content pulled from outside the file' },
      { name: 'external-link', re: /http:\\?\/\\?\/[\w.-]+\/(setup|install|update|load)/i, severity: 'warning', note: 'URL that looks like a dropper endpoint' },
      { name: 'active-content', re: /<script[\s>]/i, severity: 'warning', note: 'inline script in markup' },
      { name: 'dde-payload', re: /DDE\s*\(|msword.*DDE/i, severity: 'error', note: 'DDE execution trick seen in phishing docs' },
      { name: 'exe-magic', re: /MZ[\x00-\x1f]{2}/, severity: 'warning', note: 'Windows PE header fragment — an executable may be embedded' },
      { name: 'zip-magic-office', re: /PK\x03\x04/, severity: 'info', note: 'zip container (modern Office/JAR/APK family) — contents inspected as text where possible' },
    ];

    const hits: Array<{ signature: string; severity: string; note: string; count: number }> = [];
    SIGS.forEach((sig) => {
      const count = (text.match(new RegExp(sig.re.source, sig.re.flags.includes('g') ? sig.re.flags : sig.re.flags + 'g')) ?? []).length;
      if (count > 0) hits.push({ signature: sig.name, severity: sig.severity, note: sig.note, count });
    });

    const errors = hits.filter((h) => h.severity === 'error').length;
    const verdict = errors > 0 ? 'dangerous' : hits.length > 0 ? 'suspicious' : 'no-signatures';
    if (verdict !== 'dangerous') warnings.push('scan is signature-based: clean does NOT prove safety — treat unexpected files with caution and scan with real AV too');

    return {
      data: {
        verdict,
        scanned_chars: text.length,
        hits,
        error_signatures: errors,
        warning_signatures: hits.length - errors,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

// ─── jont_j028_universal-csv-pre-flight-validator ──────────────────────────
// Structural CSV checks any upload folder should run before accepting a file.

const universalCsvPreflight: JontEngine = {
  manifest: {
    id: 'jont_j028_universal-csv-pre-flight-validator',
    pattern: 'validator',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'the CSV to validate — parsed locally' },
          delimiter: { type: 'string', description: 'force a delimiter; default auto-detects , ; tab |' },
        },
        required: ['csv'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-CSV-csv-DR-A1-2', score: 7.4 },
  },
  run(input) {
    const started = Date.now();
    const findings: Array<{ severity: 'error' | 'warning' | 'info'; row?: number; message: string }> = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');

    let bom = false;
    let body = src;
    if (body.charCodeAt(0) === 0xfeff) {
      bom = true;
      body = body.slice(1);
      findings.push({ severity: 'info', message: 'UTF-8 BOM present — harmless for Excel, breaks naive parsers that key on the first header name' });
    }

    const det = input.delimiter ? { delimiter: String(input.delimiter), consistency: 1 } : detectDelimiter(body);
    if (det.consistency < 0.9) {
      findings.push({ severity: 'warning', message: `field counts vary between lines (consistency ${(det.consistency * 100).toFixed(0)}%) — ragged rows follow` });
    }
    const rows = parseCsv(body, det.delimiter);
    if (rows.length === 0) throw new Error('NO_ROWS|no rows detected');

    const header = rows[0];
    header.forEach((h, i) => {
      const name = h.trim();
      if (!name) findings.push({ severity: 'error', message: `header column ${i + 1} is empty — downstream mappers key on names` });
      else if (name !== h) findings.push({ severity: 'info', message: `header "${name}" carries padding whitespace` });
      else if (/[\r\n]/.test(name)) findings.push({ severity: 'error', message: `header "${name.slice(0, 20)}" contains a line break` });
    });
    const seen = new Map<string, number>();
    header.forEach((h, i) => {
      const n = h.trim().toLowerCase();
      if (seen.has(n)) findings.push({ severity: 'error', message: `duplicate header "${h.trim()}" (columns ${seen.get(n)! + 1} and ${i + 1})` });
      else seen.set(n, i);
    });

    rows.slice(1).forEach((r, i) => {
      const rowNo = i + 2;
      if (r.length !== header.length) {
        findings.push({ severity: 'warning', row: rowNo, message: `row ${rowNo} has ${r.length} fields, header has ${header.length}` });
      }
      if (r.every((c) => !c.trim())) findings.push({ severity: 'info', row: rowNo, message: `row ${rowNo} is completely empty` });
    });

    // quoting problems the CSV parser had to absorb
    const rawLines = body.split(/\r?\n/).filter((l) => l.trim() !== '');
    const oddQuotes = rawLines.filter((l) => (l.match(/"/g) ?? []).length % 2 === 1).length;
    if (oddQuotes > 0) findings.push({ severity: 'error', row: 1, message: `${oddQuotes} line(s) carry an odd number of quote characters — an unclosed quote will swallow following rows on strict parsers` });

    const errors = findings.filter((f) => f.severity === 'error').length;
    return {
      data: {
        delimiter: det.delimiter === '\t' ? 'tab' : det.delimiter,
        delimiter_consistency: det.consistency,
        rows: rows.length - 1,
        columns: header.length,
        bom,
        error_count: errors,
        warning_count: findings.filter((f) => f.severity === 'warning').length,
        verdict: errors > 0 ? 'not-ready' : det.consistency < 0.9 ? 'review' : 'ready',
        findings: findings.slice(0, 300),
      },
      warnings: findings.length > 300 ? ['findings truncated at 300'] : [],
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

// ─── jont_j019_whatsapp-order-parser (extractor) ───────────────────────────
// Turns free-text WhatsApp order messages into structured order objects —
// quantity × item lines, phone numbers, totals. Deterministic regex passes.

const whatsappOrderParser: JontEngine = {
  manifest: {
    id: 'jont_j019_whatsapp-order-parser',
    pattern: 'extractor',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          messages: { type: 'string', format: 'textarea', description: 'paste one or more WhatsApp order messages — parsed locally, never uploaded' },
          price_hints: { type: 'string', description: 'optional "item=price" pairs, comma-separated, used to compute totals (e.g. "shirt=1200, mug=350")' },
        },
        required: ['messages'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'EC-C29', score: 7.55 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.messages ?? '');
    if (!src.trim()) throw new Error('MESSAGES_EMPTY|paste the order messages first');

    const hints = new Map<string, number>();
    String(input.price_hints ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p) => {
        const [item, price] = p.split('=').map((s) => s.trim().toLowerCase());
        const n = Number((price ?? '').replace(/[^0-9.]/g, ''));
        if (item && Number.isFinite(n) && n > 0) hints.set(item, n);
      });

    const blocks = src.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
    const orders = blocks.map((block, bi) => {
      const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const nameMatch = /^(?:name|customer)\s*[:\-]\s*(.+)$/im.exec(block)?.[1]?.trim();
      const firstLooksLikeName = /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(lines[0] ?? '');
      const name = nameMatch ?? (firstLooksLikeName ? lines[0] : null);
      const phone = (/(\+?\d[\d\s-]{7,15}\d)/.exec(block)?.[1] ?? null)?.replace(/[\s-]/g, '');
      const items: Array<{ qty: number; item: string }> = [];
      lines.forEach((l) => {
        // "2 x shirt", "2x shirt", "shirt x 2", "shirt - 2", "2 shirt"
        const m1 = /^(\d{1,3})\s*[x×*]\s*(.+)$/i.exec(l);
        const m2 = /^(.+?)\s*[x×]\s*(\d{1,3})$/i.exec(l);
        const m3 = /^(.+?)\s*[-–:]\s*(\d{1,3})$/i.exec(l);
        const m4 = /^(\d{1,3})\s+(.+)$/.exec(l);
        const m = m1 ?? m2 ?? m3 ?? m4;
        if (m) {
          const qty = Number((m1 ?? m4)?.[1] ?? m2?.[2] ?? m3?.[2]);
          const item = ((m1 ?? m4)?.[2] ?? m2?.[1] ?? m3?.[1] ?? '').trim();
          if (Number.isFinite(qty) && qty > 0 && item && !/^(name|customer|address|phone|tel|total)\b/i.test(item)) {
            items.push({ qty, item: item.replace(/^[-:]\s*/, '') });
          }
        }
      });
      const total = items.reduce((s, it) => {
        const price = hints.get(it.item.toLowerCase()) ?? hints.get(it.item.toLowerCase().replace(/s$/, ''));
        return price ? s + price * it.qty : s;
      }, 0);
      const known = items.every((it) => hints.has(it.item.toLowerCase()) || hints.has(it.item.toLowerCase().replace(/s$/, '')));
      return {
        order_index: bi + 1,
        name,
        phone,
        items,
        item_count: items.reduce((s, i) => s + i.qty, 0),
        total: total > 0 ? total : null,
        total_known: known && items.length > 0,
      };
    });

    const withItems = orders.filter((o) => o.items.length > 0).length;
    if (withItems === 0) warnings.push('no "qty x item" lines recognized — expected formats: "2 x shirt", "shirt x 2", "2 shirt"');
    if (orders.some((o) => !o.total_known && o.items.length > 0)) warnings.push('some totals are unknown — supply price_hints ("item=price") to compute them');
    if (orders.some((o) => !o.phone)) warnings.push('at least one order has no phone number');

    return {
      data: {
        orders,
        orders_parsed: orders.length,
        orders_with_items: withItems,
        total_value: orders.reduce((s, o) => s + (o.total ?? 0), 0) || null,
        json: JSON.stringify(orders, null, 2),
        filename: 'orders.json',
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

export const CLIENT_VALIDATOR_ENGINES: JontEngine[] = [
  jsonFormatterValidator,
  jsonDiffChecker,
  leadingZeroDateGuard,
  duplicateRowFinder,
  shopifyCsvPreflightCheck,
  fileSafetyScanner,
  universalCsvPreflight,
  whatsappOrderParser,
];
