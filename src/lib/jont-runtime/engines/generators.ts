// Generator-pattern engines — VOL-11 §3: params → artifact via templating.
// Deterministic: no wall-clock, no unseeded randomness in outputs.

import { createHash } from 'node:crypto';
import type { JontEngine, JontResult } from '../types';
import { fnv1a, seededShuffle, seededRandom, toCsv } from '../util';

// ─── jont_j009_exam-question-bank-builder ──────────────────────────────────

export const examQuestionBankBuilder: JontEngine = {
  manifest: {
    id: 'jont_j009_exam-question-bank-builder',
    pattern: 'generator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['questions'],
        properties: {
          questions: { type: 'array', items: { type: 'string' }, description: 'one question per line-item; "|" splits answer options, "answer:" marks the key' },
          title: { type: 'string', description: 'bank title' },
          shuffle: { type: 'boolean', description: 'seeded shuffle of question order' },
          seed: { type: 'number', description: 'shuffle seed (default 1)' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p09', score: 7.12 },
  },
  run(input): JontResult {
    const raw = Array.isArray(input.questions) ? (input.questions as unknown[]) : [];
    const questions = raw.map(String).filter((q) => q.trim().length > 0);
    if (questions.length === 0) {
      return { data: { bank: { title: '', items: [] }, markdown: '' }, warnings: ['no questions supplied'], ms: 0 };
    }

    const title = String(input.title ?? 'Question Bank');
    const seed = input.seed === undefined ? 1 : Number(input.seed);
    const rand = seededRandom(fnv1a(`${title}:${seed}`));
    let ordered = questions;
    if (input.shuffle === true) ordered = seededShuffle(questions, rand);

    const items = ordered.map((q, i) => {
      const segments = q.split('|').map((s) => s.trim());
      const stem = segments[0];
      const options: Array<{ label: string; text: string }> = [];
      let answer: string | null = null;
      for (const seg of segments.slice(1)) {
        const ansMatch = /^answer\s*:\s*(.+)$/i.exec(seg);
        if (ansMatch) {
          answer = ansMatch[1].trim();
        } else {
          const optMatch = /^(?:([a-hA-H])\)|([a-hA-H])\.|-)\s*(.+)$/.exec(seg);
          if (optMatch) {
            options.push({ label: (optMatch[1] ?? optMatch[2] ?? String.fromCharCode(97 + options.length)).toLowerCase(), text: optMatch[3].trim() });
          } else {
            options.push({ label: String.fromCharCode(97 + options.length), text: seg });
          }
        }
      }
      return {
        id: `Q${String(i + 1).padStart(3, '0')}`,
        stem,
        options,
        answer,
      };
    });

    const lines: string[] = [`# ${title}`, ''];
    for (const q of items) {
      lines.push(`**${q.id}. ${q.stem}**`);
      for (const o of q.options) lines.push(`- ${o.label}) ${o.text}`);
      if (q.answer) lines.push(`   _Answer: ${q.answer}_`);
      lines.push('');
    }
    const mcqCount = items.filter((q) => q.options.length > 0).length;
    const openCount = items.length - mcqCount;

    return {
      data: {
        bank: { title, total: items.length, mcq: mcqCount, open_ended: openCount, items },
        markdown: lines.join('\n'),
      },
      warnings: mcqCount === 0 ? ['no option segments found — bank is all open-ended'] : [],
      ms: 0,
    };
  },
};

// ─── jont_j113_citation-formatter ──────────────────────────────────────────

interface CitationSource {
  type?: string;
  authors?: string[];
  title?: string;
  year?: string | number;
  publisher?: string;
  journal?: string;
  volume?: string;
  pages?: string;
  url?: string;
  accessed?: string;
  doi?: string;
}

function formatAuthorsApa(authors: string[]): string {
  if (authors.length === 0) return '';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors.slice(0, -1).join(', ')}, & ${authors[authors.length - 1]}`;
}

export const citationFormatter: JontEngine = {
  manifest: {
    id: 'jont_j113_citation-formatter',
    pattern: 'generator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['source'],
        properties: {
          source: { type: 'object', description: 'fields: type, authors[], title, year, publisher, journal, volume, pages, url, accessed, doi' },
          style: { type: 'string', enum: ['apa', 'mla', 'bibtex'], description: 'output style' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p113', score: 7.0 },
  },
  run(input): JontResult {
    const src = (input.source ?? {}) as CitationSource;
    const style = String(input.style ?? 'apa').toLowerCase();
    const authors = Array.isArray(src.authors) ? src.authors.map(String) : [];
    const year = src.year === undefined ? 'n.d.' : String(src.year);
    const title = String(src.title ?? 'Untitled');
    const warnings: string[] = [];

    if (!src.title) warnings.push('no title provided — output uses "Untitled"');
    if (authors.length === 0) warnings.push('no authors provided');

    let apa = '';
    let mla = '';
    let bibtex = '';

    const authorStrApa = formatAuthorsApa(authors);
    const authorStrMla = authors.length > 2 ? `${authors[0]}, et al.` : authors.join(', ');
    const isWeb = String(src.type ?? '').toLowerCase() === 'webpage' || (!src.publisher && src.url);
    const isArticle = String(src.type ?? '').toLowerCase() === 'article' || (!isWeb && src.journal);

    if (isArticle) {
      apa = `${authorStrApa} (${year}). ${title}. ${src.journal ?? ''}${src.volume ? `, ${src.volume}` : ''}${src.pages ? `, ${src.pages}` : ''}.${src.doi ? ` https://doi.org/${src.doi}` : ''}`.replace(/\.\./g, '.');
      mla = `${authorStrMla}. "${title}." ${src.journal ?? ''}${src.volume ? ` ${src.volume}` : ''} (${year})${src.pages ? `: ${src.pages}` : ''}.`;
      const key = (authors[0] ?? 'source').split(/\s+/).pop()?.toLowerCase().replace(/[^a-z]/g, '') || 'source';
      bibtex = [
        `@article{${key}${year},`,
        `  author  = {${authors.join(' and ')}},`,
        `  title   = {${title}},`,
        src.journal ? `  journal = {${src.journal}},` : '',
        src.volume ? `  volume  = {${src.volume}},` : '',
        src.pages ? `  pages   = {${src.pages}},` : '',
        `  year    = {${year}},`,
        src.doi ? `  doi     = {${src.doi}},` : '',
        `}`,
      ].filter(Boolean).join('\n');
    } else if (isWeb) {
      apa = `${authorStrApa} (${year}). ${title}. ${src.publisher ? `${src.publisher}. ` : ''}${src.url ?? ''}${src.accessed ? ` (accessed ${src.accessed})` : ''}`;
      mla = `${authorStrMla}. "${title}." ${src.publisher ?? 'Website'}, ${year}${src.url ? `, ${src.url}` : ''}.`;
      const key = (authors[0] ?? 'web').split(/\s+/).pop()?.toLowerCase().replace(/[^a-z]/g, '') || 'web';
      bibtex = [
        `@misc{${key}${year},`,
        `  author       = {${authors.join(' and ')}},`,
        `  title        = {${title}},`,
        `  year         = {${year}},`,
        src.url ? `  howpublished = {\\url{${src.url}}},` : '',
        `}`,
      ].filter(Boolean).join('\n');
    } else {
      apa = `${authorStrApa} (${year}). ${title}. ${src.publisher ?? ''}.`.replace(/\.\./g, '.');
      mla = `${authorStrMla}. ${title}. ${src.publisher ?? ''}, ${year}.`;
      const key = (authors[0] ?? 'book').split(/\s+/).pop()?.toLowerCase().replace(/[^a-z]/g, '') || 'book';
      bibtex = [
        `@book{${key}${year},`,
        `  author    = {${authors.join(' and ')}},`,
        `  title     = {${title}},`,
        src.publisher ? `  publisher = {${src.publisher}},` : '',
        `  year      = {${year}},`,
        `}`,
      ].filter(Boolean).join('\n');
    }

    const formatted =
      style === 'mla' ? mla : style === 'bibtex' ? bibtex : apa;
    if (style !== 'mla' && style !== 'bibtex' && style !== 'apa') {
      warnings.push(`unknown style "${input.style}" — used APA`);
    }

    return {
      data: { style: style === 'mla' || style === 'bibtex' ? style : 'apa', citation: formatted, all: { apa, mla, bibtex } },
      warnings,
      ms: 0,
    };
  },
};

// ─── jont_j125_worksheet-rubric-generation-for-teachers ────────────────────

export const worksheetRubricGenerator: JontEngine = {
  manifest: {
    id: 'jont_j125_worksheet-rubric-generation-for-teachers',
    pattern: 'generator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['title', 'items'],
        properties: {
          title: { type: 'string' },
          items: { type: 'array', items: { type: 'string' }, description: 'worksheet questions or tasks' },
          points_total: { type: 'number', description: 'total points to distribute (default 100)' },
          instructions: { type: 'string' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p125', score: 7.0 },
  },
  run(input): JontResult {
    const title = String(input.title ?? 'Worksheet');
    const items = (Array.isArray(input.items) ? (input.items as unknown[]) : []).map(String).filter((s) => s.trim());
    const total = input.points_total === undefined ? 100 : Number(input.points_total);
    const instructions = String(input.instructions ?? 'Complete every item. Show your work where applicable.');

    if (items.length === 0) {
      return { data: {}, warnings: ['no items provided — nothing generated'], ms: 0 };
    }

    // points: even split, remainder to earlier items — deterministic
    const base = Math.floor(total / items.length);
    const remainder = total % items.length;
    const points = items.map((_, i) => base + (i < remainder ? 1 : 0));

    const lines: string[] = [
      `# ${title}`,
      '',
      `Instructions: ${instructions}`,
      `Total points: ${total}`,
      '',
      '---',
      '',
    ];
    items.forEach((item, i) => {
      lines.push(`**${i + 1}.** ${item} _(${points[i]} pts)_`);
      lines.push('');
      lines.push('Answer:');
      lines.push('```');
      lines.push('');
      lines.push('```');
      lines.push('');
    });

    // rubric: three criteria bands per item
    const rubric = items.map((item, i) => {
      const p = points[i];
      return {
        item: i + 1,
        task: item,
        bands: [
          { level: 'Full', points: p, descriptor: 'correct and complete' },
          { level: 'Partial', points: Math.max(1, Math.round(p * 0.5)), descriptor: 'partially correct; key step missing' },
          { level: 'Attempt', points: p > 2 ? 1 : 0, descriptor: 'relevant start, not correct' },
        ],
      };
    });

    const md = lines.join('\n');
    return {
      data: { worksheet_markdown: md, points_per_item: points, rubric },
      warnings: [],
      ms: 0,
    };
  },
};

// ─── jont_j236_changelog-generator-from-git-log ────────────────────────────

interface LogEntry {
  hash: string;
  subject: string;
}

function parseGitLog(text: string): LogEntry[] {
  const entries: LogEntry[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // "hash subject" (oneline) or "hash<TAB>subject" or plain subjects
    const m = /^([0-9a-f]{7,40})\s+(.+)$/.exec(trimmed);
    if (m) entries.push({ hash: m[1].slice(0, 7), subject: m[2].trim() });
    else entries.push({ hash: '', subject: trimmed });
  }
  return entries;
}

export const changelogFromGitLog: JontEngine = {
  manifest: {
    id: 'jont_j236_changelog-generator-from-git-log',
    pattern: 'generator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['git_log'],
        properties: {
          git_log: { type: 'string', description: 'git log --oneline output (or plain subject lines)' },
          version: { type: 'string', description: 'version heading (e.g. 1.2.0)' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p236', score: 7.0 },
  },
  run(input): JontResult {
    const log = String(input.git_log ?? '');
    const version = String(input.version ?? 'Unreleased');
    const entries = parseGitLog(log);
    const warnings: string[] = [];
    if (entries.length === 0) warnings.push('no log lines parsed');

    const groups: Record<string, LogEntry[]> = {
      breaking: [],
      feat: [],
      fix: [],
      perf: [],
      docs: [],
      chore: [],
      other: [],
    };
    for (const e of entries) {
      const m = /^(breaking|feat|fix|perf|docs|chore)(?:\([^)]*\))?!?\s*[:!]\s*(.+)$/i.exec(e.subject);
      if (m) {
        const kind = m[1].toLowerCase();
        groups[kind === 'perf' ? 'perf' : kind].push({ hash: e.hash, subject: m[2] });
        // a `kind!:` subject is also breaking — but a plain `breaking:` row is already filed
        if (!/^breaking/i.test(m[1]) && /![:\s]/.test(e.subject)) {
          groups.breaking.push({ hash: e.hash, subject: m[2] });
        }
      } else {
        groups.other.push(e);
      }
    }

    const lines: string[] = [`## ${version}`, ''];
    const sectionLabels: Array<[keyof typeof groups, string]> = [
      ['breaking', 'Breaking changes'],
      ['feat', 'Features'],
      ['fix', 'Fixes'],
      ['perf', 'Performance'],
      ['docs', 'Docs'],
      ['chore', 'Chores'],
      ['other', 'Other'],
    ];
    for (const [key, label] of sectionLabels) {
      const list = groups[key];
      if (list.length === 0) continue;
      lines.push(`### ${label}`);
      for (const e of list) lines.push(`- ${e.subject}${e.hash ? ` (${e.hash})` : ''}`);
      lines.push('');
    }
    if (lines.length === 2) lines.push('_no entries_');

    return {
      data: {
        markdown: lines.join('\n'),
        counts: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])),
      },
      warnings,
      ms: 0,
    };
  },
};

// ─── jont_j201_quiz-generator-from-notes ───────────────────────────────────

interface GeneratedQuestion {
  type: 'mcq' | 'cloze';
  question: string;
  options: string[];
  answer_index: number;
  source: string;
}

export const quizGeneratorFromNotes: JontEngine = {
  manifest: {
    id: 'jont_j201_quiz-generator-from-notes',
    pattern: 'generator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['notes'],
        properties: {
          notes: { type: 'string', format: 'textarea', description: 'Study notes — sentences or bullet points. Questions are generated deterministically from definitions and facts.' },
          question_count: { type: 'number', description: 'How many questions to generate (default 10).' },
          title: { type: 'string', description: 'Quiz title for the header.' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'GT-EDU-make-WG-G1', score: 5.7 },
  },
  run(input): JontResult {
    const started = Date.now();
    const warnings: string[] = [];
    const src = String(input.notes ?? '');
    if (!src.trim()) throw new Error('NOTES_EMPTY|paste the study notes');

    const wanted = Math.max(3, Math.min(30, Math.floor(Number(input.question_count) || 10)));
    const title = String(input.title ?? 'Quiz').trim() || 'Quiz';

    // collect candidate sentences (bullets and sentence lines)
    const sentences: string[] = [];
    for (const rawLine of src.split('\n')) {
      const line = rawLine.replace(/^[\s>*+-]+/, '').trim();
      if (line.length < 15) continue;
      for (const s of line.split(/(?<=[.!?])\s+/)) {
        const t = s.trim();
        if (t.length >= 15) sentences.push(t);
      }
    }

    // deterministic key-fact extraction: definition shapes and numeric facts rank first
    const definitionRe = /^(.{3,60}?)\s+(?:is|are|was|were|means|refers to|consists of)\s+(.{15,})$/i;
    const colonRe = /^(.{3,60}?):\s+(.{15,})$/;
    interface Candidate { sentence: string; key: string; rank: number }
    const candidates: Candidate[] = [];
    for (const s of sentences) {
      const clean = s.replace(/[.;]$/, '');
      const d = definitionRe.exec(clean);
      const c = colonRe.exec(clean);
      const num = /(\d[\d.,]*\s?(?:%|percent|km|kg|years?|days?|hours?| BCE| CE)?)/i.exec(clean);
      if (d) candidates.push({ sentence: clean, key: d[1].trim(), rank: 0 });
      else if (c) candidates.push({ sentence: clean, key: c[1].trim(), rank: 1 });
      else if (num) candidates.push({ sentence: clean, key: num[1].trim(), rank: 2 });
    }

    if (candidates.length < 3) {
      warnings.push('only a few definition-shaped or numeric facts were found — quizzes come out thin. Notes with "X is Y" or "X: Y" lines produce the best questions.');
    }
    if (candidates.length === 0) throw new Error('NO_FACTS|no definition-shaped or numeric sentences found to build questions from');

    candidates.sort((a, b) => a.rank - b.rank || a.key.localeCompare(b.key));
    const picked = candidates.slice(0, wanted);

    // deterministic distractor pool: other candidates' keys, stable per-notes seed
    const allKeys = [...new Set(candidates.map((c) => c.key))];
    const rand = seededRandom(fnv1a(src.slice(0, 500)));
    const questions: GeneratedQuestion[] = [];

    for (const [qi, cand] of picked.entries()) {
      const isCloze = qi % 2 === 1; // alternate deterministically: even → mcq, odd → cloze
      const others = seededShuffle(
        allKeys.filter((k) => k.toLowerCase() !== cand.key.toLowerCase()),
        seededRandom(fnv1a(cand.key) + qi),
      ).slice(0, 3);
      if (isCloze) {
        questions.push({
          type: 'cloze',
          question: cand.sentence.replace(new RegExp(escapeRe(cand.key), 'i'), '______'),
          options: [],
          answer_index: -1,
          source: cand.key,
        });
      } else {
        while (others.length < 3 && allKeys.length + others.length > 3) {
          const filler = `none of these (${others.length + 1})`;
          others.push(filler);
        }
        if (others.length < 3) {
          warnings.push('not enough distinct key terms for 4-option MCQs — some questions were emitted as cloze instead.');
          questions.push({
            type: 'cloze',
            question: cand.sentence.replace(new RegExp(escapeRe(cand.key), 'i'), '______'),
            options: [],
            answer_index: -1,
            source: cand.key,
          });
          continue;
        }
        const options = seededShuffle([cand.key, ...others], rand).slice(0, 4);
        questions.push({
          type: 'mcq',
          question: `Which term matches: "${cand.sentence}"?`,
          options,
          answer_index: options.indexOf(cand.key),
          source: cand.key,
        });
      }
    }

    const lines: string[] = [];
    lines.push(`# ${title} — ${questions.length} questions`);
    lines.push('');
    questions.forEach((q, i) => {
      lines.push(`**${i + 1}. ${q.question}**`);
      if (q.type === 'mcq') {
        q.options.forEach((opt, oi) => lines.push(`   ${String.fromCharCode(65 + oi)}. ${opt}`));
      }
      lines.push('');
    });
    lines.push('## Answer key');
    lines.push('');
    questions.forEach((q, i) => {
      if (q.type === 'mcq') lines.push(`${i + 1}. ${String.fromCharCode(65 + q.answer_index)} — ${q.source}`);
      else lines.push(`${i + 1}. ${q.source}`);
    });

    return {
      data: {
        markdown: lines.join('\n'),
        output: lines.join('\n'),
        filename: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-quiz.md`,
        questions: questions.length,
        mcq: questions.filter((q) => q.type === 'mcq').length,
        cloze: questions.filter((q) => q.type === 'cloze').length,
      },
      warnings,
      ms: Date.now() - started,
    } satisfies JontResult;
  },
};

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── jont_j058_spreadsheets ────────────────────────────────────────────────

export const spreadsheetGenerator: JontEngine = {
  manifest: {
    id: 'jont_j058_spreadsheets',
    pattern: 'generator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['template'],
        properties: {
          template: { type: 'string', enum: ['inventory', 'invoice-lines', 'budget', 'attendance', 'custom'], description: 'starter spreadsheet template' },
          columns: { type: 'string', description: 'custom: comma-separated column names' },
          row_count: { type: 'number', description: 'sample rows to generate (1-500)' },
          seed: { type: 'number', description: 'seed for the deterministic sample data' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'WG-G20', score: 6.9 },
  },
  run(input): JontResult {
    const template = String(input.template ?? 'inventory');
    const count = Math.max(1, Math.min(500, Number(input.row_count ?? 10) || 10));
    const rand = seededRandom(fnv1a(`${template}:${count}:${Number(input.seed ?? 1)}`));
    const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
    const money = (min: number, max: number) => String((Math.floor((min + rand() * (max - min)) * 100) / 100).toFixed(2));

    let header: string[]; let sampleRow: (i: number) => string[];
    if (template === 'inventory') {
      header = ['sku', 'product_name', 'category', 'quantity', 'unit_price', 'reorder_level'];
      const cats = ['electronics', 'apparel', 'home', 'office'];
      sampleRow = (i) => [`SKU-${String(1000 + i)}`, `Sample product ${i + 1}`, pick(cats), String(5 + Math.floor(rand() * 200)), money(2, 90), '10'];
    } else if (template === 'invoice-lines') {
      header = ['line', 'description', 'qty', 'unit_price', 'line_total'];
      sampleRow = (i) => {
        const qty = 1 + Math.floor(rand() * 8);
        const price = money(5, 120);
        return [String(i + 1), `Service item ${i + 1}`, String(qty), price, String(Math.round(qty * Number(price) * 100) / 100)];
      };
    } else if (template === 'budget') {
      header = ['month', 'category', 'planned', 'actual', 'variance'];
      const cats = ['rent', 'food', 'transport', 'marketing', 'savings'];
      const months = ['2026-01', '2026-02', '2026-03'];
      sampleRow = () => {
        const c = pick(cats); const m = pick(months);
        const planned = Math.floor(50 + rand() * 450);
        const actual = planned + Math.floor(-30 + rand() * 60);
        return [m, c, String(planned), String(actual), String(planned - actual)];
      };
    } else if (template === 'attendance') {
      header = ['date', 'name', 'status', 'minutes_late'];
      const names = ['A. Rahman', 'J. Doe', 'M. Chen', 'S. Ali', 'P. Novak'];
      const stat = ['present', 'present', 'present', 'late', 'absent'];
      sampleRow = () => [new Date(Date.UTC(2026, 7, 1 + Math.floor(rand() * 28))).toISOString().slice(0, 10), pick(names), pick(stat), String(Math.floor(rand() * 20))];
    } else {
      const cols = String(input.columns ?? '').split(',').map((c) => c.trim()).filter(Boolean);
      if (cols.length === 0) throw new Error('NO_COLUMNS|custom template needs comma-separated column names');
      header = cols;
      sampleRow = (i) => cols.map((c, j) => (j === 0 ? `${c} ${i + 1}` : String(Math.floor(rand() * 100))));
    }

    const rows: Array<Array<string | number>> = [header];
    for (let i = 0; i < count; i++) rows.push(sampleRow(i));
    return {
      data: {
        csv: toCsv(rows),
        filename: `${template}-sheet.csv`,
        rows: count,
        columns: header,
        template,
      },
      warnings: ['sample rows are seeded synthetic data — replace with real records before use'],
      ms: 0,
    } satisfies JontResult;
  },
};

// ─── jont_j139_static-json-mock-api-server ─────────────────────────────────

export const staticJsonMockApi: JontEngine = {
  manifest: {
    id: 'jont_j139_static-json-mock-api-server',
    pattern: 'generator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['routes'],
        properties: {
          routes: { type: 'string', format: 'textarea', description: 'one route per line: METHOD path field:type field:type … — e.g. "GET /users name:string age:number active:boolean"' },
          items: { type: 'number', description: 'items per collection route (1-50)' },
          seed: { type: 'number', description: 'seed for deterministic fake values' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'MAX',
    mcp_exposed: true,
    evidence: { problem_row: 'GT-API-fake-DV-B17', score: 6.2 },
  },
  run(input): JontResult {
    const src = String(input.routes ?? '');
    if (!src.trim()) throw new Error('NO_ROUTES|define at least one route line');
    const items = Math.max(1, Math.min(50, Number(input.items ?? 5) || 5));
    const seed = Number(input.seed ?? 1) || 1;

    interface Route { method: string; path: string; fields: Array<{ name: string; type: string }> }
    const routes: Route[] = [];
    const bad: string[] = [];
    src.split(/\r?\n/).forEach((line, i) => {
      const t = line.trim();
      if (!t) return;
      const parts = t.split(/\s+/);
      const method = parts[0]?.toUpperCase() ?? 'GET';
      const path = parts[1] ?? '';
      if (!/^\/[\w\-./:]*$/.test(path) || !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        bad.push(`line ${i + 1}: "${t.slice(0, 60)}" — expected "METHOD /path field:type …"`);
        return;
      }
      const fields = parts.slice(2).map((f) => {
        const [name, type = 'string'] = f.split(':');
        return { name, type: type.toLowerCase() };
      });
      routes.push({ method, path, fields });
    });
    if (routes.length === 0) throw new Error('NO_VALID_ROUTES|no route line parsed');

    const fakeValue = (type: string, i: number, name: string, rnd: () => number): unknown => {
      switch (type) {
        case 'number': case 'int': return Math.floor(rnd() * 100);
        case 'float': case 'price': return Math.round(rnd() * 10000) / 100;
        case 'boolean': case 'bool': return rnd() > 0.5;
        case 'date': return new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
        case 'email': return `user${i + 1}@example.test`;
        case 'name': return ['Ada', 'Bo', 'Cy', 'Dee', 'Eli'][i % 5] + ' Sample';
        case 'uuid': return `00000000-0000-4000-8000-${String(seed * 100000 + i).padStart(12, '0')}`;
        default: return `${name}_${i + 1}`;
      }
    };

    const mocks: Record<string, unknown> = {};
    routes.forEach((r) => {
      const rnd = seededRandom(fnv1a(`${r.method}:${r.path}:${seed}`));
      const isCollection = !/\:(id|.*Id)/.test(r.path);
      if (isCollection) {
        const arr = Array.from({ length: items }, (_, i) => {
          const obj: Record<string, unknown> = { id: i + 1 };
          r.fields.forEach((f) => { obj[f.name] = fakeValue(f.type, i, f.name, rnd); });
          return obj;
        });
        mocks[`${r.method} ${r.path}`] = arr;
      } else {
        const obj: Record<string, unknown> = { id: 1 };
        r.fields.forEach((f) => { obj[f.name] = fakeValue(f.type, 0, f.name, rnd); });
        mocks[`${r.method} ${r.path}`] = obj;
      }
    });

    const serverJs = `// Generated by JONTRIX static-json-mock-api-server — zero dependencies.
// Run: node mock-api.js  → serves every route below with deterministic data.
const http = require('http');
const routes = ${JSON.stringify(mocks, null, 2)};
const server = http.createServer((req, res) => {
  const key = \`\${req.method} \${req.url.split('?')[0]}\`;
  const hit = routes[key];
  if (!hit) { res.writeHead(404, {'content-type':'application/json'}); res.end(JSON.stringify({error:'no mock for ' + key})); return; }
  res.writeHead(200, {'content-type':'application/json'});
  res.end(JSON.stringify(hit, null, 2));
});
server.listen(process.env.PORT || 3001);
console.log('mock API on http://localhost:' + (process.env.PORT || 3001));`;

    return {
      data: {
        routes: routes.map((r) => `${r.method} ${r.path}`),
        mocks,
        server_js: serverJs,
        filename: 'mock-api.js',
        invalid_lines: bad,
      },
      warnings: [
        ...bad.map((b) => `skipped: ${b}`),
        'fake data is seeded synthetic — never wire this server to real users',
      ],
      ms: 0,
    } satisfies JontResult;
  },
};

export const GENERATOR_ENGINES = [examQuestionBankBuilder, citationFormatter, worksheetRubricGenerator, changelogFromGitLog, quizGeneratorFromNotes, spreadsheetGenerator, staticJsonMockApi];
