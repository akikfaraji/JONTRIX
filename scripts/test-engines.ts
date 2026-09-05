// Consolidated engine acceptance — EVERY registered engine (server + client)
// is exercised and asserted:
//   1. schema self-consistency: a schema-derived sample passes validation
//      (tools needing rich structured input use the curated INPUTS map);
//   2. execution safety: the engine NEVER throws a raw crash — a domain
//      refusal uses the "CODE|message" honest-error convention, a success
//      returns serializable data;
//   3. determinism: identical input → byte-identical output (C5);
//   4. T11.5: client engines never appear in the server registry;
//   5. targeted known-answer checks (j246, j113, j173, j015, j065).
// New engines are covered the moment they register — no drift.

import { getServerEngine, getBuiltJontIds } from '../src/lib/jont-runtime/engines';
import { getClientEngine, getBuiltClientJontIds } from '../src/lib/jont-runtime/client-engines';
import { validateAgainstSchema } from '../src/lib/jont-runtime/schema';

let green = 0;
let red = 0;
const fails: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) green++;
  else {
    red++;
    fails.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`RED   ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const isHonestRefusal = (msg: string): boolean => /^[A-Z][A-Z0-9_]{2,39}\|/.test(msg);

const INPUTS: Record<string, Record<string, unknown>> = {
  // server tools with structured input
  "jont_j009_exam-question-bank-builder": { title: 'Quiz 1', questions: ['2+2? |3|4| answer:4', 'Define osmosis | answer: diffusion of water'] },
  "jont_j113_citation-formatter": { style: 'bibtex', source: { type: 'article', authors: ['A. Kumar', 'B. Lee'], title: 'D1 on a budget', year: 2026, journal: 'JX' } },
  "jont_j168_chatgpt-conversation-export-backup-mess": { export_json: JSON.stringify([{ title: 'T', mapping: { r: { children: ['a'] }, a: { message: { author: { role: 'user' }, content: { parts: ['hi'] } }, children: [] } } }]) },
  "jont_j173_seating-charts-random-group-makers": { names: ['Ana', 'Bo', 'Cy', 'Di', 'El', 'Fo', 'Gi', 'Ha', 'Iv'], group_size: 3, seed: 7 },
  "jont_j083_wedding-guest-list-planner": { guests_csv: 'name,side,category,plus_ones\nAsha,bride,family,1\nRafi,groom,friend,0', seats_per_table: 8 },
  "jont_j224_jwt-decoder-verifier": { token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2ln', secret: 'k' },
  "jont_j229_sports-league-scheduling-for-volunteers": { teams: 'Arsenal\nBees\nCity\nDons', rounds: 'single' },
  "jont_j222_telegram-group-export-analyzer": { export_json: JSON.stringify({ messages: [{ id: 1, type: 'message', date: '2026-01-01T10:00:00', from: 'ana', text: 'hello all' }, { id: 2, type: 'service', date: '2026-01-01T10:01:00', action: 'join' }, { id: 3, type: 'message', date: '2026-01-01T10:05:00', from: 'bo', text: 'hi ana' }] }) },
  "jont_j201_quiz-generator-from-notes": { notes: 'Mitochondria are the powerhouse of the cell. Osmosis is the diffusion of water across a membrane. Photosynthesis converts light energy into chemical energy. The cell membrane is a lipid bilayer.' },
  "jont_j020_ai-provenance-report": { metadata: { file: 'a.png', tool: 'generator-x' }, text: 'The quick brown fox jumps over the lazy dog.' },
  "jont_j125_worksheet-rubric-generation-for-teachers": { title: 'Algebra', items: ['Solve x: 2x + 3 = 7', 'Factor x^2 - 9'] },
  "jont_j246_natural-language-to-cron": { phrase: 'daily at 9' },
  "jont_j236_changelog-generator-from-git-log": { git_log: 'a1b2c3 feat: add runtime\nb7c8d9e feat!: drop v1 auth\nc4d5e6 fix: null crash', version: '1.1.0' },
  "jont_j193_mcp-server-config-validator": { config: '{"mcpServers":{"jontrix":{"command":"node","args":["server.js"]}}}' },
  // client tools with structured input
  "jont_j015_csv-splitter": { csv: 'h1,h2\n1,2\n3,4\n5,6', chunk_rows: 2 },
  "jont_j026_sql-dialect-migrator": { sql: "SELECT a FROM t WHERE b = 'x' LIMIT 5", direction: 'mysql→postgresql' },
  "jont_j034_delimiter-detector": { csv: 'a;b;c\n1;2;3' },
  "jont_j037_duplicate-row-finder": { csv: 'name,city\nana,lima\nbo,la\nana,lima', key_columns: 'name' },
  "jont_j046_timestamp-normalizer": { text: 'meeting at 2026-01-01 10:00 UTC and 2026-06-01T12:30:00Z' },
  "jont_j049_nested-json-csv": { input: '{"id":1,"name":{"first":"Ada"},"city":"london"}' },
  "jont_j055_json-jsonl-converter": { input: '{"a":1}\n{"a":2}' },
  "jont_j056_srt-subtitle-validator": { srt: '1\n00:00:01,000 --> 00:00:03,000\nHello\n' },
  "jont_j064_json-diff-checker": { json_a: '{"x":1,"y":2}', json_b: '{"x":1,"z":3}' },
  "jont_j065_json-to-typescript-go": { json: '{"name":"Ada","age":36,"tags":["x"]}' },
  "jont_j068_csv-joiner": { csv_a: 'id,name\n1,A\n2,B', csv_b: 'id,role\n1,dev\n2,ops', join_key: 'id', join_type: 'inner' },
  "jont_j069_subtitle-sync-offset-fixer": { srt: '1\n00:00:05,000 --> 00:00:07,000\nHi\n', offset_ms: 500 },
  "jont_j077_csv-header-normalizer": { csv: 'First Name,City\nA,X\nB,Y' },
  "jont_j004_leading-zero-date-guard": { csv: 'sku,qty\n0012,3\n0099,1' },
};

/** Schema-derived sample; overridden by curated INPUTS when present. */
function sampleArgs(id: string, manifest: { io: { input: { required?: string[]; properties?: Record<string, unknown> } } }): Record<string, unknown> {
  if (INPUTS[id]) return INPUTS[id];
  const props = (manifest.io.input.properties ?? {}) as Record<string, { type?: string; enum?: unknown[] }>;
  const args: Record<string, unknown> = {};
  for (const [k, p] of Object.entries(props)) {
    if (p.enum && p.enum.length > 0) args[k] = p.enum[0];
    else if (p.type === 'number') args[k] = 2;
    else if (p.type === 'boolean') args[k] = false;
    else if (p.type === 'array') args[k] = ['alpha', 'beta'];
    else args[k] = 'alpha - one\nbeta - two';
  }
  return args;
}

async function main() {
  const serverIds = getBuiltJontIds();
  const clientIds = getBuiltClientJontIds();
  console.log(`engines registered: ${serverIds.length} server + ${clientIds.length} client`);

  const universal = async (id: string, ctx: 'server' | 'client') => {
    const e = ctx === 'server' ? getServerEngine(id) : getClientEngine(id);
    if (!e) {
      check(`${id} registered in ${ctx}`, false, 'not found in registry');
      return;
    }
    const args = sampleArgs(id, e.manifest);
    const issues = validateAgainstSchema(args, e.manifest.io.input);
    check(`${id} schema-self-consistent`, issues.length === 0, JSON.stringify(issues).slice(0, 100));
    if (issues.length > 0) return;
    try {
      const r1 = await e.run(structuredClone(args), {});
      const r2 = await e.run(structuredClone(args), {});
      const a = JSON.stringify(r1.data);
      const b = JSON.stringify(r2.data);
      check(`${id} executes + deterministic (${ctx})`, a === b, a.slice(0, 70));
      check(`${id} warnings array (${ctx})`, Array.isArray(r1.warnings));
    } catch (err) {
      const msg = (err as Error).message ?? String(err);
      check(`${id} no raw crash (${ctx})`, isHonestRefusal(msg), msg.slice(0, 90));
    }
  };

  for (const id of serverIds) await universal(id, 'server');
  for (const id of clientIds) await universal(id, 'client');

  // T11.5 — registry isolation
  const leaked = clientIds.filter((cid) => getServerEngine(cid) !== null);
  check('client engines excluded from server registry', leaked.length === 0, leaked.join(','));

  // ── targeted known answers ────────────────────────────────────────────────
  const j246 = getServerEngine('jont_j246_natural-language-to-cron')!;
  const cron = (await j246.run({ phrase: 'weekdays at 8:30' }, {})).data as { cron: string };
  check('j246 known answer', cron.cron === '30 8 * * 1-5', JSON.stringify(cron));
  const cron2 = (await j246.run({ phrase: 'sometime next week' }, {})).data as { supported: boolean };
  check('j246 honest unsupported', cron2.supported === false, JSON.stringify(cron2));

  const j173 = getServerEngine('jont_j173_seating-charts-random-group-makers')!;
  const g1 = JSON.stringify((await j173.run(INPUTS["jont_j173_seating-charts-random-group-makers"], {})).data);
  const g2 = JSON.stringify((await j173.run(INPUTS["jont_j173_seating-charts-random-group-makers"], {})).data);
  check('j173 seeded determinism', g1 === g2);

  const j113 = getServerEngine('jont_j113_citation-formatter')!;
  const cite = (await j113.run(INPUTS["jont_j113_citation-formatter"], {})).data as { citation: string };
  check('j113 bibtex shape', /@article\{kumar2026,/.test(cite.citation) && /author.*Kumar/.test(cite.citation), cite.citation.slice(0, 50));

  const c015 = getClientEngine('jont_j015_csv-splitter')!;
  const split = (await c015.run(INPUTS["jont_j015_csv-splitter"], {})).data as { parts: Array<{ rows: number }> };
  check('j015 splits into chunks', split.parts.length === 2, JSON.stringify(split.parts));

  const c065 = getClientEngine('jont_j065_json-to-typescript-go')!;
  const ts = JSON.stringify((await c065.run(INPUTS["jont_j065_json-to-typescript-go"], {})).data);
  check('j065 emits typescript', /name/.test(ts) && /string/.test(ts), ts.slice(0, 70));

  console.log('───');
  console.log(`ENGINE SWEEP: ${green} GREEN, ${red} RED`);
  if (red > 0) {
    console.log(fails.join('\n'));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
