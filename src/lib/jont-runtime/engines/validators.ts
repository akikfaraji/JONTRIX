// Validator-pattern engines — VOL-11 §3: data + rule set → findings[];
// findings carry row/field pointers. Deterministic rule evaluation only.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { JontEngine, JontResult } from '../types';
import { countPhrase, parseCsv } from '../util';

export interface Finding {
  severity: 'error' | 'warning' | 'info';
  field?: string;
  row?: number;
  message: string;
}

// ─── jont_j005_cors-echo-diagnose ──────────────────────────────────────────

export const corsEchoDiagnose: JontEngine = {
  manifest: {
    id: 'jont_j005_cors-echo-diagnose',
    pattern: 'validator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['allow_origin'],
        properties: {
          allow_origin: { type: 'string', description: 'the server Access-Control-Allow-Origin value' },
          origin: { type: 'string', description: 'the browser Origin that failed' },
          allow_credentials: { type: 'string', description: 'Access-Control-Allow-Credentials value' },
          allow_methods: { type: 'string', description: 'Access-Control-Allow-Methods value' },
          allow_headers: { type: 'string', description: 'Access-Control-Allow-Headers value' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p05', score: 7.53 },
  },
  run(input): JontResult {
    const findings: Finding[] = [];
    const allowOrigin = String(input.allow_origin ?? '');
    const origin = String(input.origin ?? '');
    const allowCredentials = String(input.allow_credentials ?? '');
    const allowMethods = String(input.allow_methods ?? '');

    if (!allowOrigin) {
      findings.push({ severity: 'error', field: 'allow_origin', message: 'no Access-Control-Allow-Origin header detected — browsers will block every cross-origin response' });
    } else if (allowOrigin === '*') {
      if (allowCredentials.toLowerCase() === 'true') {
        findings.push({ severity: 'error', field: 'allow_origin', message: 'wildcard origin with credentials=true is invalid per fetch spec — browsers reject it; echo the exact origin instead' });
      } else {
        findings.push({ severity: 'warning', field: 'allow_origin', message: 'wildcard origin is fine for public GETs but cannot ever carry cookies' });
      }
    } else if (origin && allowOrigin !== origin) {
      findings.push({ severity: 'error', field: 'allow_origin', message: `header says "${allowOrigin}" but the request came from "${origin}" — scheme, host, and port must match exactly` });
    } else {
      findings.push({ severity: 'info', field: 'allow_origin', message: `origin "${allowOrigin}" matches the caller` });
    }

    if (origin && !allowMethods) {
      findings.push({ severity: 'warning', field: 'allow_methods', message: 'no Access-Control-Allow-Methods — preflight OPTIONS will fail for non-simple methods (POST with JSON, PUT, DELETE)' });
    }
    if (origin && !input.allow_headers) {
      findings.push({ severity: 'info', field: 'allow_headers', message: 'no Access-Control-Allow-Headers — only simple headers (Accept, Content-Language, Content-Type without custom values) survive preflight' });
    }
    if (allowMethods && !allowMethods.toUpperCase().includes('OPTIONS')) {
      findings.push({ severity: 'warning', field: 'allow_methods', message: 'OPTIONS missing from allow-methods — some stacks preflight with it explicitly' });
    }

    return {
      data: {
        verdict: findings.some((f) => f.severity === 'error') ? 'broken' : 'workable',
        findings,
      },
      warnings: [],
      ms: 0,
    };
  },
};

// ─── jont_j020_ai-provenance-report ────────────────────────────────────────

const AI_GENERATOR_PATTERNS = /(midjourney|dall-?e|stable[- ]diffusion|sdxl|flux|imagen|firefly|grok|gpt-?4o|gemini|leonardo|ideogram|recraft|krea)/i;

export const aiProvenanceReport: JontEngine = {
  manifest: {
    id: 'jont_j020_ai-provenance-report',
    pattern: 'validator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['metadata'],
        properties: {
          metadata: { type: 'object', description: 'parsed file metadata (EXIF/XMP/C2PA fields) as a flat object' },
          filename: { type: 'string', description: 'original filename, checked for generator hints' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p20', score: 7.55 },
  },
  run(input): JontResult {
    const findings: Finding[] = [];
    const meta = (input.metadata ?? {}) as Record<string, unknown>;
    const flat: Record<string, string> = {};
    const walk = (obj: Record<string, unknown>, prefix: string) => {
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) walk(v as Record<string, unknown>, key);
        else flat[key.toLowerCase()] = String(v ?? '');
      }
    };
    walk(meta, '');

    // 1. C2PA / content-credentials presence
    const c2paKeys = Object.keys(flat).filter((k) => k.includes('c2pa') || k.includes('jumbf') || k.includes('claim_generator'));
    if (c2paKeys.length > 0) {
      findings.push({ severity: 'info', field: c2paKeys[0], message: `C2PA-style provenance data present (${c2paKeys.length} field(s)): ${c2paKeys.slice(0, 3).join(', ')}` });
      const gen = c2paKeys.map((k) => flat[k]).find((v) => AI_GENERATOR_PATTERNS.test(v));
      if (gen) findings.push({ severity: 'error', field: 'claim_generator', message: `generator identifies itself as AI-generated: "${gen.slice(0, 80)}"` });
    } else {
      findings.push({ severity: 'warning', field: 'c2pa', message: 'no C2PA/content-credentials block found — absence is not proof of human origin, most tools strip or never write it' });
    }

    // 2. Software/producer tags
    const software = flat['exif.software'] ?? flat['xmp.xmpcreatortool'] ?? flat['ifd0.software'] ?? '';
    if (software) {
      if (AI_GENERATOR_PATTERNS.test(software)) {
        findings.push({ severity: 'error', field: 'software', message: `software tag names an AI generator: "${software.slice(0, 80)}"` });
      } else {
        findings.push({ severity: 'info', field: 'software', message: `software tag: "${software.slice(0, 80)}"` });
      }
    }

    // 3. prompt remnants
    const promptKeys = Object.keys(flat).filter((k) => k.includes('prompt') || k.includes('parameters') || k.includes('seed'));
    if (promptKeys.length > 0) {
      findings.push({ severity: 'error', field: promptKeys[0], message: `generation remnants found (${promptKeys.length} field(s), e.g. ${promptKeys.slice(0, 3).join(', ')}) — diffusion tools embed prompts/seeds` });
    }

    // 4. filename hint
    const filename = String(input.filename ?? '');
    if (filename && AI_GENERATOR_PATTERNS.test(filename)) {
      findings.push({ severity: 'warning', field: 'filename', message: `filename mentions a known AI generator: "${filename.slice(0, 80)}"` });
    }

    const verdict = findings.some((f) => f.severity === 'error')
      ? 'ai-signatures-present'
      : findings.some((f) => f.severity === 'warning')
        ? 'no-signatures-found'
        : 'clean-metadata';

    return {
      data: { verdict, findings },
      warnings: ['this is a deterministic metadata check, not proof — provenance absence proves nothing (honest scope, VOL-01 §3)'],
      ms: 0,
    };
  },
};

// ─── jont_j029_shopify-product-csv-preflight ───────────────────────────────

export const shopifyCsvPreflight: JontEngine = {
  manifest: {
    id: 'jont_j029_shopify-product-csv-preflight',
    pattern: 'validator',
    context: 'server',
    io: {
      input: { type: 'object', required: ['csv'], properties: { csv: { type: 'string', description: 'product CSV export' } } },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p29', score: 7.53 },
  },
  run(input): JontResult {
    const text = String(input.csv ?? '');
    const rows = parseCsv(text);
    const findings: Finding[] = [];
    if (rows.length === 0) {
      return { data: { verdict: 'empty', findings: [{ severity: 'error', message: 'no rows parsed' }] }, warnings: [], ms: 0 };
    }
    const header = rows[0].map((h) => h.trim());
    const col = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

    const handleIdx = col('Handle');
    const titleIdx = col('Title');
    const priceIdx = col('Variant Price');
    const bodyIdx = col('Body (HTML)');

    if (handleIdx === -1) findings.push({ severity: 'error', field: 'Handle', message: 'required column "Handle" missing' });
    if (titleIdx === -1) findings.push({ severity: 'error', field: 'Title', message: 'required column "Title" missing' });
    if (priceIdx === -1) findings.push({ severity: 'error', field: 'Variant Price', message: 'required column "Variant Price" missing' });

    const seenHandles = new Map<string, number>();
    let products = 0;
    let variants = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNo = i + 1;
      const handle = handleIdx >= 0 ? (row[handleIdx] ?? '').trim() : '';
      const title = titleIdx >= 0 ? (row[titleIdx] ?? '').trim() : '';
      const price = priceIdx >= 0 ? (row[priceIdx] ?? '').trim() : '';

      if (handle) {
        products++;
        if (!seenHandles.has(handle)) seenHandles.set(handle, rowNo);
      } else {
        variants++;
      }

      if (title.length > 255) {
        findings.push({ severity: 'error', row: rowNo, field: 'Title', message: `title is ${title.length} chars — Shopify caps at 255, import will truncate or refuse` });
      }
      if (price && !/^\d+(\.\d{1,2})?$/.test(price)) {
        findings.push({ severity: 'error', row: rowNo, field: 'Variant Price', message: `"${price}" is not a plain number — currency symbols and thousand separators break the importer` });
      }
      if (handle && !/^[a-z0-9._~-]+$/i.test(handle)) {
        findings.push({ severity: 'warning', row: rowNo, field: 'Handle', message: `"${handle}" contains characters Shopify will rewrite (spaces, unicode) — pre-normalize for stable URLs` });
      }
    }

    // duplicate-handle continuity: rows with the same handle must be contiguous
    let lastHandle = '';
    let lastRow = -1;
    for (let i = 1; i < rows.length; i++) {
      const handle = handleIdx >= 0 ? (rows[i][handleIdx] ?? '').trim() : '';
      if (!handle) continue;
      if (handle === lastHandle && i - lastRow > 1) {
        findings.push({ severity: 'error', row: i + 1, field: 'Handle', message: `variant rows for "${handle}" are interrupted — all rows of one product must be contiguous` });
      }
      if (handle !== lastHandle) {
        lastHandle = handle;
        lastRow = i;
      }
    }

    if (bodyIdx === -1) {
      findings.push({ severity: 'warning', field: 'Body (HTML)', message: 'no description column — products import with empty descriptions' });
    }

    const errors = findings.filter((f) => f.severity === 'error').length;
    return {
      data: {
        verdict: errors > 0 ? 'import-will-fail' : 'preflight-clean',
        rows_total: rows.length - 1,
        products,
        extra_variant_rows: variants,
        findings,
      },
      warnings: [],
      ms: 0,
    };
  },
};

// ─── jont_j193_mcp-server-config-validator ─────────────────────────────────

export const mcpConfigValidator: JontEngine = {
  manifest: {
    id: 'jont_j193_mcp-server-config-validator',
    pattern: 'validator',
    context: 'server',
    io: {
      input: { type: 'object', required: ['config'], properties: { config: { type: 'string', description: 'contents of an MCP host config file (claude_desktop_config.json et al.)' } } },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p193', score: 7.0 },
  },
  run(input): JontResult {
    const text = String(input.config ?? '');
    const findings: Finding[] = [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return {
        data: { verdict: 'unparseable', findings: [{ severity: 'error', message: `JSON parse failed: ${(e as Error).message}` }] },
        warnings: [],
        ms: 0,
      };
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        data: { verdict: 'invalid', findings: [{ severity: 'error', message: 'top level must be an object' }] },
        warnings: [],
        ms: 0,
      };
    }
    const root = parsed as Record<string, unknown>;
    const servers = root.mcpServers;
    if (!servers || typeof servers !== 'object' || Array.isArray(servers)) {
      findings.push({ severity: 'error', field: 'mcpServers', message: 'missing or malformed "mcpServers" object' });
    } else {
      for (const [name, entry] of Object.entries(servers as Record<string, unknown>)) {
        if (typeof entry !== 'object' || entry === null) {
          findings.push({ severity: 'error', field: `mcpServers.${name}`, message: 'entry must be an object' });
          continue;
        }
        const e = entry as Record<string, unknown>;
        if (typeof e.command !== 'string' || e.command.length === 0) {
          findings.push({ severity: 'error', field: `mcpServers.${name}.command`, message: 'command must be a non-empty string (the executable or "npx"/"uvx")' });
        }
        if (e.args !== undefined) {
          if (!Array.isArray(e.args) || e.args.some((a) => typeof a !== 'string')) {
            findings.push({ severity: 'error', field: `mcpServers.${name}.args`, message: 'args must be an array of strings' });
          }
        }
        if (e.env !== undefined) {
          if (typeof e.env !== 'object' || e.env === null || Array.isArray(e.env) || Object.values(e.env).some((v) => typeof v !== 'string')) {
            findings.push({ severity: 'error', field: `mcpServers.${name}.env`, message: 'env must be an object of string→string' });
          }
        }
        if (e.url !== undefined && e.command !== undefined) {
          findings.push({ severity: 'warning', field: `mcpServers.${name}`, message: 'both command and url present — stdio and remote entries are mutually exclusive' });
        }
        if (/jx_(pat|aat)_[A-Za-z0-9]/.test(JSON.stringify(e))) {
          findings.push({ severity: 'error', field: `mcpServers.${name}`, message: 'a JONTRIX token literal appears in the config — hosts must spawn the gateway, never embed tokens (VOL-10 §1)' });
        }
      }
      if (Object.keys(servers as Record<string, unknown>).length === 0) {
        findings.push({ severity: 'warning', field: 'mcpServers', message: 'mcpServers is empty — nothing will launch' });
      }
    }

    const errors = findings.filter((f) => f.severity === 'error').length;
    return {
      data: { verdict: errors > 0 ? 'invalid' : 'valid', servers: Object.keys((servers as Record<string, unknown>) ?? {}), findings },
      warnings: [],
      ms: 0,
    };
  },
};

// ─── jont_j211_ai-slop-text-linter ─────────────────────────────────────────

const SLOP_RULES: Array<[string, string]> = [
  ['delve', 'overused AI marker verb'],
  ['tapestry', 'overused AI metaphor'],
  ['testament', 'overused AI metaphor'],
  ['furthermore', 'stiff connective'],
  ['moreover', 'stiff connective'],
  ['seamless', 'overused AI adjective'],
  ['leverage', 'corporate filler'],
  ['utilize', 'corporate filler'],
  ['cutting-edge', 'overused AI adjective'],
  ['game-changer', 'overused AI hype'],
  ['revolutionize', 'overused AI hype'],
  ['navigate the complexities', 'overused AI phrase'],
  ['in the realm of', 'overused AI phrase'],
  ['it is important to note', 'filler preamble'],
  ['when it comes to', 'vague connective'],
  ['unlock the potential', 'overused AI phrase'],
];

export const aiSlopTextLinter: JontEngine = {
  manifest: {
    id: 'jont_j211_ai-slop-text-linter',
    pattern: 'validator',
    context: 'server',
    io: {
      input: { type: 'object', required: ['text'], properties: { text: { type: 'string', description: 'text to lint' } } },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p211', score: 7.0 },
  },
  run(input): JontResult {
    const text = String(input.text ?? '');
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const findings: Finding[] = [];
    let hits = 0;

    for (const [phrase, note] of SLOP_RULES) {
      const n = countPhrase(text, phrase);
      if (n > 0) {
        hits += n;
        findings.push({ severity: wordCount < 120 ? 'warning' : 'info', field: phrase, message: `${n}× "${phrase}" — ${note}` });
      }
    }

    const emDashes = (text.match(/—/g) ?? []).length;
    const emDensity = wordCount > 0 ? emDashes / wordCount : 0;
    if (emDashes > 0 && emDensity > 0.005) {
      findings.push({ severity: 'warning', field: 'em-dash', message: `${emDashes} em-dashes in ${wordCount} words — heavy em-dash density is a common AI tell` });
    }

    const rulet = /\bnot only\b[\s\S]{0,120}?\bbut also\b/g;
    const notOnly = (text.match(rulet) ?? []).length;
    if (notOnly > 0) {
      findings.push({ severity: 'info', field: 'not only… but also', message: `${notOnly}× "not only… but also" construction` });
    }

    const slopScore = wordCount > 0 ? Math.min(100, Math.round((hits * 1000) / wordCount)) : 0;
    return {
      data: {
        verdict: slopScore >= 15 ? 'heavy-slop' : slopScore >= 5 ? 'noticeable-slop' : 'clean',
        slop_score: slopScore,
        words: wordCount,
        findings,
      },
      warnings: ['rule-based linter: measures phrase patterns, not meaning (honest scope)'],
      ms: 0,
    };
  },
};

// ─── jont_j224_jwt-decoder-verifier ────────────────────────────────────────

function base64UrlDecode(seg: string): string {
  const pad = seg.length % 4 === 0 ? '' : '='.repeat(4 - (seg.length % 4));
  return Buffer.from(seg.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}

export const jwtDecoderVerifier: JontEngine = {
  manifest: {
    id: 'jont_j224_jwt-decoder-verifier',
    pattern: 'validator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'the JWT (three dot-separated segments)' },
          secret: { type: 'string', description: 'HMAC secret for signature verification (optional; never echoed back)' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'FREE',
    mcp_exposed: true,
    evidence: { problem_row: 'E1-p224', score: 7.0 },
  },
  run(input): JontResult {
    const token = String(input.token ?? '').trim();
    const findings: Finding[] = [];
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        data: { verdict: 'malformed', findings: [{ severity: 'error', message: `expected 3 dot-separated segments, got ${parts.length}` }] },
        warnings: [],
        ms: 0,
      };
    }

    const warnings: string[] = [];
    let header: Record<string, unknown> = {};
    let payload: Record<string, unknown> = {};
    try {
      header = JSON.parse(base64UrlDecode(parts[0])) as Record<string, unknown>;
    } catch {
      findings.push({ severity: 'error', field: 'header', message: 'header segment does not decode to JSON' });
    }
    try {
      payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
    } catch {
      findings.push({ severity: 'error', field: 'payload', message: 'payload segment does not decode to JSON' });
    }

    const alg = String(header.alg ?? 'none');
    if (alg === 'none') {
      findings.push({ severity: 'error', field: 'alg', message: 'alg=none — unsigned token, trivially forgeable' });
    }

    const nowSec = 0; // determinism: expiry evaluated only when caller passes now_iso
    void nowSec;
    const nowIso = input.now_iso === undefined ? undefined : String(input.now_iso);
    if (payload.exp !== undefined && nowIso) {
      const exp = Number(payload.exp);
      const now = Math.floor(new Date(nowIso).getTime() / 1000);
      if (!Number.isNaN(exp) && exp < now) {
        findings.push({ severity: 'error', field: 'exp', message: `token expired at ${new Date(exp * 1000).toISOString()} (caller-provided now=${nowIso})` });
      }
    } else if (payload.exp === undefined) {
      warnings.push('no exp claim — token never expires');
    }

    let signature_valid: boolean | null = null;
    const secret = input.secret === undefined ? undefined : String(input.secret);
    if (secret !== undefined && alg.startsWith('HS')) {
      const expected = createHmac(
        alg === 'HS384' ? 'sha384' : alg === 'HS512' ? 'sha512' : 'sha256',
        secret,
      )
        .update(`${parts[0]}.${parts[1]}`)
        .digest('base64url');
      const a = Buffer.from(expected);
      const b = Buffer.from(parts[2]);
      signature_valid = a.length === b.length && timingSafeEqual(a, b);
      findings.push({
        severity: signature_valid ? 'info' : 'error',
        field: 'signature',
        message: signature_valid ? 'HMAC signature verifies against the provided secret' : 'HMAC signature does NOT match the provided secret',
      });
    } else if (secret !== undefined) {
      warnings.push(`verification of alg=${alg} needs the public key flow — this engine verifies HMAC (HS*) only`);
    }

    const errors = findings.filter((f) => f.severity === 'error').length;
    return {
      data: {
        verdict: errors > 0 ? 'invalid' : signature_valid === false ? 'signature-mismatch' : 'structurally-valid',
        header,
        payload,
        signature_valid,
        findings,
      },
      warnings,
      ms: 0,
    };
  },
};

// ─── jont_j014_citation-verifier ───────────────────────────────────────────

export const citationVerifier: JontEngine = {
  manifest: {
    id: 'jont_j014_citation-verifier',
    pattern: 'validator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['citations'],
        properties: {
          citations: { type: 'array', items: { type: 'string' }, description: 'one citation per item (APA / MLA / Chicago-ish)' },
          style: { type: 'string', enum: ['apa', 'mla', 'chicago'], description: 'house style the citations should follow' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'MAX',
    mcp_exposed: true,
    evidence: { problem_row: 'WG-G4', score: 7.6 },
  },
  run(input): JontResult {
    const raw = Array.isArray(input.citations) ? (input.citations as unknown[]) : [];
    const style = typeof input.style === 'string' ? input.style.toLowerCase() : 'apa';
    const findings: Array<{ index: number; severity: 'error' | 'warning' | 'info'; message: string }> = [];
    let checked = 0;

    raw.forEach((c, i) => {
      const cite = String(c ?? '').trim();
      if (!cite) {
        findings.push({ index: i, severity: 'error', message: 'empty citation' });
        return;
      }
      checked += 1;

      if (cite.length < 20) {
        findings.push({ index: i, severity: 'warning', message: 'suspiciously short — a complete citation is rarely under 20 characters' });
      }

      // year: any 4-digit year 1400-2100, in parentheses for APA
      const bareYear = /(?:1[4-9]|20)\d{2}/.exec(cite);
      if (!bareYear) {
        findings.push({ index: i, severity: 'error', message: 'no publication year found (expected a 4-digit year)' });
      } else if (style === 'apa' && !/\((?:1[4-9]|20)\d{2}\)/.test(cite)) {
        findings.push({ index: i, severity: 'warning', message: 'APA places the year in parentheses after the author: (2021)' });
      }

      // title heuristics: quotes or italics markers are not required, but a
      // citation without any sentence-case segment after the year is suspect
      const afterYear = bareYear ? cite.slice((cite.indexOf(bareYear[0]) ?? 0) + bareYear[0].length) : '';
      if (afterYear.replace(/[^A-Za-z]/g, '').length < 8) {
        findings.push({ index: i, severity: 'error', message: 'no title text after the year — the citation looks truncated' });
      }

      // author init heuristics: starts with uppercase word (surname)
      if (!/^[A-Z][A-Za-z'’-]/.test(cite)) {
        findings.push({ index: i, severity: 'warning', message: 'citations conventionally begin with the author surname (capitalized)' });
      }

      // URL sanity
      const url = /https?:\/\/\S+/.exec(cite);
      if (url) {
        if (/\.(pdf|docx?)(\?|$)/i.test(url[0]) === false && !/https?:\/\/(dx\.)?doi\.org/.test(url[0])) {
          findings.push({ index: i, severity: 'info', message: 'link is a bare web page — a DOI (https://doi.org/…) link is more stable for reviewers' });
        }
        if (/[)\]]$/.test(url[0])) {
          findings.push({ index: i, severity: 'warning', message: 'URL swallowed a closing bracket/parenthesis — paste it again or wrap it in <>' });
        }
      }

      // double spaces / stray separators
      if (/ {2,}/.test(cite)) {
        findings.push({ index: i, severity: 'info', message: 'double spaces found — run the final formatting pass' });
      }
      if (/,,|\.\.|;;/.test(cite)) {
        findings.push({ index: i, severity: 'error', message: 'doubled punctuation (,, or .. or ;;) — almost always a copy glitch' });
      }
    });

    const errors = findings.filter((f) => f.severity === 'error').length;
    return {
      data: {
        style,
        checked,
        clean: checked - errors,
        error_count: errors,
        warning_count: findings.filter((f) => f.severity === 'warning').length,
        findings,
      },
      warnings: raw.length === 0 ? ['no citations supplied'] : [],
      ms: 0,
    };
  },
};

// ─── jont_j060_telegram-mini-app-shell ─────────────────────────────────────

export const telegramMiniAppShell: JontEngine = {
  manifest: {
    id: 'jont_j060_telegram-mini-app-shell',
    pattern: 'validator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['init_data'],
        properties: {
          init_data: { type: 'string', format: 'textarea', description: 'the window.Telegram.WebApp.initData string' },
          bot_token: { type: 'string', description: 'optional bot token — when present the HMAC signature is actually verified' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'MAX',
    mcp_exposed: true,
    evidence: { problem_row: 'GT-TG-telegram-platform', score: 6.9 },
  },
  run(input): JontResult {
    const init = String(input.init_data ?? '').trim();
    if (!init) throw new Error('NO_INIT_DATA|init_data is required');
    const token = typeof input.bot_token === 'string' ? input.bot_token.trim() : '';
    const findings: Array<{ severity: 'error' | 'warning' | 'info'; message: string }> = [];

    const params = new URLSearchParams(init);
    const pairs: Array<[string, string]> = [];
    params.forEach((value, key) => pairs.push([key, value]));

    const hasHash = params.has('hash');
    const userRaw = params.get('user');
    const authDate = params.get('auth_date');

    let user: { id?: number; first_name?: string; username?: string } | null = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw) as { id?: number; first_name?: string; username?: string };
      } catch {
        findings.push({ severity: 'error', message: 'user field is not valid JSON' });
      }
    } else {
      findings.push({ severity: 'error', message: 'no user field — the WebApp never received the identity payload' });
    }

    if (!authDate) {
      findings.push({ severity: 'error', message: 'no auth_date — replay protection and freshness checks are impossible' });
    } else {
      const ts = Number(authDate) * 1000;
      if (!Number.isFinite(ts)) {
        findings.push({ severity: 'error', message: 'auth_date is not a unix timestamp' });
      } else {
        const ageH = (Date.now() - ts) / 3_600_000;
        if (ageH > 24) findings.push({ severity: 'warning', message: `initData is ${Math.round(ageH)}h old — production checks should reject anything older than 24h` });
        if (ageH < -1) findings.push({ severity: 'warning', message: 'auth_date is in the future — clock skew or forgery' });
      }
    }

    let signature_verified: boolean | null = null;
    if (hasHash && token) {
      // Telegram WebApp signature: secret = HMAC_SHA256(key="WebAppData", msg=bot_token);
      // hash = HMAC_SHA256(key=secret, msg=data_check_string)
      const dataCheckString = pairs
        .filter(([k]) => k !== 'hash')
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
      const secret = createHmac('sha256', 'WebAppData').update(token).digest();
      const calc = createHmac('sha256', secret).update(dataCheckString).digest('hex');
      const provided = (params.get('hash') ?? '').toLowerCase();
      const a = Buffer.from(calc, 'hex');
      const b = Buffer.from(provided, 'hex');
      signature_verified = a.length === b.length && timingSafeEqual(a, b);
      if (!signature_verified) {
        findings.push({ severity: 'error', message: 'HMAC signature MISMATCH for this bot token — the data was not produced by your bot (or was tampered with)' });
      }
    } else if (!hasHash) {
      findings.push({ severity: 'error', message: 'no hash field — the payload cannot be authenticated at all' });
    } else {
      findings.push({ severity: 'info', message: 'bot_token not supplied — structural checks only; supply it to verify the HMAC signature' });
    }

    if (user && typeof user.id !== 'number') {
      findings.push({ severity: 'warning', message: 'user.id is missing or not numeric' });
    }

    const errors = findings.filter((f) => f.severity === 'error').length;
    return {
      data: {
        verdict: errors > 0 ? 'invalid' : signature_verified === false ? 'signature-mismatch' : signature_verified === true ? 'verified' : 'structurally-valid',
        user: user ? { id: user.id ?? null, name: user.first_name ?? null, username: user.username ?? null } : null,
        auth_date: authDate,
        signature_verified,
        findings,
      },
      warnings: [],
      ms: 0,
    };
  },
};

// ─── jont_j171_ai-code-review-linter ───────────────────────────────────────

export const aiCodeReviewLinter: JontEngine = {
  manifest: {
    id: 'jont_j171_ai-code-review-linter',
    pattern: 'validator',
    context: 'server',
    io: {
      input: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', format: 'textarea', description: 'source to lint (JS/TS/Python rules applied where they match)' },
          max_line_length: { type: 'number', description: 'line-length budget (default 120)' },
        },
      },
      output: { type: 'object' },
    },
    tier_fit: 'PRO',
    mcp_exposed: true,
    evidence: { problem_row: 'GT-EDU-ai-WG-G7', score: 6.0 },
  },
  run(input): JontResult {
    const src = String(input.code ?? '');
    if (!src.trim()) throw new Error('CODE_EMPTY|no code supplied');
    const budget = Math.max(40, Math.min(400, Number(input.max_line_length ?? 120) || 120));
    const findings: Array<{ line: number; rule: string; severity: 'error' | 'warning' | 'info'; message: string }> = [];
    const lines = src.split(/\r?\n/);

    const isPython = /^\s*def\s+\w+|^\s*import\s+\w+|:\s*$/m.test(src) && !/;\s*$/m.test(src.replace(/["'`][^"'`]*["'`]/g, ''));
    const isJs = /\b(const|let|var|function|=>)\b/.test(src);

    lines.forEach((line, idx) => {
      const n = idx + 1;
      if (line.length > budget) findings.push({ line: n, rule: 'max-len', severity: 'info', message: `line is ${line.length} chars (budget ${budget})` });
      if (/[ \t]+$/.test(line)) findings.push({ line: n, rule: 'no-trailing-whitespace', severity: 'info', message: 'trailing whitespace' });
      if (/\t/.test(line) && isJs) findings.push({ line: n, rule: 'no-tabs', severity: 'info', message: 'tab character in JS/TS source — spaces keep diffs consistent' });

      if (/TODO|FIXME|HACK|XXX/.test(line)) findings.push({ line: n, rule: 'no-open-todos', severity: 'warning', message: 'open TODO/FIXME marker left in the change' });
      if (!isPython && /console\.log\(/.test(line)) findings.push({ line: n, rule: 'no-console', severity: 'warning', message: 'console.log left in source' });
      if (isPython && /(^|\s)print\(/.test(line) && !/def print/.test(line)) findings.push({ line: n, rule: 'no-print', severity: 'warning', message: 'bare print() — use logging in production paths' });
      if (/\bvar\s+\w+\s*=/.test(line)) findings.push({ line: n, rule: 'no-var', severity: 'warning', message: 'var declaration — prefer const/let' });
      if (/[^=!<>]==[^=]/.test(line)) findings.push({ line: n, rule: 'eqeqeq', severity: 'warning', message: 'loose == comparison — use === to avoid coercion bugs' });
      if (/eval\(|new Function\(/.test(line)) findings.push({ line: n, rule: 'no-eval', severity: 'error', message: 'eval/new Function — arbitrary code execution risk' });
      if (/innerHTML\s*=/.test(line) && !/textContent/.test(line)) findings.push({ line: n, rule: 'no-raw-innerhtml', severity: 'warning', message: 'innerHTML assignment — XSS sink unless the content is sanitized' });
      if (/(api[_-]?key|secret|password|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{12,}['"]/i.test(line)) findings.push({ line: n, rule: 'no-hardcoded-secrets', severity: 'error', message: 'possible hardcoded secret in source' });
      if (/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/.test(line)) findings.push({ line: n, rule: 'no-empty-catch', severity: 'warning', message: 'empty catch block swallows failures silently' });
    });

    const errors = findings.filter((f) => f.severity === 'error').length;
    const warnings = findings.filter((f) => f.severity === 'warning').length;
    return {
      data: {
        language_guess: isPython ? 'python' : isJs ? 'js/ts' : 'text',
        lines: lines.length,
        error_count: errors,
        warning_count: warnings,
        info_count: findings.length - errors - warnings,
        verdict: errors > 0 ? 'needs-changes' : warnings > 0 ? 'review-recommended' : 'clean',
        findings: findings.slice(0, 200),
      },
      warnings: findings.length > 200 ? ['findings truncated at 200'] : [],
      ms: 0,
    };
  },
};

export const VALIDATOR_ENGINES = [corsEchoDiagnose, aiProvenanceReport, shopifyCsvPreflight, mcpConfigValidator, aiSlopTextLinter, jwtDecoderVerifier, citationVerifier, telegramMiniAppShell, aiCodeReviewLinter];
