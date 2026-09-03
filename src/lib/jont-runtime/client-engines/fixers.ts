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

export const CLIENT_FIXER_ENGINES: JontEngine[] = [
  csvDelimiterFixer,
  csvCleaner,
  subtitleSyncOffsetFixer,
];
