// Converter-pattern engines — VOL-11 §3: bytes/text → bytes/text via
// parsing + re-serializing. Identical inputs produce byte-identical outputs.

import type { JontEngine, JontResult } from '../types';
import { fnv1a, seededShuffle, seededRandom, parseCsv, toCsv, splitCells } from '../util';

// ─── jont_j045_study-deck-converter ────────────────────────────────────────

export const studyDeckConverter: JontEngine = {
  manifest: {
    id: 'jont_j045_study-deck-converter',
    pattern: 'converter',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', description: 'deck lines: "term - definition" (or custom separator)' },
          separator: { type: 'string', description: 'term/definition separator (default "-")' },
          to: { type: 'string', enum: ['csv', 'json', 'anki_tsv'], description: 'output format' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p45', score: 7.0 },
  },
  run(input): JontResult {
    const text = String(input.text ?? '');
    const sep = input.separator === undefined ? '-' : String(input.separator);
    const to = String(input.to ?? 'csv');
    const warnings: string[] = [];
    const cards: Array<{ term: string; definition: string }> = [];

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf(sep);
      if (idx === -1) {
        warnings.push(`line skipped (no "${sep}" separator): "${trimmed.slice(0, 40)}"`);
        continue;
      }
      const term = trimmed.slice(0, idx).trim();
      const definition = trimmed.slice(idx + sep.length).trim();
      if (!term || !definition) {
        warnings.push(`line skipped (empty side): "${trimmed.slice(0, 40)}"`);
        continue;
      }
      cards.push({ term, definition });
    }

    let output_text = '';
    if (to === 'json') {
      output_text = JSON.stringify(cards, null, 2);
    } else if (to === 'anki_tsv') {
      output_text = cards.map((c) => `${c.term}\t${c.definition}`).join('\n');
    } else {
      output_text = toCsv([['term', 'definition'], ...cards.map((c) => [c.term, c.definition])]);
    }

    return {
      data: { format: to, cards: cards.length, output_text },
      warnings,
      ms: 0,
    };
  },
};

// ─── jont_j083_wedding-guest-list-planner ──────────────────────────────────

export const weddingGuestListPlanner: JontEngine = {
  manifest: {
    id: 'jont_j083_wedding-guest-list-planner',
    pattern: 'converter',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['guests_csv'],
        properties: {
          guests_csv: { type: 'string', description: 'CSV: name, side (bride/groom/both), category, plus_ones' },
          seats_per_table: { type: 'number', description: 'table size (default 8)' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p83', score: 7.0 },
  },
  run(input): JontResult {
    const csv = String(input.guests_csv ?? '');
    const seats = input.seats_per_table === undefined ? 8 : Math.max(2, Number(input.seats_per_table));
    const rows = parseCsv(csv);
    if (rows.length < 2) {
      return { data: {}, warnings: ['no guest rows parsed — expected CSV with a header'], ms: 0 };
    }
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name: string) => header.findIndex((h) => h.includes(name));
    const nameIdx = col('name');
    const sideIdx = col('side');
    const catIdx = col('categor');
    const plusIdx = col('plus');
    if (nameIdx === -1) {
      return { data: {}, warnings: ['no "name" column found in header'], ms: 0 };
    }

    const guests: Array<{ name: string; side: string; category: string; plus_ones: number }> = [];
    const warnings: string[] = [];
    for (let i = 1; i < rows.length; i++) {
      const name = (rows[i][nameIdx] ?? '').trim();
      if (!name) continue;
      const side = sideIdx >= 0 ? (rows[i][sideIdx] ?? 'both').trim() : 'both';
      const category = catIdx >= 0 ? (rows[i][catIdx] ?? 'guest').trim() : 'guest';
      const plus = plusIdx >= 0 ? Number((rows[i][plusIdx] ?? '0').trim()) || 0 : 0;
      guests.push({ name, side, category, plus_ones: plus });
    }

    const sum = (arr: typeof guests) => arr.reduce((acc, g) => acc + 1 + g.plus_ones, 0);
    const bySide: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const g of guests) {
      bySide[g.side] = (bySide[g.side] ?? 0) + 1 + g.plus_ones;
      byCategory[g.category] = (byCategory[g.category] ?? 0) + 1 + g.plus_ones;
    }
    const totalSeats = sum(guests);
    const tableCount = Math.ceil(totalSeats / seats);
    const plusOnes = guests.reduce((acc, g) => acc + g.plus_ones, 0);
    if (plusOnes > 0 && plusIdx === -1) warnings.push('no plus_ones column found');

    const lines: string[] = [
      '# Guest list summary',
      '',
      `- Guests: ${guests.length} (head count incl. plus-ones: ${totalSeats})`,
      `- Plus-ones: ${plusOnes}`,
      `- By side: ${Object.entries(bySide).map(([k, v]) => `${k} ${v}`).join(', ')}`,
      `- By category: ${Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`,
      `- Tables needed: ${tableCount} × ${seats} seats (${totalSeats} seats required)`,
      '',
    ];

    return {
      data: {
        guests: guests.length,
        head_count: totalSeats,
        plus_ones: plusOnes,
        by_side: bySide,
        by_category: byCategory,
        tables_needed: tableCount,
        seats_per_table: seats,
        summary_markdown: lines.join('\n'),
      },
      warnings,
      ms: 0,
    };
  },
};

// ─── jont_j119_flashcard-data-portability ──────────────────────────────────

type DeckFormat = 'csv' | 'tsv' | 'json' | 'anki';

function deckToCards(text: string, from: DeckFormat): Array<{ term: string; definition: string }> {
  if (from === 'json') {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) throw new Error('JSON must be an array of {term, definition}');
    return (parsed as Array<Record<string, unknown>>).map((row) => ({
      term: String(row.term ?? row.front ?? ''),
      definition: String(row.definition ?? row.back ?? ''),
    }));
  }
  const delimiter = from === 'tsv' || from === 'anki' ? '\t' : ',';
  const rows = parseCsv(text, delimiter);
  const out: Array<{ term: string; definition: string }> = [];
  const start = rows.length > 0 && /^(term|front)$/i.test(rows[0][0]?.trim()) ? 1 : 0;
  for (let i = start; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length >= 2 && cells[0].trim() && cells[1].trim()) {
      out.push({ term: cells[0].trim(), definition: cells[1].trim() });
    }
  }
  return out;
}

function cardsToFormat(cards: Array<{ term: string; definition: string }>, to: DeckFormat): string {
  if (to === 'json') return JSON.stringify(cards, null, 2);
  if (to === 'anki' || to === 'tsv') return cards.map((c) => `${c.term}\t${c.definition}`).join('\n');
  return toCsv([['term', 'definition'], ...cards.map((c) => [c.term, c.definition])]);
}

export const flashcardDataPortability: JontEngine = {
  manifest: {
    id: 'jont_j119_flashcard-data-portability',
    pattern: 'converter',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['data', 'from', 'to'],
        properties: {
          data: { type: 'string', description: 'deck contents' },
          from: { type: 'string', enum: ['csv', 'tsv', 'json', 'anki'] },
          to: { type: 'string', enum: ['csv', 'tsv', 'json', 'anki'] },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p119', score: 7.0 },
  },
  run(input): JontResult {
    const from = String(input.from) as DeckFormat;
    const to = String(input.to) as DeckFormat;
    const warnings: string[] = [];
    let cards: Array<{ term: string; definition: string }>;
    try {
      cards = deckToCards(String(input.data ?? ''), from);
    } catch (e) {
      return { data: {}, warnings: [`parse as ${from} failed: ${(e as Error).message}`], ms: 0 };
    }
    const empty = cards.filter((c) => !c.term || !c.definition).length;
    if (empty > 0) warnings.push(`${empty} card(s) had an empty side`);
    cards = cards.filter((c) => c.term && c.definition);
    return {
      data: { from, to, cards: cards.length, output_text: cardsToFormat(cards, to) },
      warnings,
      ms: 0,
    };
  },
};

// ─── jont_j168_chatgpt-conversation-export-backup-mess ─────────────────────

interface ChatGptNode {
  message?: {
    author?: { role?: string };
    content?: { parts?: unknown[]; content_type?: string };
    create_time?: number;
  };
  children?: string[];
}

export const chatgptExportConverter: JontEngine = {
  manifest: {
    id: 'jont_j168_chatgpt-conversation-export-backup-mess',
    pattern: 'converter',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['export_json'],
        properties: {
          export_json: { type: 'string', description: 'conversations.json export (full backup or single conversation object)' },
          index: { type: 'number', description: 'which conversation to convert (default 0)' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p168', score: 7.0 },
  },
  run(input): JontResult {
    const warnings: string[] = [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(input.export_json ?? ''));
    } catch (e) {
      return { data: {}, warnings: [`JSON parse failed: ${(e as Error).message}`], ms: 0 };
    }
    let conversations: Array<Record<string, unknown>>;
    if (Array.isArray(parsed)) conversations = parsed as Array<Record<string, unknown>>;
    else if (parsed && typeof parsed === 'object') conversations = [parsed as Record<string, unknown>];
    else {
      return { data: {}, warnings: ['expected an array of conversations or a single conversation object'], ms: 0 };
    }
    if (conversations.length === 0) return { data: {}, warnings: ['no conversations in export'], ms: 0 };

    const idx = input.index === undefined ? 0 : Math.max(0, Number(input.index));
    if (idx >= conversations.length) {
      return { data: {}, warnings: [`index ${idx} out of range — export holds ${conversations.length} conversation(s)`], ms: 0 };
    }
    const conv = conversations[idx];
    const title = String(conv.title ?? 'Untitled conversation');
    const mapping = (conv.mapping ?? {}) as Record<string, ChatGptNode>;
    const rootKey = Object.keys(mapping).find((k) => mapping[k] && !('message' in mapping[k] && mapping[k].message)) ?? Object.keys(mapping)[0];

    // deterministic walk: follow first child chain, then sibling children in order
    const order: string[] = [];
    const seen = new Set<string>();
    const stack: string[] = [rootKey];
    while (stack.length > 0) {
      const key = stack.shift()!;
      if (seen.has(key)) continue;
      seen.add(key);
      const node = mapping[key];
      if (!node) continue;
      if (node.message) order.push(key);
      const kids = node.children ?? [];
      for (let i = kids.length - 1; i >= 0; i--) stack.unshift(kids[i]);
    }

    const lines: string[] = [`# ${title}`, ''];
    let turns = 0;
    for (const key of order) {
      const msg = mapping[key].message;
      if (!msg) continue;
      const role = String(msg.author?.role ?? 'unknown');
      if (role === 'system') continue;
      const parts = (msg.content?.parts ?? []).filter((p) => typeof p === 'string');
      const text = parts.join('\n').trim();
      if (!text) continue;
      turns++;
      lines.push(`## ${role === 'assistant' ? 'Assistant' : role === 'user' ? 'User' : role}`);
      lines.push('');
      lines.push(text);
      lines.push('');
    }
    if (turns === 0) warnings.push('no user/assistant text turns found');

    return {
      data: { title, turns, markdown: lines.join('\n') },
      warnings,
      ms: 0,
    };
  },
};

// ─── jont_j173_seating-charts-random-group-makers ──────────────────────────

export const seatingChartsRandomGroupMaker: JontEngine = {
  manifest: {
    id: 'jont_j173_seating-charts-random-group-makers',
    pattern: 'converter',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['names', 'group_size'],
        properties: {
          names: { type: 'array', items: { type: 'string' }, description: 'participant names' },
          group_size: { type: 'number', description: 'target group size (2-12)' },
          seed: { type: 'number', description: 'deterministic shuffle seed' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p173', score: 7.0 },
  },
  run(input): JontResult {
    const names = (Array.isArray(input.names) ? (input.names as unknown[]) : []).map(String).filter((n) => n.trim());
    const size = Math.max(2, Math.min(12, Number(input.group_size ?? 4)));
    const seed = input.seed === undefined ? 1 : Number(input.seed);
    if (names.length === 0) return { data: {}, warnings: ['no names provided'], ms: 0 };

    const rand = seededRandom(fnv1a(names.join('|') + ':' + seed));
    const shuffled = seededShuffle(names, rand);
    const groupCount = Math.ceil(shuffled.length / size);
    const groups: string[][] = Array.from({ length: groupCount }, () => []);
    // round-robin deal keeps sizes within 1 of each other
    shuffled.forEach((name, i) => groups[i % groupCount].push(name));

    const lines: string[] = ['# Groups', ''];
    groups.forEach((g, i) => {
      lines.push(`**Group ${i + 1}** (${g.length}): ${g.join(', ')}`);
    });

    return {
      data: { groups: groups.map((members, i) => ({ number: i + 1, members })), markdown: lines.join('\n') },
      warnings: [],
      ms: 0,
    };
  },
};

// ─── jont_j203_sql-query-explainer ─────────────────────────────────────────

export const sqlQueryExplainer: JontEngine = {
  manifest: {
    id: 'jont_j203_sql-query-explainer',
    pattern: 'converter',
    context: 'server',
    io: {
      input: { type: 'object', required: ['query'], properties: { query: { type: 'string', description: 'a single SQL statement' } } },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p203', score: 7.0 },
  },
  run(input): JontResult {
    const query = String(input.query ?? '').trim().replace(/;+\s*$/, '');
    const warnings: string[] = [];
    const upper = query.toUpperCase();

    // statement type
    const typeMatch = /^\s*(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|DROP|EXPLAIN)\b/.exec(upper);
    const kind = typeMatch ? typeMatch[1] : 'UNKNOWN';
    if (kind === 'UNKNOWN') warnings.push('could not identify the statement type — explainer covers SELECT/INSERT/UPDATE/DELETE/WITH/DDL');

    // SELECT list
    const selectMatch = /SELECT\s+([\s\S]*?)\s+FROM\s+/i.exec(query);
    const selectList = selectMatch ? selectMatch[1] : '';
    if (/(^|,)\s*\*\s*(,|$)/.test(selectList) || selectList.trim() === '*') {
      warnings.push('SELECT * — pulls every column; breaks column-pruning, covers, and API stability');
    }

    // tables
    const fromMatch = /\bFROM\s+([a-zA-Z_][\w.]*)/i.exec(query);
    const tables: string[] = [];
    if (fromMatch) tables.push(fromMatch[1]);
    const joinMatches = [...query.matchAll(/\b(?:INNER\s+|LEFT\s+|RIGHT\s+|FULL\s+|CROSS\s+)?JOIN\s+([a-zA-Z_][\w.]*)/gi)];
    for (const j of joinMatches) tables.push(j[1]);

    // joins without ON
    if (/\bJOIN\b/i.test(query) && !/\bON\b/i.test(query) && !/\bUSING\b/i.test(query)) {
      warnings.push('JOIN without ON/USING — will produce a cartesian product unless the ON clause is missing by mistake');
    }

    // WHERE
    const hasWhere = /\bWHERE\b/i.test(query);
    if (kind === 'DELETE' && !hasWhere) warnings.push('DELETE without WHERE — removes every row (documented footgun)');
    if (kind === 'UPDATE' && !hasWhere) warnings.push('UPDATE without WHERE — rewrites every row');
    if (kind === 'SELECT' && tables.length > 0 && !hasWhere) {
      warnings.push('no WHERE clause — full table scan of ' + tables.join(', '));
    }

    // LIMIT
    const hasLimit = /\bLIMIT\b|\bTOP\b\s|\bFETCH\s+FIRST\b/i.test(query);
    if (kind === 'SELECT' && !hasLimit && !/[Aa]GGREGATE|COUNT\s*\(|SUM\s*\(/.test(query)) {
      warnings.push('no LIMIT/TOP — unbounded result set on an interactive path');
    }

    // comma joins
    const fromClause = query.match(/\bFROM\s([\s\S]*?)(\bWHERE\b|\bGROUP\b|\bORDER\b|\bLIMIT\b|$)/i);
    if (fromClause && /,/.test(fromClause[1]) && joinMatches.length === 0) {
      warnings.push('comma-separated FROM list — implicit join style; make join intent explicit with JOIN…ON');
    }

    // distinct vs group by redundancy
    if (/\bSELECT\s+DISTINCT\b/i.test(query) && /\bGROUP\s+BY\b/i.test(query)) {
      warnings.push('both DISTINCT and GROUP BY — GROUP BY already deduplicates; one of them is redundant');
    }

    // structure projection
    const structure = {
      statement: kind,
      select_list: selectList ? selectList.split(',').map((s) => s.trim()) : [],
      tables,
      has_where: hasWhere,
      has_group_by: /\bGROUP\s+BY\b/i.test(query),
      has_order_by: /\bORDER\s+BY\b/i.test(query),
      has_limit: hasLimit,
      joins: joinMatches.map((j) => j[1]),
    };

    const prose: string[] = [];
    prose.push(`Statement type: ${kind}.`);
    if (tables.length > 0) prose.push(`Reads from ${tables.join(', ')}.`);
    if (structure.has_where) prose.push('Filters rows with WHERE.');
    if (structure.has_group_by) prose.push('Aggregates per GROUP BY key.');
    if (structure.has_order_by) prose.push('Sorts with ORDER BY.');
    prose.push(warnings.length > 0 ? `Flags: ${warnings.length} — see warnings.` : 'No structural flags raised.');

    return {
      data: { structure, explanation: prose.join(' '), flags: warnings.length },
      warnings,
      ms: 0,
    };
  },
};

// ─── jont_j246_natural-language-to-cron ────────────────────────────────────

interface CronMatch {
  cron: string;
  human: string;
}

/** Deterministic subset grammar — honest refusal outside it (C5: never guess). */
export function phraseToCron(phraseRaw: string): CronMatch | null {
  const p = phraseRaw.trim().toLowerCase().replace(/\s+/g, ' ');

  // every N minutes
  let m = /^(?:every|each) (\d+) minutes?(?:,.*)?$/.exec(p);
  if (m) {
    const n = Math.max(1, Math.min(59, Number(m[1])));
    return { cron: `*/${n} * * * *`, human: `every ${n} minutes` };
  }
  // every N hours
  m = /^(?:every|each) (\d+) hours?(?:,.*)?$/.exec(p);
  if (m) {
    const n = Math.max(1, Math.min(23, Number(m[1])));
    return { cron: `0 */${n} * * *`, human: `every ${n} hours (on the hour, UTC-local mapping)` };
  }
  // hourly
  m = /^(?:every hour|hourly|once an hour)$/.exec(p);
  if (m) return { cron: '0 * * * *', human: 'hourly' };
  // daily at HH:MM
  m = /^(?:every )?day(?:s)? (?:at )?(\d{1,2})(?::(\d{2}))?(?:,.*)?$/.exec(p) ||
    /^(?:daily|every day|once a day)(?: at (\d{1,2})(?::(\d{2}))?)?(?:,.*)?$/.exec(p);
  if (m) {
    const h = Math.min(23, Number(m[1] ?? '0'));
    const min = Number(m[2] ?? '0');
    return { cron: `${min} ${h} * * *`, human: `daily at ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
  }
  // weekdays at HH:MM
  m = /^(?:every )?weekdays?(?: at (\d{1,2})(?::(\d{2}))?)?(?:,.*)?$/.exec(p);
  if (m) {
    const h = Math.min(23, Number(m[1] ?? '0'));
    const min = Number(m[2] ?? '0');
    return { cron: `${min} ${h} * * 1-5`, human: `weekdays at ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
  }
  // named day(s)
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  m = /^(?:every )?(sundays?|mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?)(?: at (\d{1,2})(?::(\d{2}))?)?(?:,.*)?$/.exec(p);
  if (m) {
    const h = Math.min(23, Number(m[2] ?? '0'));
    const min = Number(m[3] ?? '0');
    const dow = days.findIndex((d) => m![1].startsWith(d.slice(0, 3)));
    return { cron: `${min} ${h} * * ${dow}`, human: `${m[1]} at ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
  }
  // monthly on day N at HH:MM
  m = /^(?:every |each )?month(?:ly)? on the (\d{1,2})(?:st|nd|rd|th)?(?: at (\d{1,2})(?::(\d{2}))?)?$/.exec(p) ||
    /^monthly(?: on the (\d{1,2})(?:st|nd|rd|th)?)?(?: at (\d{1,2})(?::(\d{2}))?)?$/.exec(p);
  if (m) {
    const dom = Math.max(1, Math.min(28, Number(m[1] ?? '1')));
    const h = Math.min(23, Number(m[2] ?? '0'));
    const min = Number(m[3] ?? '0');
    return { cron: `${min} ${h} ${dom} * *`, human: `monthly on day ${dom} at ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
  }
  // every minute
  if (/^(?:every minute|each minute)$/.test(p)) return { cron: '* * * * *', human: 'every minute' };
  // midnight / noon
  if (/^at midnight$/.test(p)) return { cron: '0 0 * * *', human: 'daily at 00:00' };
  if (/^at noon$/.test(p)) return { cron: '0 12 * * *', human: 'daily at 12:00' };
  return null;
}

export const naturalLanguageToCron: JontEngine = {
  manifest: {
    id: 'jont_j246_natural-language-to-cron',
    pattern: 'converter',
    context: 'server',
    io: {
      input: { type: 'object', required: ['phrase'], properties: { phrase: { type: 'string', description: 'schedule phrase, e.g. "every 5 minutes", "daily at 9", "weekdays at 8:30"' } } },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p246', score: 7.0 },
  },
  run(input): JontResult {
    const phrase = String(input.phrase ?? '');
    const match = phraseToCron(phrase);
    const warnings: string[] = [];
    if (!match) {
      warnings.push('phrase outside the supported grammar — supported: "every N minutes", "every N hours", "hourly", "daily at H[:MM]", "weekdays at H[:MM]", "<weekday> at H[:MM]", "monthly on the N[th] at H[:MM]", "every minute", "at midnight", "at noon"');
    }
    return {
      data: {
        cron: match?.cron ?? null,
        human: match?.human ?? null,
        supported: match !== null,
      },
      warnings,
      ms: 0,
    };
  },
};

// ─── jont_j010_curl-to-code ────────────────────────────────────────────────

/** Shell-like tokenizer: splits on spaces, respects '…' and "…" quoting. */
function tokenizeShell(src: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: string | null = null;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ' ' || ch === '\t') {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

export const curlToCode: JontEngine = {
  manifest: {
    id: 'jont_j010_curl-to-code',
    pattern: 'converter',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['curl'],
        properties: {
          curl: { type: 'string', format: 'textarea', description: 'The curl command (multi-line with trailing backslashes is fine).' },
          target: { type: 'string', enum: ['javascript_fetch', 'python_requests', 'php_curl', 'go_nethttp'], description: 'Language to emit.' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'DV-B5', score: 6.58 },
  },
  run(input): JontResult {
    const started = Date.now();
    const warnings: string[] = [];
    const raw = String(input.curl ?? '').replace(/\\\r?\n/g, ' ').trim();
    if (!raw) throw new Error('CURL_EMPTY|paste a curl command');

    const tokens = tokenizeShell(raw.replace(/^curl\b/i, ''));
    let method = 'GET';
    let url = '';
    const headers: Array<[string, string]> = [];
    let body: string | null = null;
    const formFields: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === '-X' || t === '--request') method = (tokens[++i] ?? 'GET').toUpperCase();
      else if (t === '-H' || t === '--header') {
        const h = tokens[++i] ?? '';
        const idx = h.indexOf(':');
        if (idx > 0) headers.push([h.slice(0, idx).trim(), h.slice(idx + 1).trim()]);
      } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary' || t === '--data-ascii') {
        body = tokens[++i] ?? '';
        if (method === 'GET') method = 'POST';
      } else if (t === '-F' || t === '--form') {
        formFields.push(tokens[++i] ?? '');
        if (method === 'GET') method = 'POST';
      } else if (t === '-u' || t === '--user') {
        const cred = tokens[++i] ?? '';
        headers.push(['Authorization', `Basic ${Buffer.from(cred).toString('base64')}`]);
        warnings.push('-u user:pass was converted to a Basic Authorization header — remove it before committing this snippet anywhere public.');
      } else if (t === '-k' || t === '--insecure') {
        warnings.push('the original command disables TLS verification (-k); the generated code does NOT replicate that — fix the certificate instead.');
      } else if (t === '--compressed' || t === '-s' || t === '--silent' || t === '-L' || t === '--location' || t === '-i' || t === '--include' || t === '-v' || t === '--verbose') {
        // transport flags: safe to ignore for request construction
      } else if (!t.startsWith('-')) {
        if (t.startsWith('http://') || t.startsWith('https://')) url = t;
        else if (!url && t) {
          url = t;
          if (!/^https?:\/\//i.test(url)) warnings.push(`the URL has no scheme; "https://" was assumed: ${url}`);
        }
      }
    }
    if (!url) throw new Error('URL_MISSING|no URL found in the curl command');
    if (formFields.length > 0) warnings.push(`-F multipart form fields were found (${formFields.length}); multipart bodies are not emitted — assemble them with your language's form-data API.`);
    const hasBody = body !== null;
    if (hasBody && method === 'GET') method = 'POST';

    const contentType = headers.find(([k]) => k.toLowerCase() === 'content-type')?.[1] ?? '';
    const codeHeaders = headers.filter(([k]) => k.toLowerCase() !== 'content-length');
    const bodyIsJson = /json/i.test(contentType) || (!!body && body.trim().startsWith('{') && !contentType);

    const lines: string[] = [];
    let filename = 'request.js';
    const target = String(input.target ?? 'javascript_fetch');

    if (target === 'python_requests') {
      filename = 'request.py';
      lines.push('import requests');
      lines.push('');
      lines.push('url = ' + JSON.stringify(url));
      lines.push(`method = "${method}"`);
      lines.push('headers = {');
      for (const [k, v] of codeHeaders) lines.push(`    ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
      if (hasBody && !codeHeaders.some(([k]) => k.toLowerCase() === 'content-type') && bodyIsJson) lines.push('    "Content-Type": "application/json",');
      lines.push('}');
      lines.push(hasBody ? `payload = ${JSON.stringify(body)}` : 'payload = None');
      lines.push('');
      lines.push('response = requests.request(method, url, headers=headers, data=payload)');
      lines.push('response.raise_for_status()');
      lines.push('print(response.status_code, response.text)');
    } else if (target === 'php_curl') {
      filename = 'request.php';
      lines.push('<?php');
      lines.push('$ch = curl_init(' + JSON.stringify(url) + ');');
      lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${method}');`);
      lines.push('curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);');
      const headerLines = codeHeaders.map(([k, v]) => `${k}: ${v}`);
      if (hasBody && bodyIsJson && !codeHeaders.some(([k]) => k.toLowerCase() === 'content-type')) headerLines.push('Content-Type: application/json');
      lines.push('curl_setopt($ch, CURLOPT_HTTPHEADER, [');
      for (const h of headerLines) lines.push(`    '${h.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`);
      lines.push(']);');
      if (hasBody) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${JSON.stringify(body)});`);
      lines.push('$response = curl_exec($ch);');
      lines.push('curl_close($ch);');
    } else if (target === 'go_nethttp') {
      filename = 'request.go';
      lines.push('package main');
      lines.push('');
      lines.push('import (');
      lines.push('\t"fmt"');
      lines.push('\t"io"');
      lines.push('\t"net/http"');
      if (hasBody) lines.push('\t"strings"');
      lines.push(')');
      lines.push('');
      const payloadArg = hasBody ? 'strings.NewReader(' + JSON.stringify(body) + ')' : 'nil';
      lines.push(`req, err := http.NewRequest("${method}", ${JSON.stringify(url)}, ${payloadArg})`);
      lines.push('if err != nil {');
      lines.push('\tpanic(err)');
      lines.push('}');
      for (const [k, v] of codeHeaders) lines.push(`req.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})`);
      if (hasBody && bodyIsJson && !codeHeaders.some(([k]) => k.toLowerCase() === 'content-type')) lines.push('req.Header.Set("Content-Type", "application/json")');
      lines.push('');
      lines.push('res, err := http.DefaultClient.Do(req)');
      lines.push('if err != nil {');
      lines.push('\tpanic(err)');
      lines.push('}');
      lines.push('defer res.Body.Close()');
      lines.push('respBody, _ := io.ReadAll(res.Body)');
      lines.push('fmt.Println(res.StatusCode, string(respBody))');
    } else {
      lines.push(`const response = await fetch(${JSON.stringify(url)}, {`);
      lines.push(`  method: '${method}',`);
      if (codeHeaders.length > 0 || (hasBody && bodyIsJson)) {
        lines.push('  headers: {');
        for (const [k, v] of codeHeaders) lines.push(`    ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
        if (hasBody && bodyIsJson && !codeHeaders.some(([k]) => k.toLowerCase() === 'content-type')) lines.push(`    'Content-Type': 'application/json',`);
        lines.push('  },');
      }
      if (hasBody) lines.push(`  body: ${JSON.stringify(body)},`);
      lines.push('});');
      lines.push('');
      lines.push('if (!response.ok) {');
      lines.push(`  throw new Error(\`HTTP \${response.status}: \${await response.text()}\`);`);
      lines.push('}');
      lines.push('');
      lines.push('const data = await response.text();');
    }

    return {
      data: {
        output: lines.join('\n'),
        filename,
        method,
        url,
        target,
        header_count: codeHeaders.length,
        has_body: hasBody,
      },
      warnings,
      change_log: [
        { at: new Date().toISOString(), note: `parsed ${method} ${url}, ${codeHeaders.length} header(s), body ${hasBody ? `${body?.length} bytes` : 'none'}` },
      ],
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

// ─── jont_j094_api-error-decoder ───────────────────────────────────────────

const HTTP_CODE_TABLE: Record<number, { title: string; causes: string[]; checks: string[] }> = {
  400: { title: 'Bad Request', causes: ['malformed body (invalid JSON/encoding)', 'missing required field', 'parameter type mismatch'], checks: ['validate the body against the API schema', 'check Content-Type matches the body format', 'log the exact request that failed'] },
  401: { title: 'Unauthorized', causes: ['missing or expired token', 'wrong auth scheme (Bearer vs Basic)', 'clock skew breaking signature auth'], checks: ['confirm the Authorization header is actually sent', 'check token expiry and issuer', 'try the token with a minimal request (curl -v)'] },
  403: { title: 'Forbidden', causes: ['valid token, missing permission/scope', 'IP or region blocked', 'resource owner denies access'], checks: ['compare the token scopes with the endpoint requirements', 'check account/plan permissions', 'verify IP allowlists'] },
  404: { title: 'Not Found', causes: ['wrong path or version', 'resource belongs to another account', 'trailing slash rules'], checks: ['print the exact URL being requested', 'confirm the API version prefix', 'verify the resource id in that environment (staging vs prod)'] },
  405: { title: 'Method Not Allowed', causes: ['GET used where POST required', 'correct path, wrong verb'], checks: ['check the endpoint docs for the expected verb', 'look for a 4xx Allow header in the response'] },
  409: { title: 'Conflict', causes: ['duplicate id / unique constraint', 'stale version (optimistic locking)'], checks: ['retry with the current version of the resource', 'check whether the id already exists'] },
  413: { title: 'Payload Too Large', causes: ['body exceeds size limit', 'upload larger than plan limit'], checks: ['compress or split the payload', 'check the documented max size'] },
  415: { title: 'Unsupported Media Type', causes: ['Content-Type missing or wrong', 'server expects a different encoding'], checks: ['set Content-Type explicitly', 'compare with a working example request'] },
  422: { title: 'Unprocessable Entity', causes: ['schema-valid but semantically rejected (validation errors)', 'business rule violation'], checks: ['read the error details array field by field', 'fix the first error first — later ones are often cascades'] },
  429: { title: 'Too Many Requests', causes: ['rate limit exceeded', 'quota exhausted for period'], checks: ['honor the Retry-After header', 'add exponential backoff with jitter', 'check X-RateLimit-* headers for the window'] },
  500: { title: 'Internal Server Error', causes: ['server-side bug', 'unhandled exception in the handler'], checks: ['retry once — 500s are sometimes transient', 'find the request-id header and attach it to a support ticket', 'check the provider status page'] },
  502: { title: 'Bad Gateway', causes: ['upstream crashed or restarted', 'proxy timeout to upstream'], checks: ['retry with backoff', 'check provider status page', 'reduce request size/frequency'] },
  503: { title: 'Service Unavailable', causes: ['maintenance window', 'overloaded or degraded dependency'], checks: ['honor Retry-After if present', 'circuit-break instead of hammering'] },
  504: { title: 'Gateway Timeout', causes: ['upstream exceeded the proxy timeout', 'your request triggered a slow path'], checks: ['shrink the request (pagination, filters)', 'check whether an async endpoint exists'] },
};

const apiErrorDecoder: JontEngine = {
  manifest: {
    id: 'jont_j094_cryptic-api-error-responses-cost-hours',
    pattern: 'converter',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['response'],
        properties: {
          response: { type: 'string', format: 'textarea', description: 'Paste the raw HTTP response (status line, headers, body) or just the status code or error JSON.' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'DV-B4', score: 6.5 },
  },
  run(input): JontResult {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.response ?? '').trim();
    if (!src) throw new Error('RESPONSE_EMPTY|paste the HTTP response or status code');

    let status: number | null = null;
    const statusLine = /HTTP\/\S+\s+(\d{3})/i.exec(src);
    const bareCode = /^\d{3}$/.test(src) ? Number(src) : null;
    let bodyJson: Record<string, unknown> | null = null;
    const jsonStart = src.indexOf('{');
    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(src.slice(jsonStart)) as Record<string, unknown>;
        if (parsed !== null && typeof parsed === 'object') bodyJson = parsed;
      } catch {
        /* body is not clean JSON; fine */
      }
    }

    if (statusLine) status = Number(statusLine[1]);
    else if (bareCode !== null) status = bareCode;
    else if (bodyJson && typeof bodyJson.status === 'number') status = bodyJson.status as number;
    else if (bodyJson && typeof bodyJson.code === 'number' && Number(bodyJson.code) >= 400 && Number(bodyJson.code) <= 599) status = bodyJson.code as number;

    if (status === null) {
      warnings.push('no status code found — paste the full response ("HTTP/1.1 429 Too Many Requests ...") or the bare 3-digit code.');
    }

    const hints: Record<string, unknown> = {};
    if (bodyJson) {
      for (const key of ['message', 'error', 'code', 'detail', 'errors', 'request_id', 'requestId']) {
        if (key in bodyJson) hints[key] = bodyJson[key];
      }
    }
    const retryAfter = /retry-after:\s*(\S+)/i.exec(src);
    if (retryAfter) hints.retry_after = retryAfter[1];
    const rateRemaining = /x-ratelimit-remaining:\s*(\S+)/i.exec(src);
    if (rateRemaining) hints.rate_limit_remaining = rateRemaining[1];
    const requestId = /x-request-id:\s*(\S+)/i.exec(src);
    if (requestId) hints.request_id = requestId[1];

    const info = status !== null ? HTTP_CODE_TABLE[status] : undefined;
    const lines: string[] = [];
    if (status !== null) {
      lines.push(`Status ${status}${info ? ` — ${info.title}` : info === undefined && status >= 200 && status < 300 ? ' — success (nothing to debug here)' : ' — non-standard or informational status'}`);
      lines.push('');
      if (info) {
        lines.push('Most common causes:');
        for (const c of info.causes) lines.push(`  - ${c}`);
        lines.push('');
        lines.push('What to check, in order:');
        for (const [i, c] of info.checks.entries()) lines.push(`  ${i + 1}. ${c}`);
      } else if (status !== null && (status < 200 || status > 599)) {
        lines.push('This is not a standard HTTP status code — check for a typo or a proxy-injected code.');
      }
    }
    if (Object.keys(hints).length > 0) {
      lines.push('');
      lines.push('Extracted from the response:');
      for (const [k, v] of Object.entries(hints)) lines.push(`  ${k}: ${JSON.stringify(v)}`);
    }
    if (bodyJson && typeof bodyJson.errors === 'object' && bodyJson.errors !== null) {
      lines.push('');
      lines.push('Validation detail (errors field):');
      lines.push(JSON.stringify(bodyJson.errors, null, 2).split('\n').map((l) => `  ${l}`).join('\n'));
    }
    if (status !== null && status >= 500) warnings.push('5xx failures happen on the provider side — attach the request-id (if any) when contacting support; do not blind-retry more than once or twice.');

    return {
      data: {
        output: lines.join('\n'),
        filename: null,
        status,
        title: info?.title ?? null,
        hints,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

// ─── jont_j222_telegram-group-export-analyzer ──────────────────────────────

const telegramExportAnalyzer: JontEngine = {
  manifest: {
    id: 'jont_j222_telegram-group-export-analyzer',
    pattern: 'converter',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['export_json'],
        properties: {
          export_json: { type: 'string', format: 'textarea', description: 'Telegram Desktop group export (result.json) — Chat export > Machine-readable JSON.' },
          top: { type: 'number', description: 'How many top senders to list (default 10).' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'MAX',
    mcp_exposed: true,
    evidence: { problem_row: 'GT-TG-telegram-TG-2', score: 5.35 },
  },
  run(input): JontResult {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.export_json ?? '');
    if (!src.trim()) throw new Error('EXPORT_EMPTY|paste the result.json content from a Telegram Desktop export');

    const parsed = JSON.parse(src) as { messages?: unknown[]; name?: string };
    const messages = (parsed.messages ?? []) as Array<Record<string, unknown>>;
    if (messages.length === 0) throw new Error('NO_MESSAGES|the export contains no messages array');

    const topN = Math.max(1, Math.min(50, Math.floor(Number(input.top) || 10)));
    const perAuthor = new Map<string, number>();
    const perDay = new Map<string, number>();
    let links = 0;
    let photos = 0;
    let files = 0;
    let stickers = 0;
    let voice = 0;
    let replies = 0;
    let totalLength = 0;
    let textMessages = 0;

    const textOf = (t: unknown): string =>
      Array.isArray(t)
        ? t.map((part) => (typeof part === 'string' ? part : typeof part === 'object' && part !== null && typeof (part as Record<string, unknown>).text === 'string' ? String((part as Record<string, unknown>).text) : '')).join('')
        : typeof t === 'string' ? t : '';

    for (const m of messages) {
      if (m.type !== 'message') continue;
      const author = typeof m.from === 'string' ? m.from : typeof m.actor === 'string' ? String(m.actor) : 'unknown';
      perAuthor.set(author, (perAuthor.get(author) ?? 0) + 1);
      const day = typeof m.date === 'string' ? m.date.slice(0, 10) : 'unknown';
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
      const text = textOf(m.text);
      if (text) {
        textMessages++;
        totalLength += text.length;
        links += (text.match(/https?:\/\//g) ?? []).length;
      }
      if (m.photo) photos++;
      if (m.file) files++;
      if (m.sticker_emoji) stickers++;
      if (m.media_type === 'voice_message') voice++;
      if (m.reply_to_message_id) replies++;
    }

    const days = [...perDay.entries()].sort((a, b) => b[1] - a[1]);
    const busiest = days[0] ?? ['n/a', 0];
    const topAuthors = [...perAuthor.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
    const dateKeys = [...perDay.keys()].filter((d) => d !== 'unknown').sort();
    const range = dateKeys.length > 0 ? `${dateKeys[0]} to ${dateKeys[dateKeys.length - 1]}` : 'unknown';
    const distinctDays = dateKeys.length || 1;
    const avgPerDay = Math.round((textMessages + photos + files + stickers) / distinctDays);

    const lines: string[] = [];
    lines.push(`# Group export analysis${typeof parsed.name === 'string' ? `: ${parsed.name}` : ''}`);
    lines.push('');
    lines.push(`- Messages: ${messages.length} over ${range}`);
    lines.push(`- Average per active day: ${avgPerDay}`);
    lines.push(`- Busiest day: ${busiest[0]} (${busiest[1]} messages)`);
    lines.push(`- Text messages: ${textMessages} (avg length ${textMessages ? Math.round(totalLength / textMessages) : 0} chars)`);
    lines.push(`- Links shared: ${links}`);
    lines.push(`- Photos: ${photos} · Files: ${files} · Stickers: ${stickers} · Voice: ${voice}`);
    lines.push(`- Replies: ${replies}`);
    lines.push('');
    lines.push(`## Top ${topAuthors.length} senders`);
    lines.push('');
    for (const [author, count] of topAuthors) lines.push(`- ${author}: ${count}`);
    lines.push('');
    lines.push('## Last 10 active days');
    lines.push('');
    for (const [day, count] of days.slice(0, 10)) lines.push(`- ${day}: ${count}`);
    warnings.push('The export is analyzed in memory for this single request and never stored.');

    return {
      data: {
        output: lines.join('\n'),
        filename: 'group-analysis.md',
        messages: messages.length,
        authors: perAuthor.size,
        top_senders: topAuthors,
        busiest_day: busiest,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

// ─── jont_j229_league-scheduler ────────────────────────────────────────────

const leagueScheduler: JontEngine = {
  manifest: {
    id: 'jont_j229_sports-league-scheduling-for-volunteers',
    pattern: 'converter',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['teams'],
        properties: {
          teams: { type: 'string', format: 'textarea', description: 'Team names, one per line (3–24 teams).' },
          rounds: { type: 'string', enum: ['single', 'double'], description: 'Single (everyone plays everyone once) or double (home and away).' },
          start_date: { type: 'string', description: 'First matchday date, YYYY-MM-DD (optional).' },
          interval_days: { type: 'number', description: 'Days between matchdays (default 7).' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'WG-G12', score: 5.22 },
  },
  run(input): JontResult {
    const started = Date.now();
    const warnings: string[] = [];
    const teamsRaw = String(input.teams ?? '')
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
    if (teamsRaw.length < 3) throw new Error('TEAMS_TOO_FEW|need at least 3 teams');
    if (teamsRaw.length > 24) throw new Error('TEAMS_TOO_MANY|24 teams is the ceiling for this engine');
    if (new Set(teamsRaw).size !== teamsRaw.length) throw new Error('DUPLICATE_TEAMS|team names must be unique');

    const isDouble = input.rounds === 'double';
    const interval = Math.max(1, Math.floor(Number(input.interval_days) || 7));
    const startDate = typeof input.start_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.start_date) ? input.start_date : null;
    if (!startDate) warnings.push('no start_date given — matchdays are numbered, not dated.');

    let rotation = [...teamsRaw];
    if (rotation.length % 2 === 1) {
      rotation.push('BYE');
      warnings.push('odd team count — one team rests (BYE) each matchday.');
    }
    rotation = seededShuffle(rotation, seededRandom(fnv1a(stableJoin(teamsRaw))));

    const rounds: Array<Array<[string, string]>> = [];
    const n = rotation.length;
    for (let round = 0; round < n - 1; round++) {
      const pairs: Array<[string, string]> = [];
      for (let i = 0; i < n / 2; i++) {
        const home = rotation[i];
        const away = rotation[n - 1 - i];
        if (home !== 'BYE' && away !== 'BYE') {
          // alternate home advantage by round parity for fairness
          pairs.push(round % 2 === 0 ? [home, away] : [away, home]);
        }
      }
      rounds.push(pairs);
      // circle method: keep index 0 fixed, rotate the rest
      rotation = [rotation[0], rotation[n - 1], ...rotation.slice(1, n - 1)];
    }
    if (isDouble) rounds.push(...rounds.map((r) => r.map(([h, a]) => [a, h] as [string, string])));

    const lines: string[] = [];
    lines.push(`# Schedule — ${teamsRaw.length} teams, ${rounds.length} matchday(ies)`);
    lines.push('');
    for (const [ri, pairs] of rounds.entries()) {
      const label = startDate
        ? new Date(Date.UTC(...(startDate.split('-').map(Number) as [number, number, number])) + ri * interval * 86400000).toISOString().slice(0, 10)
        : `Matchday ${ri + 1}`;
      lines.push(`## ${label}`);
      for (const [home, away] of pairs) lines.push(`- ${home} vs ${away}`);
      lines.push('');
    }

    return {
      data: {
        output: lines.join('\n'),
        filename: 'schedule.md',
        matchdays: rounds.length,
        matches_total: rounds.reduce((s, r) => s + r.length, 0),
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

function stableJoin(items: string[]): string {
  return [...items].sort().join('\u0000');
}

export const CONVERTER_ENGINES = [studyDeckConverter, weddingGuestListPlanner, flashcardDataPortability, chatgptExportConverter, seatingChartsRandomGroupMaker, sqlQueryExplainer, naturalLanguageToCron, curlToCode, apiErrorDecoder, telegramExportAnalyzer, leagueScheduler];
