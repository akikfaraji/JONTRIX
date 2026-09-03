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

export const VALIDATOR_ENGINES = [corsEchoDiagnose, aiProvenanceReport, shopifyCsvPreflight, mcpConfigValidator, aiSlopTextLinter, jwtDecoderVerifier];
