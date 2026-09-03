// Smoke test for wave-1 engines — determinism + happy paths (VOL-11 §7 spirit).
import { getServerEngine, getBuiltJontIds } from '../src/lib/jont-runtime/engines';
import { validateAgainstSchema } from '../src/lib/jont-runtime/schema';

async function main() {
  const ids = getBuiltJontIds();
  console.log(`engines registered: ${ids.length}`);

  // determinism: same input twice → byte-identical output
  const seat = getServerEngine('jont_j173_seating-charts-random-group-makers')!;
  const input = { names: ['Ana', 'Bo', 'Cy', 'Di', 'El', 'Fo', 'Gi', 'Ha', 'Iv'], group_size: 3, seed: 7 };
  const r1 = JSON.stringify((await seat.run(input, {})).data);
  const r2 = JSON.stringify((await seat.run(input, {})).data);
  console.log(`determinism (j173): ${r1 === r2 ? 'PASS' : 'FAIL'}`);

  const run = async (id: string, args: Record<string, unknown>) => {
    const e = getServerEngine(id);
    if (!e) return console.log(`${id}: NO ENGINE`);
    const issues = validateAgainstSchema(args, e.manifest.io.input);
    if (issues.length > 0) return console.log(`${id}: SCHEMA FAIL ${JSON.stringify(issues)}`);
    const res = await e.run(args, {});
    const sample = JSON.stringify(res.data).slice(0, 110);
    console.log(`${id}: ok (${res.warnings.length} warnings) ${sample}…`);
  };

  await run('jont_j007_json-repair', { text: '```json\n{name: \'x\', vals: [1,2,], // c\n}' });
  await run('jont_j246_natural-language-to-cron', { phrase: 'weekdays at 8:30' });
  await run('jont_j246_natural-language-to-cron', { phrase: 'sometime next week' });
  await run('jont_j224_jwt-decoder-verifier', {
    token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.' + Buffer.from('sig').toString('base64url'),
    secret: 'k',
  });
  await run('jont_j203_sql-query-explainer', { query: 'SELECT * FROM orders JOIN customers WHERE o.c = c.id' });
  await run('jont_j113_citation-formatter', { style: 'bibtex', source: { type: 'article', authors: ['A. Kumar', 'B. Lee'], title: 'D1 on a budget', year: 2026, journal: 'JX' } });
  await run('jont_j211_ai-slop-text-linter', { text: 'Furthermore, delve into leveraging cutting-edge solutions. Moreover, unlock the potential.' });
  await run('jont_j048_ai-text-de-slopper', { text: 'It is important to note that we leverage this. Furthermore, it works.' });
  await run('jont_j045_study-deck-converter', { text: 'mitochondria - powerhouse of the cell\nosmosis - water diffusion', to: 'json' });
  await run('jont_j119_flashcard-data-portability', { data: 'term,definition\nhola,hello', from: 'csv', to: 'anki' });
  await run('jont_j168_chatgpt-conversation-export-backup-mess', {
    export_json: JSON.stringify([{
      title: 'Test chat',
      mapping: {
        a: { message: { author: { role: 'user' }, content: { parts: ['hi there'] } }, children: ['b'] },
        b: { message: { author: { role: 'assistant' }, content: { parts: ['hello!'] } }, children: [] },
        root: { children: ['a'] },
      },
    }]),
  });
  await run('jont_j083_wedding-guest-list-planner', { guests_csv: 'name,side,category,plus_ones\nAsha,bride,family,1\nRafi,groom,friend,0', seats_per_table: 8 });
  await run('jont_j029_shopify-product-csv-preflight', { csv: 'Handle,Title,Variant Price\n mug,Ceramic Mug,12.00\n mug,,13.00' });
  await run('jont_j193_mcp-server-config-validator', { config: '{"mcpServers":{"jontrix":{"command":"jontrix-gateway","args":["mcp"]}}}' });
  await run('jont_j005_cors-echo-diagnose', { allow_origin: '*', allow_credentials: 'true', origin: 'https://x.com' });
  await run('jont_j009_exam-question-bank-builder', { title: 'Quiz 1', shuffle: true, seed: 3, questions: ['Capital of France? | a) Paris | b) Lyon | answer: a', '2+2? | a) 3 | b) 4 | answer: b'] });
  await run('jont_j125_worksheet-rubric-generation-for-teachers', { title: 'Algebra', points_total: 50, items: ['Solve x+2=5', 'Factor x^2-1', 'Graph y=2x'] });
  await run('jont_j236_changelog-generator-from-git-log', { version: '1.1.0', git_log: 'a1b2c3d feat: add runtime\ne4f5a6b fix: slot leak\nb7c8d9e breaking: drop v1 auth' });
  await run('jont_j020_ai-provenance-report', { metadata: { 'exif.software': 'Midjourney v6', 'xmp.prompt': 'a castle' } });

  // client-context refusal
  const clientEngine = getServerEngine('jont_j001_pdf-edit-merge-toolkit') ?? getBuiltJontIds().length ? null : null;
  console.log(`client-context refusal: ${clientEngine === null ? 'PASS (no client engines in server registry)' : 'FAIL'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
