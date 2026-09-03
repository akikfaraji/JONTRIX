// Client-context converter engines — run entirely in the browser (VOL-11 §4).
// Every engine is deterministic (C5), zero-dependency, and returns the
// client-engine envelope: { output, filename, ...meta } (see index.ts).

import type { JontEngine, JontResult } from '../types';
import { parseCsv } from '../util';
import {
  detectDelimiter,
  flattenObject,
  inferScalar,
  toDelimited,
  unflattenObject,
} from './shared';

/* ------------------------------------------------------------------ */
/* j046 csv-to-json                                                    */
/* ------------------------------------------------------------------ */

const csvToJson: JontEngine = {
  manifest: {
    id: 'jont_j046_csv-to-json',
    pattern: 'converter',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'Paste the CSV content. Nothing is uploaded — parsing happens in your browser.' },
          header_row: { type: 'boolean', description: 'First row is a header row (default true).' },
          infer_types: { type: 'boolean', description: 'Convert numeric/boolean cells to JSON types (leading zeros stay text).' },
        },
        required: ['csv'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-JSON-csv-DV-B2', score: 7.1 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const csv = String(input.csv ?? '');
    if (!csv.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');
    const headerRow = input.header_row === undefined ? true : Boolean(input.header_row);
    const infer = input.infer_types === undefined ? true : Boolean(input.infer_types);

    const rows = parseCsv(csv);
    if (rows.length === 0) throw new Error('NO_ROWS|no rows found in the CSV');

    let headers: string[];
    let body: string[][];
    if (headerRow) {
      headers = rows[0].map((h, i) => {
        const name = h.trim() || `column_${i + 1}`;
        return name;
      });
      const seen = new Map<string, number>();
      headers = headers.map((name) => {
        const n = (seen.get(name) ?? 0) + 1;
        seen.set(name, n);
        return n === 1 ? name : `${name}_${n}`;
      });
      body = rows.slice(1);
    } else {
      const width = Math.max(...rows.map((r) => r.length));
      headers = Array.from({ length: width }, (_, i) => `column_${i + 1}`);
      body = rows;
    }

    const ragged = body.filter((r) => r.length !== headers.length).length;
    if (ragged > 0) warnings.push(`${ragged} row(s) had a different column count than the header; missing cells became null and extras were kept under overflow_N keys.`);

    const records = body.map((row) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        obj[h] = i < row.length ? (infer ? inferScalar(row[i]) : row[i]) : null;
      });
      // honest overflow keys for long rows
      if (row.length > headers.length) {
        row.slice(headers.length).forEach((cell, k) => {
          obj[`overflow_${k + 1}`] = infer ? inferScalar(cell) : cell;
        });
      }
      return obj;
    });

    return {
      data: {
        output: JSON.stringify(records, null, 2),
        filename: 'converted.json',
        records: records.length,
        columns: headers.length,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j027 json-to-csv-flatten                                            */
/* ------------------------------------------------------------------ */

const jsonToCsvFlatten: JontEngine = {
  manifest: {
    id: 'jont_j027_json-to-csv-flatten',
    pattern: 'converter',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          json: { type: 'string', format: 'textarea', description: 'JSON array of objects, a single object, or JSONL — parsed in your browser.' },
          delimiter: { type: 'string', enum: [',', ';', '\t', '|'], description: 'Output delimiter.' },
          array_join: { type: 'string', description: 'String used to join array values inside one cell (default ";").' },
        },
        required: ['json'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-JSON-json-DV-B2', score: 7.4 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.json ?? '').trim();
    if (!src) throw new Error('JSON_BOX_EMPTY|the JSON box is empty');
    const delimiter = typeof input.delimiter === 'string' && input.delimiter !== '' ? input.delimiter : ',';
    const joinWith = typeof input.array_join === 'string' && input.array_join !== '' ? input.array_join : ';';

    const records: Array<Record<string, unknown>> = [];
    if (src.startsWith('[')) {
      const parsed = JSON.parse(src) as unknown;
      if (!Array.isArray(parsed)) throw new Error('NOT_ARRAY|top-level JSON is not an array');
      for (const item of parsed) records.push((item ?? {}) as Record<string, unknown>);
    } else if (src.startsWith('{')) {
      const parsed = JSON.parse(src) as unknown;
      if (parsed !== null && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).items)) {
        for (const item of (parsed as Record<string, unknown>).items as unknown[]) records.push((item ?? {}) as Record<string, unknown>);
        warnings.push('Wrapped object with an "items" array was detected; exported the items array. Use raw JSON mode if you wanted the whole object flattened.');
      } else {
        records.push(parsed as Record<string, unknown>);
      }
    } else {
      // JSONL
      const lines = src.split('\n').map((l) => l.trim()).filter(Boolean);
      lines.forEach((line, i) => {
        try {
          records.push(JSON.parse(line) as Record<string, unknown>);
        } catch {
          warnings.push(`line ${i + 1} was not valid JSON and was skipped`);
        }
      });
      if (records.length === 0) throw new Error('NO_RECORDS|no valid JSON records found (expected an array, an object, or JSONL)');
    }

    const flat = records.map((r) => flattenObject(r, joinWith));
    const columns: string[] = [];
    for (const f of flat) for (const k of Object.keys(f)) if (!columns.includes(k)) columns.push(k);

    const rowsOut: Array<Array<string | number | boolean | null>> = [columns];
    for (const f of flat) rowsOut.push(columns.map((c) => (c in f ? f[c] : null)));

    const sparse = flat.filter((f) => Object.keys(f).length !== columns.length).length;
    if (sparse > 0) warnings.push(`${sparse} record(s) did not have every column; missing cells were left empty.`);

    return {
      data: {
        output: toDelimited(rowsOut, delimiter),
        filename: 'flattened.csv',
        rows: flat.length,
        columns: columns.length,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j055 json-jsonl-converter                                           */
/* ------------------------------------------------------------------ */

const jsonJsonlConverter: JontEngine = {
  manifest: {
    id: 'jont_j055_json-jsonl-converter',
    pattern: 'converter',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          input: { type: 'string', format: 'textarea', description: 'JSON or JSONL — the direction is auto-detected (a top-level array or object becomes JSONL; one JSON value per line becomes a JSON array).' },
          indent: { type: 'string', enum: ['2', '4', 'tab', 'minify'], description: 'Indentation for the JSON array result.' },
        },
        required: ['input'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'DV-B2', score: 6.98 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.input ?? '').trim();
    if (!src) throw new Error('INPUT_EMPTY|the input box is empty');

    const stringify = (value: unknown): string => {
      const indentOpt = input.indent;
      if (indentOpt === 'minify') return JSON.stringify(value);
      if (indentOpt === 'tab') return JSON.stringify(value, null, '\t');
      return JSON.stringify(value, null, indentOpt === '4' ? 4 : 2);
    };

    if (src.startsWith('[')) {
      const parsed = JSON.parse(src) as unknown;
      const list = Array.isArray(parsed) ? parsed : [parsed];
      return {
        data: {
          output: list.map((item) => JSON.stringify(item)).join('\n'),
          filename: 'converted.jsonl',
          records: list.length,
          direction: 'json → jsonl',
        },
        warnings,
        ms: Date.now() - started,
      } satisfies JontResult;
    }

    if (src.startsWith('{')) {
      // Single pretty-printed object parses whole; JSONL starting with '{' does not.
      try {
        const parsed = JSON.parse(src) as unknown;
        return {
          data: {
            output: JSON.stringify(parsed),
            filename: 'converted.jsonl',
            records: 1,
            direction: 'json → jsonl',
          },
          warnings,
          ms: Date.now() - started,
        } satisfies JontResult;
      } catch {
        // fall through to line-by-line JSONL mode
      }
    }

    const lines = src.split('\n').map((l) => l.trim()).filter(Boolean);
    const records: unknown[] = [];
    lines.forEach((line, i) => {
      try {
        records.push(JSON.parse(line) as unknown);
      } catch {
        warnings.push(`line ${i + 1} was not a complete JSON value and was skipped`);
      }
    });
    if (records.length === 0) throw new Error('NO_RECORDS|no valid JSON values found on any line');

    return {
      data: {
        output: stringify(records),
        filename: 'converted.json',
        records: records.length,
        direction: 'jsonl → json',
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j049 nested-json-csv                                                */
/* ------------------------------------------------------------------ */

const nestedJsonCsv: JontEngine = {
  manifest: {
    id: 'jont_j049_nested-json-csv',
    pattern: 'converter',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          input: { type: 'string', format: 'textarea', description: 'Nested JSON (dot-path keys are produced) or a CSV with dot-path headers — direction is auto-detected.' },
          delimiter: { type: 'string', enum: [',', ';', '\t', '|'], description: 'CSV delimiter for the CSV result.' },
          array_split: { type: 'string', description: 'When converting CSV back to JSON, arrays were joined with this string (default ";").' },
        },
        required: ['input'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'DR-B3', score: 7.03 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.input ?? '').trim();
    if (!src) throw new Error('INPUT_EMPTY|the input box is empty');
    const delimiter = typeof input.delimiter === 'string' && input.delimiter !== '' ? input.delimiter : ',';
    const splitOn = typeof input.array_split === 'string' && input.array_split !== '' ? input.array_split : ';';

    if (src.startsWith('[') || src.startsWith('{')) {
      const parsed = JSON.parse(src) as unknown;
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const flat = list.map((r) => flattenObject((r ?? {}) as Record<string, unknown>, splitOn));
      const columns: string[] = [];
      for (const f of flat) for (const k of Object.keys(f)) if (!columns.includes(k)) columns.push(k);
      const rows: Array<Array<string | number | boolean | null>> = [columns, ...flat.map((f) => columns.map((c) => (c in f ? f[c] : null)))];
      return {
        data: {
          output: toDelimited(rows, delimiter),
          filename: 'nested-flattened.csv',
          rows: flat.length,
          columns: columns.length,
          direction: 'json → csv (dot-path headers)',
        },
        warnings,
        ms: Date.now() - started,
      } satisfies JontResult;
    }

    const rows = parseCsv(src);
    if (rows.length < 2) throw new Error('NO_DATA|CSV needs a header row and at least one data row');
    const headers = rows[0];
    const records = rows.slice(1).map((r) => unflattenObject(
      Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])) as Record<string, string>,
      splitOn,
    ));
    return {
      data: {
        output: JSON.stringify(records, null, 2),
        filename: 'unflattened.json',
        records: records.length,
        direction: 'csv → json (dot-path headers expanded)',
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j065 json-to-typescript-go                                          */
/* ------------------------------------------------------------------ */

/** Field descriptor for deterministic type synthesis (j065). */
interface FieldDesc { kind: 'prim' | 'array' | 'struct'; prim?: 'string' | 'number' | 'boolean' | 'unknown'; elem?: FieldDesc; name?: string }
const UNKNOWN_FIELD: FieldDesc = { kind: 'prim', prim: 'unknown' };

function sameDesc(a: FieldDesc, b: FieldDesc): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'prim') return a.prim === b.prim;
  if (a.kind === 'struct') return a.name === b.name;
  return sameDesc(a.elem as FieldDesc, b.elem as FieldDesc);
}

function mergeDesc(a: FieldDesc | undefined, b: FieldDesc): FieldDesc {
  if (!a) return b;
  return sameDesc(a, b) ? a : UNKNOWN_FIELD;
}

function descIsUnknown(d: FieldDesc): boolean {
  if (d.kind === 'prim') return d.prim === 'unknown';
  if (d.kind === 'array') return descIsUnknown(d.elem as FieldDesc);
  return false;
}

function pascal(s: string): string {
  const cleaned = s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''));
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function synthStructs(
  samples: unknown[],
  rootName: string,
): Array<{ name: string; fields: Array<{ name: string; desc: FieldDesc }> }> {
  const types: Array<{ name: string; fields: Array<{ name: string; desc: FieldDesc }> }> = [];
  const counters = new Map<string, number>();
  const nameFor = (base: string): string => {
    const n = (counters.get(base) ?? 0) + 1;
    counters.set(base, n);
    return n === 1 ? base : `${base}${n}`;
  };

  function describe(v: unknown, base: string): FieldDesc {
    if (v === null || v === undefined) return UNKNOWN_FIELD;
    if (typeof v === 'string') return { kind: 'prim', prim: 'string' };
    if (typeof v === 'number') return { kind: 'prim', prim: 'number' };
    if (typeof v === 'boolean') return { kind: 'prim', prim: 'boolean' };
    if (Array.isArray(v)) {
      let elem: FieldDesc | undefined;
      for (const item of v) elem = mergeDesc(elem, describe(item, base.replace(/s$/, '')));
      return { kind: 'array', elem: elem ?? UNKNOWN_FIELD };
    }
    return { kind: 'struct', name: buildStruct([v], base) };
  }

  function buildStruct(list: unknown[], base: string): string {
    const name = nameFor(base);
    const fieldMap = new Map<string, FieldDesc>();
    for (const sample of list) {
      if (sample === null || typeof sample !== 'object' || Array.isArray(sample)) continue;
      for (const [k, v] of Object.entries(sample as Record<string, unknown>)) {
        fieldMap.set(k, mergeDesc(fieldMap.get(k), describe(v, pascal(k))));
      }
    }
    types.push({ name, fields: [...fieldMap.entries()].map(([fieldName, desc]) => ({ name: fieldName, desc })) });
    return name;
  }

  buildStruct(samples, rootName);
  return types;
}

function renderTs(desc: FieldDesc): string {
  if (desc.kind === 'struct') return desc.name as string;
  if (desc.kind === 'array') return `${renderTs(desc.elem as FieldDesc)}[]`;
  return desc.prim as string;
}

function renderGo(desc: FieldDesc): string {
  if (desc.kind === 'struct') return `*${desc.name as string}`;
  if (desc.kind === 'array') return `[]${renderGo(desc.elem as FieldDesc).replace(/^\*/, '')}`;
  switch (desc.prim) {
    case 'string': return 'string';
    case 'number': return 'float64';
    case 'boolean': return 'bool';
    default: return 'interface{}';
  }
}

function countUnknown(types: Array<{ name: string; fields: Array<{ name: string; desc: FieldDesc }> }>): number {
  let n = 0;
  for (const t of types) for (const f of t.fields) if (descIsUnknown(f.desc)) n++;
  return n;
}

const jsonToTypescriptGo: JontEngine = {
  manifest: {
    id: 'jont_j065_json-to-typescript-go',
    pattern: 'converter',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          json: { type: 'string', format: 'textarea', description: 'JSON object or array of objects — analyzed in your browser.' },
          root_name: { type: 'string', description: 'Name for the root type (default "Root").' },
          target: { type: 'string', enum: ['typescript', 'go'], description: 'Generate TypeScript interfaces or Go structs.' },
        },
        required: ['json'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-JSON-json-DV-B14', score: 6.85 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.json ?? '').trim();
    if (!src) throw new Error('JSON_BOX_EMPTY|the JSON box is empty');
    const parsed = JSON.parse(src) as unknown;
    const list = Array.isArray(parsed) ? parsed : [parsed];
    const rootName0 = typeof input.root_name === 'string' && input.root_name.trim() !== '' ? input.root_name.trim() : 'Root';
    const rootName = pascal(rootName0);
    const target = input.target === 'go' ? 'go' : 'typescript';

    const types = synthStructs(list, rootName);
    const lines: string[] = [];

    if (target === 'typescript') {
      for (const t of types) {
        lines.push(`export interface ${t.name} {`);
        for (const f of t.fields) {
          lines.push(`  ${JSON.stringify(f.name)}: ${renderTs(f.desc)};`);
        }
        lines.push('}');
        lines.push('');
      }
      lines.pop();
    } else {
      for (const t of types) {
        lines.push(`type ${t.name} struct {`);
        for (const f of t.fields) {
          lines.push(`\t${pascal(f.name)} ${renderGo(f.desc)} \`json:"${f.name}"\``);
        }
        lines.push('}');
        lines.push('');
      }
      lines.pop();
    }

    const unknownCount = countUnknown(types);
    if (unknownCount > 0) {
      warnings.push(`${unknownCount} field(s) mixed incompatible types or were empty; they were declared as unknown/interface{}. Check them by hand.`);
    }

    return {
      data: {
        output: lines.join('\n'),
        filename: target === 'go' ? 'types.go' : 'types.ts',
        target,
        types: types.length,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j026 sql-dialect-migrator                                           */
/* ------------------------------------------------------------------ */

interface SqlRewrite { re: RegExp; to: string | ((...m: string[]) => string); note: string }

const MYSQL_TO_PG: SqlRewrite[] = [
  { re: /`/g, to: '"', note: 'backtick identifiers → double-quoted' },
  { re: /\bAUTO_INCREMENT\b/gi, to: 'SERIAL', note: 'AUTO_INCREMENT → SERIAL' },
  { re: /\bTINYINT\(1\)/gi, to: 'BOOLEAN', note: 'TINYINT(1) → BOOLEAN' },
  { re: /\bUNSIGNED\s+/gi, to: '', note: 'UNSIGNED removed' },
  { re: /\)\s*ENGINE=\S+(\s*(DEFAULT\s+)?CHARSET=\S+)?(\s*COLLATE=\S+)?/gi, to: ')', note: 'MySQL table options (ENGINE/CHARSET/COLLATE) removed' },
  { re: /\bIFNULL\(/gi, to: 'COALESCE(', note: 'IFNULL → COALESCE' },
  { re: /\bNOW\(\)/gi, to: 'CURRENT_TIMESTAMP', note: 'NOW() → CURRENT_TIMESTAMP' },
  { re: /\bLIMIT\s+(\d+)\s*,\s*(\d+)/gi, to: (_m: string, skip: string, take: string) => `LIMIT ${take} OFFSET ${skip}`, note: 'LIMIT skip,take → LIMIT take OFFSET skip' },
  { re: /\bON DUPLICATE KEY UPDATE\b/gi, to: 'ON CONFLICT DO UPDATE', note: 'ON DUPLICATE KEY UPDATE → ON CONFLICT DO UPDATE (add conflict target)' },
  { re: /\bCONCAT\(([^()]*)\)/gi, to: (_m: string, args: string) => args.split(',').map((a) => a.trim()).join(' || '), note: 'CONCAT(a,b) → a || b' },
];

const PG_TO_MYSQL: SqlRewrite[] = [
  { re: /"/g, to: '`', note: 'double-quoted identifiers → backticks' },
  { re: /\bSERIAL\b/gi, to: 'INT AUTO_INCREMENT', note: 'SERIAL → INT AUTO_INCREMENT' },
  { re: /\bBIGSERIAL\b/gi, to: 'BIGINT AUTO_INCREMENT', note: 'BIGSERIAL → BIGINT AUTO_INCREMENT' },
  { re: /\bCOALESCE\(/gi, to: 'IFNULL(', note: 'COALESCE(2-arg common case) → IFNULL (verify arg counts)' },
  { re: /\bCURRENT_TIMESTAMP\b/gi, to: 'NOW()', note: 'CURRENT_TIMESTAMP → NOW()' },
  { re: /\bILIKE\b/gi, to: 'LIKE', note: 'ILIKE → LIKE (MySQL has no case-insensitive LIKE; verify collation)' },
  { re: /::([a-z]+)/gi, to: (_m: string, t: string) => ` /* CAST AS ${t.toUpperCase()} */ `, note: 'PostgreSQL :: casts are not valid MySQL — replaced with a comment to fix by hand' },
  { re: /\bRETURNING\b.*$/gim, to: '', note: 'RETURNING clause removed (not supported in MySQL)' },
  { re: /\bSTRING_AGG\(/gi, to: 'GROUP_CONCAT(', note: 'STRING_AGG → GROUP_CONCAT (check ORDER BY/SEPARATOR args)' },
];

const sqlDialectMigrator: JontEngine = {
  manifest: {
    id: 'jont_j026_sql-dialect-migrator',
    pattern: 'converter',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          sql: { type: 'string', format: 'textarea', description: 'Schema or query SQL — rewritten locally, never uploaded.' },
          direction: { type: 'string', enum: ['mysql→postgresql', 'postgresql→mysql'], description: 'Migration direction.' },
        },
        required: ['sql', 'direction'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'DV-B10', score: 7.4 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.sql ?? '');
    if (!src.trim()) throw new Error('SQL_BOX_EMPTY|the SQL box is empty');
    const direction = input.direction === 'postgresql→mysql' ? 'postgresql→mysql' : 'mysql→postgresql';
    const rewrites = direction === 'mysql→postgresql' ? MYSQL_TO_PG : PG_TO_MYSQL;

    let out = src;
    const change_log: Array<{ at: string; note: string }> = [];
    for (const r of rewrites) {
      const global = new RegExp(r.re.source, r.re.flags.includes('g') ? r.re.flags : r.re.flags + 'g');
      const matches = out.match(global);
      if (!matches) continue;
      out = out.replace(global, r.to as string);
      change_log.push({ at: `${matches.length}x`, note: r.note });
    }

    if (direction === 'mysql→postgresql') {
      if (/\bENUM\(/i.test(out)) warnings.push('MySQL ENUM columns have no PostgreSQL equivalent — convert them to a CHECK constraint or a lookup table.');
      if (/\bINSERT IGNORE\b/i.test(out)) warnings.push('INSERT IGNORE has no direct equivalent — consider ON CONFLICT DO NOTHING.');
    } else {
      if (/\bDISTINCT ON\b/i.test(out)) warnings.push('DISTINCT ON is PostgreSQL-only — rewrite with a window function or GROUP BY.');
      if (/->>|->/i.test(out)) warnings.push('PostgreSQL JSON operators (->> / ->) have no MySQL equivalent — use JSON_EXTRACT.');
    }

    return {
      data: {
        output: out,
        filename: `migrated-${direction.includes('→postgresql') ? 'postgresql' : 'mysql'}.sql`,
        direction,
        rewrites_applied: change_log.length,
      },
      warnings,
      change_log,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j015 csv-splitter                                                   */
/* ------------------------------------------------------------------ */

const csvSplitter: JontEngine = {
  manifest: {
    id: 'jont_j015_csv-splitter',
    pattern: 'converter',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv: { type: 'string', format: 'textarea', description: 'CSV to split — processed in your browser, nothing uploaded.' },
          chunk_rows: { type: 'number', description: 'Data rows per chunk (default 1000).' },
          keep_header: { type: 'boolean', description: 'Repeat the header row in every chunk (default true).' },
        },
        required: ['csv'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-CSV-split-DR-B2', score: 7.6 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.csv ?? '');
    if (!src.trim()) throw new Error('CSV_BOX_EMPTY|the CSV box is empty');
    const chunkRows = Math.max(1, Math.floor(Number(input.chunk_rows) || 1000));
    const keepHeader = input.keep_header === undefined ? true : Boolean(input.keep_header);

    const detected = detectDelimiter(src);
    const rows = parseCsv(src, detected.delimiter);
    if (rows.length === 0) throw new Error('NO_ROWS|no rows found');
    const hasHeader = keepHeader && rows.length > 1;
    const header = hasHeader ? rows[0] : null;
    const body = hasHeader ? rows.slice(1) : rows;

    const parts: Array<{ filename: string; content: string; rows: number }> = [];
    for (let i = 0; i < body.length; i += chunkRows) {
      const slice = body.slice(i, i + chunkRows);
      const content = toDelimited(header ? [header, ...slice] : slice, detected.delimiter);
      parts.push({
        filename: `part-${String(parts.length + 1).padStart(3, '0')}.csv`,
        content,
        rows: slice.length,
      });
    }

    return {
      data: {
        output: `Split into ${parts.length} file(s) of up to ${chunkRows} rows each. Download each part below.`,
        parts,
        filename: null,
        total_rows: body.length,
        parts_count: parts.length,
        detected_delimiter: detected.delimiter === '\t' ? 'tab' : detected.delimiter,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

/* ------------------------------------------------------------------ */
/* j068 csv-merger                                                     */
/* ------------------------------------------------------------------ */

const csvMerger: JontEngine = {
  manifest: {
    id: 'jont_j068_csv-merger',
    pattern: 'converter',
    context: 'client',
    io: {
      input: {
        type: 'object',
        properties: {
          csv_a: { type: 'string', format: 'textarea', description: 'First CSV.' },
          csv_b: { type: 'string', format: 'textarea', description: 'Second CSV.' },
          mode: { type: 'string', enum: ['stack', 'join'], description: 'Stack rows on top of each other, or inner-join on a shared key column.' },
          key_column: { type: 'string', description: 'Join mode: header name of the key column (must exist in both files).' },
        },
        required: ['csv_a', 'csv_b', 'mode'],
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: false,
    evidence: { problem_row: 'GT-CSV-merge-DR-B2', score: 6.8 },
  },
  run(input) {
    const started = Date.now();
    const warnings: string[] = [];
    const a = String(input.csv_a ?? '');
    const b = String(input.csv_b ?? '');
    if (!a.trim() || !b.trim()) throw new Error('INPUT_EMPTY|both CSV boxes are required');
    const mode = input.mode === 'join' ? 'join' : 'stack';

    const detA = detectDelimiter(a);
    const detB = detectDelimiter(b);
    if (detA.delimiter !== detB.delimiter) warnings.push(`the two files use different delimiters (${show(detA.delimiter)} vs ${show(detB.delimiter)}); file B was re-parsed with ${show(detA.delimiter)} — check the result`);
    const rowsA = parseCsv(a, detA.delimiter);
    const rowsB = parseCsv(b, detA.delimiter);
    if (rowsA.length === 0 || rowsB.length === 0) throw new Error('NO_ROWS|one of the files has no rows');

    let merged: string;
    let outRows = 0;

    if (mode === 'stack') {
      const headA = rowsA[0];
      const headB = rowsB[0];
      const columns = [...headA];
      for (const h of headB) if (!columns.includes(h)) columns.push(h);
      if (headA.join('\u0000') !== headB.join('\u0000')) {
        warnings.push('headers differ — missing cells were left empty (union of both headers, file A order first)');
      }
      const mapRow = (row: string[], head: string[]): Array<string | number | null> =>
        columns.map((c) => {
          const idx = head.indexOf(c);
          return idx >= 0 ? row[idx] ?? null : null;
        });
      const rowsOut: Array<Array<string | number | null>> = [columns];
      for (const r of rowsA.slice(1)) rowsOut.push(mapRow(r, headA));
      for (const r of rowsB.slice(1)) rowsOut.push(mapRow(r, headB));
      outRows = rowsOut.length - 1;
      merged = toDelimited(rowsOut, detA.delimiter);
    } else {
      const key = String(input.key_column ?? '').trim();
      const headA = rowsA[0];
      const headB = rowsB[0];
      if (!key) throw new Error('KEY_REQUIRED|join mode needs the key_column argument (a header present in both files)');
      const idxA = headA.indexOf(key);
      const idxB = headB.indexOf(key);
      if (idxA < 0 || idxB < 0) throw new Error('KEY_MISSING|key column not found in one of the files');
      const indexB = new Map<string, string[]>();
      for (const r of rowsB.slice(1)) {
        const k = r[idxB];
        if (!indexB.has(k)) indexB.set(k, r);
      }
      const bExtra = [...headB.slice(0, idxB), ...headB.slice(idxB + 1)];
      const columns = [...headA, ...bExtra];
      const rowsOut: Array<Array<string | number | null>> = [columns];
      let matched = 0;
      for (const r of rowsA.slice(1)) {
        const hit = indexB.get(r[idxA]);
        if (!hit) continue;
        matched++;
        const bRow = [...hit.slice(0, idxB), ...hit.slice(idxB + 1)];
        rowsOut.push([...r, ...bRow]);
      }
      outRows = rowsOut.length - 1;
      if (matched < rowsA.length - 1) warnings.push(`${rowsA.length - 1 - matched} row(s) from file A had no match in B and were dropped (inner join)`);
      merged = toDelimited(rowsOut, detA.delimiter);
    }

    return {
      data: {
        output: merged,
        filename: 'merged.csv',
        mode,
        rows: outRows,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

function show(d: string): string {
  return d === '\t' ? 'tab' : d === '|' ? 'pipe' : `"${d}"`;
}

export const CLIENT_CONVERTER_ENGINES: JontEngine[] = [
  csvToJson,
  jsonToCsvFlatten,
  jsonJsonlConverter,
  nestedJsonCsv,
  jsonToTypescriptGo,
  sqlDialectMigrator,
  csvSplitter,
  csvMerger,
];
