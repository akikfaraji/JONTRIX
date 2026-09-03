// Generator-pattern engines — VOL-11 §3: params → artifact via templating.
// Deterministic: no wall-clock, no unseeded randomness in outputs.

import { createHash } from 'node:crypto';
import type { JontEngine, JontResult } from '../types';
import { fnv1a, seededShuffle, seededRandom } from '../util';

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

export const GENERATOR_ENGINES = [examQuestionBankBuilder, citationFormatter, worksheetRubricGenerator, changelogFromGitLog];
