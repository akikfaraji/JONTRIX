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

export const CONVERTER_ENGINES = [studyDeckConverter, weddingGuestListPlanner, flashcardDataPortability, chatgptExportConverter, seatingChartsRandomGroupMaker, sqlQueryExplainer, naturalLanguageToCron];
