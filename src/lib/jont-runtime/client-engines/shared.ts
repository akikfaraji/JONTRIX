// Shared deterministic helpers for client engines. Zero dependencies —
// everything here runs identically in the browser and under node (tests).

import { parseCsv } from '../util';

/** CSV serializer that quotes against the delimiter actually in use. */
export function toDelimited(
  rows: Array<Array<string | number | boolean | null>>,
  delimiter = ',',
): string {
  const needsQuote = new RegExp(`["\\n\\r${escapeRe(delimiter)}]`);
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = cell === null || cell === undefined ? '' : String(cell);
          return needsQuote.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(delimiter),
    )
    .join('\n');
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const DELIMITERS = [',', ';', '\t', '|'] as const;

/** Score candidate delimiters by field-count consistency across sample lines. */
export function detectDelimiter(text: string): { delimiter: string; consistency: number } {
  const sample = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim() !== '').slice(0, 50);
  let best = { delimiter: ',', consistency: -1 };
  for (const d of DELIMITERS) {
    const counts = sample.map((line) => countOutsideQuotes(line, d));
    if (Math.max(...counts, 0) < 1) continue; // delimiter absent
    const mode = modeOf(counts);
    const consistent = counts.filter((c) => c === mode).length;
    const consistency = consistent / counts.length;
    // Prefer the most consistent; break ties toward the higher field count.
    if (consistency > best.consistency || (consistency === best.consistency && mode > 1)) {
      best = { delimiter: d, consistency };
    }
  }
  return best;
}

function countOutsideQuotes(line: string, delimiter: string): number {
  let inQuotes = false;
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === delimiter && !inQuotes) count++;
  }
  return count;
}

function modeOf(values: number[]): number {
  const tally = new Map<number, number>();
  for (const v of values) tally.set(v, (tally.get(v) ?? 0) + 1);
  let mode = 0;
  let modeCount = -1;
  for (const [v, c] of tally) {
    if (c > modeCount || (c === modeCount && v > mode)) {
      mode = v;
      modeCount = c;
    }
  }
  return mode;
}

/** Conservative scalar inference: numbers keep leading zeros and huge digits as strings. */
export function inferScalar(s: string): string | number | boolean | null {
  const t = s.trim();
  if (t === '') return null;
  if (/^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(t) && !/^0\d/.test(t) && t.replace(/[^0-9]/g, '').length <= 15) {
    const n = Number(t);
    if (Number.isFinite(n)) return n;
  }
  return s;
}

/** Flatten nested objects into dot-path keys; arrays are joined by `joinWith`. */
export function flattenObject(
  value: Record<string, unknown>,
  joinWith = ';',
  prefix = '',
  out: Record<string, string | number | boolean | null> = {},
): Record<string, string | number | boolean | null> {
  for (const [key, v] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v as Record<string, unknown>, joinWith, path, out);
    } else if (Array.isArray(v)) {
      out[path] = v
        .map((item) => (item !== null && typeof item === 'object' ? JSON.stringify(item) : String(item)))
        .join(joinWith);
    } else {
      out[path] = (v === undefined ? null : v) as string | number | boolean | null;
    }
  }
  return out;
}

/** Expand dot-path keys back into nested objects; `splitOn` re-splits joined arrays. */
export function unflattenObject(
  flat: Record<string, string | number | boolean | null>,
  splitOn?: string,
): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.');
    let node: Record<string, unknown> = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
      node = node[key] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (typeof value === 'string' && splitOn && value.includes(splitOn)) {
      node[last] = value.split(splitOn).map((item) => {
        const t = item.trim();
        if (t.startsWith('{') || t.startsWith('[')) {
          try {
            return JSON.parse(t) as unknown;
          } catch {
            return t;
          }
        }
        return inferScalar(t);
      });
    } else {
      node[last] = typeof value === 'string' ? inferScalar(value) : value;
    }
  }
  return root;
}

/** Deep equality via canonical stringification. */
export function deepEqual(a: unknown, b: unknown): boolean {
  return stable(a) === stable(b);
}

function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`);
  return `{${entries.join(',')}}`;
}

/** Collect dot-paths of every leaf in a JSON value (arrays report indices). */
export function leafPaths(value: unknown, prefix = '', out: Array<{ path: string; value: unknown }> = []): Array<{ path: string; value: unknown }> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      leafPaths(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else if (Array.isArray(value)) {
    // whole-array leaf: diffs report arrays as single units (deterministic)
    if (prefix) out.push({ path: prefix, value });
  } else {
    out.push({ path: prefix, value });
  }
  return out;
}

/** SRT timestamp → ms. */
export function srtTimeToMs(ts: string): number | null {
  const m = /^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/.exec(ts.trim());
  if (!m) return null;
  return (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * 1000 + Number(m[4]);
}

/** ms → SRT timestamp (clamped at zero). */
export function msToSrtTime(ms: number): string {
  const clamped = Math.max(0, ms);
  const h = Math.floor(clamped / 3600000);
  const m = Math.floor((clamped % 3600000) / 60000);
  const s = Math.floor((clamped % 60000) / 1000);
  const msec = clamped % 1000;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msec, 3)}`;
}

export { parseCsv };
