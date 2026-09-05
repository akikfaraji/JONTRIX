// Client-context fixer engines — run entirely in the browser (VOL-11 §4).
// Deterministic repairs only (C5); every rewrite is recorded in change_log.

import type { JontEngine, JontResult } from '../types';
import { parseCsv } from '../util';
import { detectDelimiter, msToSrtTime, srtTimeToMs, toDelimited } from './shared';

/* ------------------------------------------------------------------ */
/* j034 csv-delimiter-fixer                                            */
/* ------------------------------------------------------------------ */

const csvDelimiterFixer: JontEngine = {
  manifest: {
    id: 'jont_j034_csv-delimiter-fixer',
    pattern: 'fixer',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'CSV with the wrong or inconsistent delimiter — fixed locally.' },
          target: { type: 'string', enum: [',', ';', '\t', '|'], description: 'Delimiter of the fixed output (default comma).' },
        },
        required: ['csv'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-CSV-csv-DR-A1', score: 7.3 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');
    const target = typeof input.target === 'string' && input.target !== '' ? input.target : ',';

    const det = detectDelimiter(src);
    if (det.consistency < 0.9) {
      warnings.push(`field counts vary across lines when parsed with ${det.delimiter === '\t' ? 'tab' : `"${det.delimiter}"`} (consistency ${(det.consistency * 100).toFixed(0)}%); if the source mixes delimiters per line, a single output delimiter cannot represent it faithfully — check the result.`);
    }
    const rows = parseCsv(src, det.delimiter);
    if (rows.length === 0) throw new Error('NO_ROWS|no rows found');

    const change_log: Array<{ at: string; from?: string; to?: string; note?: string }> = [
      {
        at: new Date().toISOString(),
        from: det.delimiter === '\t' ? 'tab' : det.delimiter,
        to: target === '\t' ? 'tab' : target,
        note: `detected source delimiter and re-serialized with the target delimiter (${rows.length} rows)`,
      },
    ];

    return {
      data: {
        output: toDelimited(rows, target),
        filename: 'fixed.csv',
        rows: rows.length,
        detected_delimiter: det.delimiter === '\t' ? 'tab' : det.delimiter,
      },
      warnings,
      change_log,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j077 csv-cleaner                                                    */
/* ------------------------------------------------------------------ */

const csvCleaner: JontEngine = {
  manifest: {
    id: 'jont_j077_csv-cleaner',
    pattern: 'fixer',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'Messy CSV — trimmed, header-normalized and empty-pruned locally.' },
          normalize_headers: { type: 'string', enum: ['keep', 'lowercase', 'snake_case'], description: 'Header normalization (default snake_case).' },
          drop_empty_rows: { type: 'boolean', description: 'Remove rows where every cell is empty (default true).' },
          drop_empty_cols: { type: 'boolean', description: 'Remove columns where every data cell is empty (default true).' },
          line_endings: { type: 'string', enum: ['lf', 'crlf'], description: 'Output line endings (default lf).' },
        },
        required: ['csv'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-CSV-clean-DR-A1', score: 6.7 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');

    const det = detectDelimiter(src);
    let rows = parseCsv(src, det.delimiter);
    if (rows.length === 0) throw new Error('NO_ROWS|no rows found');
    const rowsBefore = rows.length - 1; // data rows, header excluded
    const colsBefore = Math.max(...rows.map((r) => r.length));

    const change_log: Array<{ at: string; from?: string; to?: string; note?: string }> = [];
    const normalize = input.normalize_headers === undefined ? 'snake_case' : String(input.normalize_headers);
    if (normalize !== 'keep') {
      const before = rows[0].join(', ');
      rows[0] = rows[0].map((h) => {
        let out = h.trim().toLowerCase().replace(/\s+/g, ' ');
        if (normalize === 'snake_case') out = out.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        return out;
      });
      if (rows[0].join(', ') !== before) change_log.push({ at: new Date().toISOString(), note: `headers normalized (${normalize})` });
    }

    const dropRows = input.drop_empty_rows === undefined ? true : Boolean(input.drop_empty_rows);
    if (dropRows) {
      const beforeRows = rows.length;
      rows = rows.filter((r, i) => i === 0 || r.some((c) => c.trim() !== ''));
      if (rows.length !== beforeRows) change_log.push({ at: new Date().toISOString(), note: `removed ${beforeRows - rows.length} empty row(s)` });
    }

    const dropCols = input.drop_empty_cols === undefined ? true : Boolean(input.drop_empty_cols);
    if (dropCols && rows.length > 1) {
      const width = Math.max(...rows.map((r) => r.length));
      const emptyCols: number[] = [];
      for (let c = 0; c < width; c++) {
        if (rows.slice(1).every((r) => (r[c] ?? '').trim() === '')) emptyCols.push(c);
      }
      if (emptyCols.length > 0) {
        rows = rows.map((r) => r.filter((_, c) => !emptyCols.includes(c)));
        change_log.push({ at: new Date().toISOString(), note: `removed ${emptyCols.length} empty column(s) at index ${emptyCols.map((c) => c + 1).join(', ')}` });
      }
    }

    const trimmed = rows.map((r) => r.map((c) => c.trim()));
    if (JSON.stringify(trimmed) !== JSON.stringify(rows)) {
      change_log.push({ at: new Date().toISOString(), note: 'trimmed surrounding whitespace from cells' });
    }
    rows = trimmed;

    const eol = input.line_endings === 'crlf' ? '\r\n' : '\n';
    const output = toDelimited(rows, det.delimiter).replace(/\n/g, eol);
    if (/\r/.test(src) && eol === '\n') change_log.push({ at: new Date().toISOString(), note: 'line endings normalized to LF' });
    if (!/\r/.test(src) && eol === '\r\n') change_log.push({ at: new Date().toISOString(), note: 'line endings normalized to CRLF' });

    return {
      data: {
        output,
        filename: 'cleaned.csv',
        rows_before: rowsBefore,
        rows_after: rows.length - 1, // data rows, header excluded
        columns_before: colsBefore,
        columns_after: Math.max(...rows.map((r) => r.length), 0),
      },
      warnings,
      change_log,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j069 subtitle-sync-offset-fixer                                     */
/* ------------------------------------------------------------------ */

const subtitleSyncOffsetFixer: JontEngine = {
  manifest: {
    id: 'jont_j069_subtitle-sync-offset-fixer',
    pattern: 'fixer',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          srt: { type: 'string', format: 'textarea', description: 'SRT subtitle content — shifted locally, never uploaded.' },
          offset_ms: { type: 'number', description: 'Milliseconds to shift. Positive = subtitles appear later; negative = earlier.' },
        },
        required: ['srt', 'offset_ms'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'DR-S1', score: 6.78 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.srt ?? '');
    if (!src.trim()) throw new Error('SRT_BOX_EMPTY|the SRT box is empty');
    const offset = Number(input.offset_ms);
    if (!Number.isFinite(offset) || offset === 0) throw new Error('OFFSET_INVALID|offset_ms must be a non-zero number (negative shifts earlier)');

    const blocks = src.replace(/\r\n/g, '\n').split(/\n\n+/);
    const cueRe = /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/;
    let shifted = 0;
    let clamped = 0;
    const out: string[] = [];

    for (const block of blocks) {
      const lines = block.split('\n');
      const cueIdx = lines.findIndex((l) => cueRe.test(l));
      if (cueIdx < 0) {
        if (block.trim() !== '') warnings.push(`a block without a timestamp line was passed through unchanged: "${block.slice(0, 40)}..."`);
        out.push(block);
        continue;
      }
      const m = cueRe.exec(lines[cueIdx]) as RegExpExecArray;
      const start = srtTimeToMs(m[1]);
      const end = srtTimeToMs(m[2]);
      if (start === null || end === null) {
        out.push(block);
        continue;
      }
      const ns = Math.max(0, start + offset);
      const ne = Math.max(0, end + offset);
      if (start + offset < 0 || end + offset < 0) clamped++;
      lines[cueIdx] = `${msToSrtTime(ns)} --> ${msToSrtTime(ne)}`;
      shifted++;
      out.push(lines.join('\n'));
    }

    if (shifted === 0) throw new Error('NO_CUES|no SRT cues found (expected HH:MM:SS,mmm --> HH:MM:SS,mmm lines)');
    if (clamped > 0) warnings.push(`${clamped} cue(s) would start before zero and were clamped to 00:00:00,000.`);
    if (offset > 0) warnings.push(`Subtitles were moved later by ${offset} ms. If dialogue still leads the video, use a negative offset.`);

    return {
      data: {
        output: out.join('\n\n'),
        filename: 'synced.srt',
        cues_shifted: shifted,
        offset_ms: offset,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

// ─── jont_j006_csv-column-split-repair ─────────────────────────────────────
// One column holds several fields glued together ("City, ZIP" / "name|dept").
// Splits it into real columns — locally, with a full change log.

const csvColumnSplitRepair: JontEngine = {
  manifest: {
    id: 'jont_j006_csv-column-split-repair',
    pattern: 'fixer',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'CSV with a merged column — fixed locally' },
          column: { type: 'string', description: 'name of the column to split' },
          separator: { type: 'string', description: 'the glue between fields, e.g. ", " or " - " or "|"' },
          new_names: { type: 'string', description: 'comma-separated names for the new columns (default: column_1, column_2, …)' },
        },
        required: ['csv', 'column'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'DR-A2', score: 7.55 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');
    const det = detectDelimiter(src);
    const rows = parseCsv(src, det.delimiter);
    if (rows.length < 2) throw new Error('NO_ROWS|need a header row plus data rows');

    const colName = String(input.column ?? '').trim();
    const header = rows[0];
    const idx = header.findIndex((h) => h.trim().toLowerCase() === colName.toLowerCase());
    if (!colName) throw new Error('NO_COLUMN|name the column to split');
    if (idx < 0) throw new Error(`COLUMN_NOT_FOUND|"${colName}" is not in the header — available: ${header.slice(0, 8).join(', ')}${header.length > 8 ? '…' : ''}`);

    const sep = String(input.separator ?? ', ');
    if (!sep) throw new Error('NO_SEPARATOR|give the separator that glues the fields (e.g. ", ")');

    const splitParts = (cell: string): string[] => cell.split(sep).map((p) => p.trim());
    // probe how many parts the column really carries
    let width = 0;
    rows.slice(1).forEach((r) => {
      width = Math.max(width, splitParts(r[idx] ?? '').length);
    });
    if (width < 2) {
      throw new Error(`NOTHING_TO_SPLIT|no cell in "${colName}" contains the separator "${sep}" — check the glue text`);
    }
    if (width > 12) throw new Error(`TOO_WIDE|splitting yields ${width} columns — that looks wrong; check the separator`);

    const names = String(input.new_names ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const newCols: string[] = [];
    for (let i = 0; i < width; i++) newCols.push(names[i] ?? `${colName}_${i + 1}`);

    const out: string[][] = [];
    out.push([...header.slice(0, idx), ...newCols, ...header.slice(idx + 1)]);
    let uneven = 0;
    rows.slice(1).forEach((r) => {
      const parts = splitParts(r[idx] ?? '');
      while (parts.length < width) parts.push('');
      if (splitParts(r[idx] ?? '').length !== width) uneven += 1;
      out.push([...r.slice(0, idx), ...parts, ...r.slice(idx + 1)]);
    });

    const change_log = [{
      at: new Date().toISOString(),
      from: colName,
      to: newCols.join(', '),
      note: `split ${rows.length - 1} cells on "${sep}" into ${width} columns`,
    }];
    if (uneven > 0) warnings.push(`${uneven} row(s) had a different field count — empties were padded; spot-check them`);
    if (newCols.some((n) => header.includes(n))) warnings.push('a new column name collides with an existing header name — rename to avoid ambiguity');

    return {
      data: { output: toDelimited(out, det.delimiter), filename: 'column-split.csv', rows: out.length - 1, new_columns: newCols },
      warnings,
      change_log,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

// ─── jont_j032_excel-import-guard ──────────────────────────────────────────
// Neutralizes spreadsheet formula injection (=, +, -, @, TAB, CR prefixes)
// before a CSV is opened in Excel/Sheets — the classic CSV injection fix.

const excelImportGuard: JontEngine = {
  manifest: {
    id: 'jont_j032_excel-import-guard',
    pattern: 'fixer',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'CSV that will be opened in Excel/Sheets — sanitized locally' },
          strategy: { type: 'string', enum: ['prefix-quote', 'space'], description: 'prefix-quote prepends an apostrophe; space prepends a space (default prefix-quote)' },
        },
        required: ['csv'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'DR-A1', score: 7.33 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');
    const strategy = input.strategy === 'space' ? 'space' : 'prefix-quote';
    const guard = (cell: string): string => {
      const c = cell ?? '';
      if (/^[=+\-@\t\r]/.test(c)) {
        const prefix = strategy === 'space' ? ' ' : "'";
        return prefix + c;
      }
      return c;
    };

    const det = detectDelimiter(src);
    const rows = parseCsv(src, det.delimiter);
    let changed = 0;
    const change_log: Array<{ at: string; from?: string; to?: string; note?: string }> = [];
    const out = rows.map((row, ri) =>
      row.map((cell, ci) => {
        const fixed = guard(cell);
        if (fixed !== cell) {
          changed += 1;
          if (change_log.length < 25) change_log.push({ at: new Date().toISOString(), from: cell.slice(0, 30), to: fixed.slice(0, 30), note: `row ${ri + 1} col ${ci + 1} neutralized` });
        }
        return fixed;
      }),
    );

    if (changed === 0) warnings.push('no formula-looking cells found — nothing to guard (file is already safe)');
    else change_log.unshift({ at: new Date().toISOString(), note: `${changed} cell(s) started with = + - @ or TAB and were neutralized with the "${strategy}" strategy` });

    return {
      data: { output: toDelimited(out, det.delimiter), filename: 'excel-guarded.csv', rows: out.length - 1, cells_neutralized: changed },
      warnings,
      change_log,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

// ─── jont_j035_llm-json-cleaner ────────────────────────────────────────────
// Repairs the five classic ways LLM output breaks JSON.parse: markdown
// fences, prose around the object, trailing commas, smart quotes, comments.

const llmJsonCleaner: JontEngine = {
  manifest: {
    id: 'jont_j035_llm-json-cleaner',
    pattern: 'fixer',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          text: { type: 'string', format: 'textarea', description: 'the AI answer that should contain JSON — cleaned locally' },
        },
        required: ['text'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'DR-B1', score: 7.25 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    let src = String(input.text ?? '');
    if (!src.trim()) throw new Error('TEXT_BOX_EMPTY|paste the AI output first');
    const notes: string[] = [];

    // 1. markdown fences
    const fenced = /```(?:json)?\s*\n([\s\S]*?)\n```/i.exec(src);
    if (fenced) {
      src = fenced[1];
      notes.push('stripped markdown fence');
    }

    // 2. prose around the payload — take the outermost {...} or [...]
    const braceStart = src.indexOf('{');
    const bracketStart = src.indexOf('[');
    const start = braceStart === -1 ? bracketStart : bracketStart === -1 ? braceStart : Math.min(braceStart, bracketStart);
    if (start > 0) {
      src = src.slice(start);
      notes.push('cut prose before the JSON payload');
    }
    const endBrace = Math.max(src.lastIndexOf('}'), src.lastIndexOf(']'));
    if (endBrace !== -1 && endBrace < src.length - 1) {
      src = src.slice(0, endBrace + 1);
      notes.push('cut prose after the JSON payload');
    }

    // 3. smart quotes
    if (/[""]/.test(src)) {
      src = src.replace(/[""]/g, '"').replace(/['']/g, "'");
      notes.push('replaced smart quotes with straight quotes');
    }

    // 4. // and /* */ comments (outside strings — cheap heuristic: line-comment at line start or after whitespace)
    if (/(^|\s)\/\/|\/\*/.test(src)) {
      src = src.replace(/"(?:[^"\\]|\\.)*"|\/\/[^\n\r]*|\/\*[\s\S]*?\*\//g, (m) => (m.startsWith('"') ? m : ''));
      notes.push('removed // and /* */ comments');
    }

    // 5. trailing commas
    if (/,\s*([}\]])/.test(src)) {
      src = src.replace(/,(\s*[}\]])/g, '$1');
      notes.push('removed trailing commas');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(src);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      throw new Error(`STILL_BROKEN|automated repair failed (${msg}) — the damage is beyond fences/commas/quotes; the original text is unchanged`);
    }

    if (notes.length === 0) warnings.push('input already parsed clean — no repairs were needed');
    const change_log = notes.map((note) => ({ at: new Date().toISOString(), note }));

    return {
      data: {
        output: JSON.stringify(parsed, null, 2),
        filename: 'clean.json',
        repairs: notes,
        type: Array.isArray(parsed) ? 'array' : typeof parsed === 'object' && parsed !== null ? 'object' : 'scalar',
      },
      warnings,
      change_log,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

export const CLIENT_FIXER_ENGINES: JontEngine[] = [
  csvDelimiterFixer,
  csvCleaner,
  subtitleSyncOffsetFixer,
  csvColumnSplitRepair,
  excelImportGuard,
  llmJsonCleaner,
];
