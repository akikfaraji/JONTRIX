#!/usr/bin/env node
// JONTRIX one-shot environment setup — `npm run setup`
//
// Single program that takes a fresh clone (or a broken checkout) to a fully
// working local environment. Idempotent: safe to re-run any time; existing
// values are never clobbered, missing ones are filled in.
//
//   1. preflight        Node >= 20.9 (Next 16), npm present
//   2. dependencies     npm install (skipped with --skip-install)
//   3. environment      .env created/repaired from the canonical template,
//                       secrets auto-generated, DATABASE_URL pinned absolute
//                       (CLI and runtime then provably hit ONE file)
//   4. prisma client    npx prisma generate
//   5. database         schema push (declarative, idempotent; --fresh wipes)
//   6. seed             4 plans + 247 jonts (upsert-only, never duplicates)
//   7. verify           scripts/verify-db.ts — VOL-04 §7 contract check
//   8. build            only with --build — .next is wiped first: dev-server
//                       artifacts poison the build (/_global-error prerender
//                       crashes with a null-useContext TypeError)
//   9. smoke test       reuses a server already live on :3000; otherwise boots
//                       the standalone production server after --build, or a
//                       temporary dev server otherwise, and polls /api/health
//                       until { ok: true, db: 'up' }
//
// Flags: --fresh  wipe the SQLite db and rebuild + reseed
//        --build  also run the production build at the end
//        --no-smoke  skip the live server check
//        --skip-install  skip npm install
//        --help
//
// Environment precedence for child processes: values parsed from .env WIN
// over shell exports. Rationale: .env is this repo's tracked, deliberate
// config source; platform-injected stale exports (CI sandboxes, reused
// shells) must not silently point prisma/seed/verify at the wrong database.
// On hosts where .env does not exist, real platform env vars apply as usual.

import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = path.join(ROOT, '.env');

const args = process.argv.slice(2);
const OPT = {
  fresh: args.includes('--fresh'),
  build: args.includes('--build'),
  smoke: !args.includes('--no-smoke'),
  install: !args.includes('--skip-install'),
};
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: npm run setup [-- --fresh] [-- --build] [-- --no-smoke] [-- --skip-install]');
  process.exit(0);
}

// ── reporting helpers (plain text — no color, no emoji, log-friendly) ───────

let stepNo = 0;
let stepLabel = '';
function step(title) {
  stepNo += 1;
  stepLabel = title;
  console.log(`\n── [${stepNo}/9] ${title}${' '.repeat(Math.max(1, 44 - title.length))} ──`);
}
function ok(msg) { console.log(`  ok    ${msg}`); }
function fix(msg) { console.log(`  fix   ${msg}`); }
function warn(msg) { console.log(`  warn  ${msg}`); }
function die(msg) {
  console.error(`\n  SETUP FAILED at step ${stepNo} (${stepLabel}): ${msg}`);
  console.error('  Fix the issue and re-run `npm run setup` — everything already done stays done.');
  process.exit(1);
}

// ── child process helpers ────────────────────────────────────────────────────

function npmBin(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}
function localBin(name) {
  const p = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);
  return fs.existsSync(p) ? p : npmBin(name);
}

// .env values win over inherited shell env (see header rationale).
let dotEnvValues = {};
function childEnv(extra = {}) {
  return { ...process.env, ...dotEnvValues, ...extra };
}

function run(cmd, argv, { env, timeout = 300_000, label, showOutput = false } = {}) {
  const res = spawnSync(cmd, argv, {
    cwd: ROOT,
    env: env ?? childEnv(),
    timeout,
    stdio: showOutput ? ['ignore', 'inherit', 'inherit'] : ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  if (res.error) {
    die(`${label}: could not start \u201c${cmd} ${argv.join(' ')}\u201d (${res.error.message})`);
  }
  if (res.status !== 0) {
    const tail = `${res.stdout || ''}${res.stderr || ''}`.split('\n').slice(-25).join('\n');
    die(`${label} exited with code ${res.status}\n${tail}`);
  }
  return res;
}

// ── .env handling ────────────────────────────────────────────────────────────

function parseEnvFile(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function randBase64(n) { return crypto.randomBytes(n).toString('base64'); }
function randHex(n) { return crypto.randomBytes(n).toString('hex'); }

// Canonical template — mirrors .env.example (same keys, same order, same docs).
// `secret` kinds are auto-generated when empty; `optional` keys may stay empty.
const TEMPLATE = [
  { sec: '1. REQUIRED — database + origin + signing' },
  { key: 'DATABASE_URL', note: 'sqlite; setup pins it absolute so CLI and runtime share one file' },
  { key: 'APP_ORIGIN', def: 'http://localhost:3000', note: 'canonical public origin, no trailing slash (email links + OAuth callbacks)' },
  { key: 'AUTH_SECRET', secret: 'b64', optional: false, note: 'HMAC secret for sessions/tokens; generated once, kept across re-runs' },
  { sec: '2. EMAIL — real delivery needs host+user+pass; otherwise the mailer logs codes' },
  { key: 'SMTP_HOST', optional: true, def: '' },
  { key: 'SMTP_PORT', optional: true, def: '587' },
  { key: 'SMTP_SECURE', optional: true, def: 'false' },
  { key: 'SMTP_USER', optional: true, def: '' },
  { key: 'SMTP_PASS', optional: true, secret: 'keep' },
  { key: 'SMTP_FROM', optional: true, def: 'JONTRIX <no-reply@your-domain>' },
  { sec: '3. OAUTH — optional; register the callback URLs printed at the end' },
  { key: 'GOOGLE_CLIENT_ID', optional: true, def: '' },
  { key: 'GOOGLE_CLIENT_SECRET', optional: true, secret: 'keep' },
  { key: 'GITHUB_CLIENT_ID', optional: true, def: '' },
  { key: 'GITHUB_CLIENT_SECRET', optional: true, secret: 'keep' },
  { sec: '4. TELEGRAM + ADS — optional features' },
  { key: 'TELEGRAM_BOT_TOKEN', optional: true, secret: 'keep' },
  { key: 'TELEGRAM_WEBHOOK_SECRET', optional: true, secret: 'hex' },
  { key: 'MINIAPP_URL', optional: true, def: 'https://t.me/JONTRIX_bot/app' },
  { key: 'NEXT_PUBLIC_ADSGRAM_ID', optional: true, def: '' },
  { key: 'ADSGRAM_VERIFY_KEY', optional: true, secret: 'keep' },
  { key: 'BOOST_SALT', optional: false, secret: 'hex', note: 'claim hashing salt; generated once' },
  { sec: '5. RUNTIME' },
  // NODE_ENV is deliberately NOT a managed key: it is a derived runtime mode
  // (next dev -> development, next build/start -> production). Setting it in
  // .env — especially "development" — breaks `next build` (the /_global-error
  // prerender crashes with a null-useContext TypeError). setup strips it.
];

function setupEnvironment() {
  const existing = fs.existsSync(ENV_FILE)
    ? parseEnvFile(fs.readFileSync(ENV_FILE, 'utf8'))
    : {};

  if (!fs.existsSync(ENV_FILE)) fix('.env missing — creating from the canonical template');
  else ok('.env found — merging (existing values are never clobbered)');

  const values = {};
  const generated = [];
  const defaulted = [];

  // NODE_ENV is a derived mode, not configuration — a stray "development"
  // value ships in the tracked .env historically and kills the production
  // build. Remove it wherever it appears (next dev / build / start set it).
  if (existing.NODE_ENV !== undefined) {
    fix(`stripped NODE_ENV="${existing.NODE_ENV}" from .env (derived runtime mode — a stray "development" breaks next build; next dev/build/start set it themselves)`);
    delete existing.NODE_ENV;
  }

  for (const entry of TEMPLATE) {
    if (entry.sec) continue;
    const prev = existing[entry.key];
    let val = prev !== undefined && prev !== '' ? prev : undefined;

    if (val === undefined && entry.def !== undefined && entry.def !== '') {
      val = entry.def;
      defaulted.push(entry.key);
    }
    if (val === undefined && entry.secret === 'b64') { val = randBase64(32); generated.push(entry.key); }
    if (val === undefined && entry.secret === 'hex') { val = randHex(16); generated.push(entry.key); }
    if (val === undefined) val = '';

    // DATABASE_URL: pin relative/empty sqlite URLs to an absolute path under
    // <repo>/db/ — relative file: URLs resolve differently for the Prisma CLI
    // (schema-relative) and the query engine (cwd-relative), which has bitten
    // this project before. Absolute removes the whole ambiguity class.
    if (entry.key === 'DATABASE_URL') {
      if (val === '' || !/^[a-z][a-z0-9+.-]*:/.test(val)) {
        val = `file:${path.join(ROOT, 'db', 'jontrix.db')}`;
        if (prev !== val) fix(`DATABASE_URL pinned to ${val}`);
      } else if (val.startsWith('file:')) {
        const p = val.slice('file:'.length).split('?')[0];
        if (!path.isAbsolute(p)) {
          val = `file:${path.join(ROOT, p)}`;
          fix(`DATABASE_URL relative path pinned absolute: ${val}`);
        } else {
          fs.mkdirSync(path.dirname(p), { recursive: true });
        }
      } // non-file: URLs (hosted postgres) pass through untouched
    }

    if (entry.key === 'APP_ORIGIN' && val.endsWith('/')) {
      val = val.replace(/\/+$/, '');
      fix(`APP_ORIGIN trailing slash removed -> ${val}`);
    }

    values[entry.key] = val;
    delete existing[entry.key];
  }

  const unknown = Object.entries(existing).filter(([, v]) => v !== '');

  const lines = [
    '# JONTRIX environment — maintained by `npm run setup` (idempotent).',
    '# Reference: .env.example (full docs) and docs/ENV-SETUP.md.',
    '# Hand-made additions are preserved below the KNOWN-KEYS marker.',
    '',
  ];
  for (const entry of TEMPLATE) {
    if (entry.sec) { lines.push('', `# ${entry.sec}`); continue; }
    if (entry.note) lines.push(`# ${entry.note}`);
    lines.push(`${entry.key}="${values[entry.key]}"`);
  }
  if (unknown.length) {
    lines.push('', '# KNOWN-KEYS-END — your extra variables are preserved here');
    for (const [k, v] of unknown) lines.push(`${k}="${v}"`);
  }
  fs.writeFileSync(ENV_FILE, `${lines.join('\n')}\n`, 'utf8');

  dotEnvValues = { ...values };
  return { values, generated, defaulted, unknownCount: unknown.length };
}

const SENSITIVE = new Set([
  'AUTH_SECRET', 'SMTP_PASS', 'GOOGLE_CLIENT_SECRET', 'GITHUB_CLIENT_SECRET',
  'TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', 'ADSGRAM_VERIFY_KEY', 'BOOST_SALT',
]);

function report(values, meta) {
  console.log('\n── environment report ──────────────────────────────────────────');
  for (const entry of TEMPLATE) {
    if (entry.sec) continue;
    const v = values[entry.key];
    const tag = meta.generated.includes(entry.key) ? 'GENERATED'
      : v === '' ? 'empty (optional feature off)'
      : meta.defaulted.includes(entry.key) ? 'defaulted' : 'set';
    const shown = SENSITIVE.has(entry.key)
      ? (v ? '(hidden)' : '')
      : v;
    console.log(`  ${entry.key.padEnd(24)} ${tag.padEnd(28)} ${shown}`);
  }
  if (meta.unknownCount) console.log(`  + ${meta.unknownCount} custom variable(s) preserved`);
}

// ── smoke test ───────────────────────────────────────────────────────────────

async function fetchHealth(port, ms) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(ms) });
    const body = await res.json().catch(() => null);
    return { up: true, status: res.status, body };
  } catch {
    return { up: false };
  }
}

// Raw TCP occupancy — never spawn a boot test into an occupied port (Next dev
// refuses to start when another dev server runs for the same project dir).
function tcpInUse(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' });
    const done = (v) => { sock.destroy(); resolve(v); };
    sock.setTimeout(700);
    sock.on('connect', () => done(true));
    sock.on('timeout', () => done(true)); // listening but silent = occupied
    sock.on('error', () => done(false));
  });
}

function memAvailableMB() {
  try {
    const m = fs.readFileSync('/proc/meminfo', 'utf8').match(/^MemAvailable:\s+(\d+) kB/m);
    return m ? Number(m[1]) / 1024 : null;
  } catch { return null; }
}

// Heap cap for low-memory devices (Android/Termux): the dev server's first
// route compile spikes memory, and Android responds with SIGKILL.
function heapCapMB() {
  const avail = memAvailableMB();
  if (avail == null || avail >= 1536) return null;
  return Math.max(512, Math.min(1536, Math.floor(avail * 0.5)));
}

async function smokeTest(mode /* 'dev' | 'prod' */) {
  const reused = await fetchHealth(3000, 1500);
  if (reused.up) {
    ok(`a server is already live on :3000 (v${reused.body?.version ?? '?'}) — probing it instead of booting a second one`);
    if (reused.body?.ok) { ok(`health: db=up, version=${reused.body.version}`); return; }
    die(`server on :3000 reports db=down — check DATABASE_URL / the db file`);
  }

  const cap = heapCapMB();
  if (cap) warn(`only ${memAvailableMB().toFixed(0)} MB RAM available — enforcing Node heap cap ${cap} MB for the boot test`);

  // pick a port that is truly free at the TCP level
  let port = 3100;
  for (; port <= 3119; port++) { if (!(await tcpInUse(port))) break; }

  // dev boots get one retry (a first-run crash often leaves a torn .next or
  // an unlucky memory spike); the production server was just built — if it
  // dies it is environmental, and the doctor owns that diagnosis.
  const attempts = mode === 'dev' ? 2 : 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const outcome = await bootAndProbe(mode, port, cap, attempt > 1);
    if (outcome.passed) return;
    if (attempt < attempts) {
      warn(`boot attempt ${attempt} died (${outcome.diedAs}) — retrying once with .next wiped and the heap cap enforced`);
      try { fs.rmSync(path.join(ROOT, '.next'), { recursive: true, force: true }); } catch { /* */ }
    } else {
      die(
        `the live boot check could not complete (${outcome.diedAs}). ` +
        'Steps 1-8 already succeeded — the environment IS ready; only the boot verification failed, which points at the device/environment, not the project.\n' +
        (outcome.tail ? `Log tail:\n${outcome.tail}\n` : '') +
        'Run `npm run doctor` — it diagnoses OOM / Android phantom-process killer / limits / paths and applies fixes.',
      );
    }
  }
}

function bootAndProbe(mode, port, cap, quiet) {
  return new Promise((resolve) => {
    let spawnEnv;
    let cmd;
    let args;
    let perAttemptMs;
    let deadlineMs;
    if (mode === 'prod') {
      spawnEnv = childEnv({ NODE_ENV: 'production', PORT: String(port), HOSTNAME: '127.0.0.1', NEXT_TELEMETRY_DISABLED: '1' });
      cmd = process.execPath;
      args = [path.join(ROOT, '.next', 'standalone', 'server.js')];
      perAttemptMs = 10_000;
      deadlineMs = 90_000;
    } else {
      spawnEnv = childEnv({ NEXT_TELEMETRY_DISABLED: '1' });
      cmd = localBin('next');
      args = ['dev', '-p', String(port)];
      perAttemptMs = 60_000;
      deadlineMs = 300_000;
    }
    if (cap) spawnEnv.NODE_OPTIONS = `--max-old-space-size=${cap}`;
    if (!quiet) console.log(`  boot  ${mode === 'prod' ? 'standalone production server' : 'next dev'} on :${port} (temporary — killed after the probe)`);
    const child = spawn(cmd, args, {
      cwd: ROOT, env: spawnEnv, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
    });
    const logLines = [];
    child.stdout.on('data', (d) => { logLines.push(String(d)); if (logLines.length > 60) logLines.shift(); });
    child.stderr.on('data', (d) => { logLines.push(String(d)); if (logLines.length > 60) logLines.shift(); });

    const killTree = (sig) => {
      try { process.kill(-child.pid, sig); } catch { try { child.kill(sig); } catch { /* gone */ } }
    };
    let exited = null; // { code, signal, message? } — signal !== null means an external killer
    child.on('exit', (code, signal) => { exited ??= { code, signal }; });
    child.on('error', (err) => { exited ??= { code: -1, signal: null, message: err.message }; });
    const tail = () => logLines.join('').slice(-1500);

    (async () => {
      try {
        const deadline = Date.now() + deadlineMs;
        while (Date.now() < deadline) {
          if (exited) {
            killTree('SIGKILL');
            resolve({ passed: false, diedAs: exited.message ? `spawn error: ${exited.message}` : exited.signal ? `killed by signal ${exited.signal}` : `exit code ${exited.code}`, tail });
            return;
          }
          const r = await fetchHealth(port, perAttemptMs);
          if (r.up) {
            if (r.body?.ok) { ok(`health: db=up, version=${r.body.version} — the full chain (env -> db -> seed -> server) works`); resolve({ passed: true }); return; }
            killTree('SIGTERM');
            resolve({ passed: false, diedAs: `server answered but health reports db=down (${JSON.stringify(r.body)})`, tail });
            return;
          }
          await new Promise((res) => setTimeout(res, 1000));
        }
        killTree('SIGKILL');
        resolve({ passed: false, diedAs: `health probe timed out after ${deadlineMs / 1000} s`, tail });
      } catch (e) {
        killTree('SIGKILL');
        resolve({ passed: false, diedAs: `probe error: ${e?.message ?? e}`, tail });
      }
    })();
  });
}

// ── main ─────────────────────────────────────────────────────────────────────

console.log('JONTRIX setup — one program, everything from clean clone to running app');

// 1. preflight
step('preflight');
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 20 || (maj === 20 && min < 9)) {
  die(`Node >= 20.9 required (Next 16), found ${process.versions.node}`);
}
ok(`node ${process.versions.node}`);
const npmCheck = spawnSync(npmBin('npm'), ['--version'], { shell: process.platform === 'win32' });
if (npmCheck.status !== 0) die('npm not found — install Node.js with npm');
ok(`npm ${String(npmCheck.stdout).trim()}`);

// 2. dependencies
step('dependencies (npm install)');
const nm = path.join(ROOT, 'node_modules');
if (!fs.existsSync(nm)) fix('node_modules missing — full install required');
if (!OPT.install) {
  warn('skipped (--skip-install)');
} else {
  console.log('  (output inherited — this is the slow step on first run)');
  run(npmBin('npm'), ['install', '--no-audit', '--no-fund', '--loglevel=error'], { label: 'npm install', timeout: 900_000, showOutput: true });
  ok('dependencies installed');
}

// 3. environment
step('environment (.env create / repair)');
const envMeta = setupEnvironment();
ok('.env written');
for (const g of envMeta.generated) fix(`${g} generated (kept across re-runs)`);

// 4. prisma client
step('prisma client (generate)');
run(localBin('prisma'), ['generate'], { label: 'prisma generate', timeout: 300_000 });
ok('client generated');

// 5. database
step('database (schema push)');
if (OPT.fresh) {
  const dbPath = envMeta.values.DATABASE_URL.startsWith('file:')
    ? envMeta.values.DATABASE_URL.slice('file:'.length).split('?')[0]
    : null;
  if (dbPath && fs.existsSync(dbPath)) {
    for (const suffix of ['', '-wal', '-shm', '-journal']) {
      try { fs.rmSync(`${dbPath}${suffix}`, { force: true }); } catch { /* best effort */ }
    }
    fix(`--fresh: wiped ${dbPath}`);
  }
}
run(localBin('prisma'), ['db', 'push', '--accept-data-loss', '--skip-generate'], { label: 'prisma db push', timeout: 180_000 });
ok('schema applied');

// 6. seed
step('seed (4 plans + 247 jonts — upsert-only)');
run(localBin('tsx'), ['prisma/seed.ts'], { label: 'seed', timeout: 180_000 });
ok('catalog in place');

// 7. verify
step('verify (VOL-04 §7 contract)');
run(localBin('tsx'), ['scripts/verify-db.ts'], { label: 'db verify', timeout: 180_000, showOutput: true });

// 8. optional build — ALWAYS on a clean .next: dev-server artifacts left in
// .next poison the build (the /_global-error prerender crashes with a
// null-useContext TypeError). A wiped .next is exactly what a fresh CI clone
// gets, so this is also the honest test of what deploys will see.
step('production build (optional)');
if (!OPT.build) console.log('  skip  (pass --build to validate the production build)');
else {
  fs.rmSync(path.join(ROOT, '.next'), { recursive: true, force: true });
  fix('wiped .next (dev artifacts break the build)');
  console.log('  (output inherited)');
  run(npmBin('npm'), ['run', 'build'], {
    label: 'npm run build',
    timeout: 1_200_000,
    showOutput: true,
    // Belt and braces: some CI shells export NODE_ENV; a development value
    // here crashes the build (see the RUNTIME note in the .env template).
    env: childEnv({ NODE_ENV: 'production' }),
  });
  ok('production build green');
}

// 9. smoke test — after the build so it probes the real production artifact
// when one exists (a dev boot would re-pollute .next). Either way it reuses
// a server already live on :3000 instead of spawning a second one.
step('smoke test (/api/health on a live server)');
if (!OPT.smoke) warn('skipped (--no-smoke)');
else await smokeTest(OPT.build ? 'prod' : 'dev');

// final report
report(envMeta.values, envMeta);
const origin = envMeta.values.APP_ORIGIN;
console.log(`
── next steps ──────────────────────────────────────────────────────────────────
  dev server          npm run dev            (${origin})
  production          npm run setup -- --build && npm run start
  re-run any time     npm run setup          (idempotent, never clobbers)
  reset database      npm run setup -- --fresh

  OAuth callbacks to register at the providers, exactly:
    Google  ${origin}/api/auth/oauth/google/callback
    GitHub  ${origin}/api/auth/oauth/github/callback
  Optional features that are OFF until their keys are filled in .env:
    email delivery (SMTP_*), Google/GitHub sign-in, Telegram bot, AdsGram ads.
  Nothing else is needed — the app self-heals its database at boot too.
`);
