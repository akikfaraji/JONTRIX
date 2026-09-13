#!/usr/bin/env node
// JONTRIX environment doctor — `npm run doctor`
//
// Diagnoses (and where safe, fixes) everything environmental that can make
// the app — or the setup smoke test — crash suddenly. Written for the
// Android Termux proot-distro Debian case, but every check is generic Linux.
//
// What it covers:
//   1. platform     Debian/Android/proot/Termux detection, root, Android SDK
//                   (>= 31 warns about the phantom-process killer with the
//                   exact adb fix)
//   2. binaries     node/npm/npx/next/prisma resolution, duplicate installs,
//                   PATH entries that do not exist ("android env paths")
//   3. repo paths   spaces/charset, sdcard/FAT noexec locations, write tests,
//                   disk + /tmp free space, HOME
//   4. resources    MemAvailable (OOM), swap, nofile limit, inotify watches,
//                   /dev/shm — auto-raises what a proot root can raise
//   5. project      .env keys, db file, prisma engines + libssl3, executable
//                   bits, .next crash artifacts, stray crashed processes,
//                   ports 3000/3100, oversized logs
//   6. low-memory   writes a Node heap cap into .npmrc (node-options) when
//                   MemAvailable is low — applies to every `npm run` script
//   7. boot test    boots next dev on a free port WITH the heap cap and
//                   captures the exit CODE+SIGNAL if it dies — SIGKILL on a
//                   low-memory Android device pinpoints OOM / phantom killer
//
// Usage:  npm run doctor                 diagnose + safe fixes + boot test
//         npm run doctor -- --fix        also kill stray crashed processes,
//                                        wipe .next, apply limit persistence
//         npm run doctor -- --no-boot-test

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGV = process.argv.slice(2);
const FIX = ARGV.includes('--fix');
const BOOT = !ARGV.includes('--no-boot-test');

// ── output helpers (plain text, same style as setup) ────────────────────────

let counts = { ok: 0, fix: 0, warn: 0, fail: 0 };
let section = '';
function heading(t) { section = t; console.log(`\n── ${t} ${'─'.repeat(Math.max(1, 58 - t.length))}`); }
function line(tag, name, detail = '') {
  counts[tag] = (counts[tag] ?? 0) + 1;
  const prefix = { ok: '  ok    ', fix: '  fix   ', warn: '  warn  ', fail: '  FAIL  ' }[tag];
  console.log(`${prefix}${name}${detail ? ` — ${detail}` : ''}`);
}
const ok = (n, d) => line('ok', n, d);
const fixed = (n, d) => line('fix', n, d);
const warn = (n, d) => line('warn', n, d);
const fail = (n, d) => line('fail', n, d);

function spawnOut(cmd, argv, timeout = 20_000) {
  const r = spawnSync(cmd, argv, { cwd: ROOT, timeout, encoding: 'utf8' });
  return { code: r.status ?? -1, out: `${r.stdout || ''}`, err: `${r.stderr || ''}` };
}

// ── small shared helpers ─────────────────────────────────────────────────────

function parseEnvFile(p) {
  const out = {};
  try {
    for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const l = raw.trim();
      if (!l || l.startsWith('#')) continue;
      const eq = l.indexOf('=');
      if (eq <= 0) continue;
      let v = l.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[l.slice(0, eq).trim()] = v;
    }
  } catch { /* missing file handled by caller */ }
  return out;
}

function meminfo() {
  const m = {};
  try {
    for (const l of fs.readFileSync('/proc/meminfo', 'utf8').split('\n')) {
      const mm = l.match(/^(\w+):\s+(\d+) kB/);
      if (mm) m[mm[1]] = Number(mm[2]);
    }
  } catch { /* non-linux */ }
  return m;
}

// Heap cap for low-memory devices — applied via NODE_OPTIONS for the boot
// test and persisted into .npmrc (node-options) so every npm script gets it.
function heapCapMB() {
  const avail = (meminfo().MemAvailable ?? 0) / 1024; // MB
  if (avail === 0 || avail >= 1536) return null;
  return Math.max(512, Math.min(1536, Math.floor(avail * 0.5)));
}

async function fetchHealth(port, ms) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(ms) });
    return { up: true, status: res.status, body: await res.json().catch(() => null) };
  } catch { return { up: false }; }
}

// Raw TCP occupancy — health answers tell us a JONTRIX server is live; this
// tells us ANY process (healthy or wedged) is holding the port, so boot tests
// never spawn into a guaranteed EADDRINUSE death.
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

function npmBin(n) { return process.platform === 'win32' ? `${n}.cmd` : n; }
function localBin(n) {
  const p = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? `${n}.cmd` : n);
  return fs.existsSync(p) ? p : npmBin(n);
}

// ── 1. platform ──────────────────────────────────────────────────────────────

const env = {};
let android = { isAndroid: false, sdk: null, termux: false, proot: false };

function checkPlatform() {
  heading('platform identity');
  let pretty = os.type();
  try { pretty = (fs.readFileSync('/etc/os-release', 'utf8').match(/^PRETTY_NAME="?(.*?)"?$/m) || [])[1] ?? pretty; } catch { /* */ }
  ok('os', pretty);

  let kernel = os.release(), version = '';
  try { version = fs.readFileSync('/proc/version', 'utf8').slice(0, 160).replace(/\n/g, ' '); } catch { /* */ }
  android.isAndroid = /android/i.test(version) || fs.existsSync('/system/build.prop');
  ok('kernel', `${kernel} ${android.isAndroid ? '(Android kernel detected)' : ''}`.trim());

  if (android.isAndroid) {
    let sdk = null;
    try { sdk = Number((fs.readFileSync('/system/build.prop', 'utf8').match(/^ro\.build\.version\.sdk=(\d+)/m) || [])[1]) || null; } catch { /* */ }
    if (sdk == null) {
      const g = spawnOut('/system/bin/getprop', ['ro.build.version.sdk']);
      if (g.code === 0) sdk = Number(g.out.trim()) || null;
    }
    android.sdk = sdk;
    if (sdk != null) ok('android sdk', String(sdk));
    else warn('android sdk', 'could not read (getprop/build.prop) — phantom-killer advice below assumes Android 12+');
  }

  try {
    const mounts = fs.readFileSync('/proc/mounts', 'utf8');
    android.termux = mounts.includes('com.termux');
    android.proot = android.termux;
  } catch { /* */ }
  if (android.termux) ok('termux proot', 'com.termux mounts found — Termux proot-distro confirmed');
  if (process.getuid?.() === 0) ok('user', 'root (fine inside proot; watch out for root-owned files if you switch users)');

  if (android.isAndroid && (android.sdk == null || android.sdk >= 31)) {
    warn('phantom process killer (Android 12+)',
      'Android kills "excess" child processes of apps with SIGKILL — Turbopack workers can hit this. ' +
      'Fix from a PC (or wireless adb): `adb shell device_config set_sync_disabled_for_tests persistent; ' +
      'adb shell device_config put activity_manager max_phantom_processes 2147483647; ' +
      'adb shell settings put global settings_enable_monitor_phantom_procs false`');
  }
}

// ── 2. binaries + paths ──────────────────────────────────────────────────────

function checkBinaries() {
  heading('binaries & PATH');
  const v = spawnOut(process.execPath, ['-v']);
  ok(`node ${v.out.trim() || process.version}`, process.execPath);

  for (const bin of ['node', 'npm', 'npx', 'git']) {
    const r = spawnOut('bash', ['-c', `type -aP ${bin} 2>/dev/null`]);
    const found = (r.out || '').split('\n').map((s) => s.trim()).filter(Boolean);
    if (!found.length) { fail(bin, 'not found in PATH'); continue; }
    if (found.length > 1) warn(bin, `multiple installs resolve — using ${found[0]} (also: ${found.slice(1).join(', ')})`);
    else ok(bin, found[0]);
  }

  const paths = (process.env.PATH || '').split(':').filter(Boolean);
  const missing = paths.filter((p) => { try { return !fs.statSync(p).isDirectory(); } catch { return true; } });
  if (missing.length) warn('PATH', `${missing.length} nonexistent entr${missing.length === 1 ? 'y' : 'ies'}: ${missing.join(', ')}`);
  else ok('PATH', `${paths.length} entries, all exist`);

  const dup = spawnOut('bash', ['-c', 'command -v node | xargs -r readlink -f; ls -1 /usr/bin/node /usr/local/bin/node 2>/dev/null | sort -u | wc -l']);
  if (Number(dup.out.trim()) > 1) warn('node installs', 'more than one node binary present — remove the stale one so dev and npm use the same engine');
}

// ── 3. repo filesystem ───────────────────────────────────────────────────────

async function freeGB(p) {
  try { const s = await fsp.statfs(p); return (s.bavail * s.bsize) / 2 ** 30; } catch { return null; }
}

async function checkRepoFs() {
  heading('repo paths & filesystem');
  if (/\s/.test(ROOT)) warn('repo path', `contains spaces ("${ROOT}") — some tools misbehave; prefer a space-free path`);
  else ok('repo path', ROOT);

  if (/^\/(sdcard|storage|media|mnt\/media)\//.test(ROOT)) {
    fail('repo location', 'on Android shared storage (FAT/sdcardfs) — noexec + no file locking breaks node_modules. Move the repo into the proot filesystem (e.g. ~/JONTRIX)');
  } else ok('repo location', 'native Linux filesystem (exec + locks OK)');

  for (const d of ['.', '.next', 'db', 'prisma', 'node_modules']) {
    const target = path.join(ROOT, d);
    try { fs.mkdirSync(target, { recursive: true }); fs.accessSync(target, fs.constants.W_OK); ok(`writable ${d}/`); }
    catch { fail(`writable ${d}/`, 'not writable — check ownership'); }
  }

  const free = await freeGB(ROOT);
  if (free != null) {
    if (free < 1) fail('disk space', `${free.toFixed(2)} GB free — Next build/dev needs >= 1-2 GB`);
    else ok('disk space', `${free.toFixed(1)} GB free`);
  }
  const tmpFree = await freeGB(os.tmpdir());
  if (tmpFree != null) {
    if (tmpFree < 0.5) fail('/tmp space', `${tmpFree.toFixed(2)} GB — Turbopack writes temp files here`);
    else ok('/tmp space', `${tmpFree.toFixed(1)} GB free (${os.tmpdir()})`);
  }
  ok('HOME', `${process.env.HOME ?? '(unset)'}`);
}

// ── 4. resources ─────────────────────────────────────────────────────────────

async function checkResources() {
  heading('resources (memory / limits / watchers)');
  const mi = meminfo();
  const totalGB = (mi.MemTotal ?? 0) / 2 ** 20;
  const availMB = (mi.MemAvailable ?? 0) / 1024;
  const swapGB = ((mi.SwapTotal ?? 0) - (mi.SwapFree ?? 0)) / 2 ** 20;
  if (totalGB) {
    if (availMB < 700) fail('memory', `${availMB.toFixed(0)} MB available of ${totalGB.toFixed(1)} GB — the dev server WILL be SIGKILLed at compile time (OOM). Close apps, or add swap on the Android side, then re-run.`);
    else if (availMB < 1500) warn('memory', `${availMB.toFixed(0)} MB available — tight for Next 16 dev; a heap cap has been applied where possible`);
    else ok('memory', `${availMB.toFixed(0)} MB available of ${totalGB.toFixed(1)} GB`);
  }
  if (totalGB && (mi.SwapTotal ?? 0) === 0) warn('swap', 'no swap configured — Android kills instead of swapping; even 2 GB swap hugely stabilizes dev servers');

  const nf = spawnOut('bash', ['-c', 'ulimit -Sn; ulimit -Hn']);
  const [soft, hard] = (nf.out || '').split('\n').map((s) => Number(s.trim()));
  if (soft && soft < 4096) {
    const r = spawnOut('prlimit', ['--pid', String(process.pid), '--nofile=65536']);
    if (r.code === 0) fixed('open files (nofile)', `was ${soft} — raised to 65536 for this session's children (add \`ulimit -n 65536\` to your ~/.bashrc to persist)`);
    else warn('open files (nofile)', `soft limit ${soft} is low for Turbopack; run \`ulimit -n 65536\` before npm run dev (could not self-raise: ${r.err.split('\n')[0] || 'prlimit unavailable'})`);
  } else if (soft) ok('open files (nofile)', `soft ${soft}, hard ${hard}`);

  const inotifyPath = '/proc/sys/fs/inotify/max_user_watches';
  let watches = NaN;
  try { watches = Number(fs.readFileSync(inotifyPath, 'utf8').trim()); } catch { /* */ }
  if (!Number.isNaN(watches)) {
    if (watches < 65536) {
      const r = spawnOut('sysctl', ['-w', 'fs.inotify.max_user_watches=524288']);
      if (r.code === 0) fixed('inotify watches', `was ${watches} — raised to 524288 (file watching was exhausting)`);
      else warn('inotify watches', `${watches} is low and /proc/sys is read-only inside proot — if dev logs ever show ENOSPC, reduce watch load or run dev from a plain chroot with raised sysctl`);
    } else ok('inotify watches', String(watches));
  }

  try { const s = await fsp.statfs('/dev/shm'); const shmMB = (s.blocks * s.bsize) / 2 ** 20; ok('/dev/shm', `${shmMB.toFixed(0)} MB`); }
  catch { warn('/dev/shm', 'not available — some native tools expect it (rarely fatal for Next)'); }
}

// ── 5. project artifacts ─────────────────────────────────────────────────────

async function checkProject() {
  heading('project state');
  const envFile = parseEnvFile(path.join(ROOT, '.env'));
  const needKeys = ['DATABASE_URL', 'APP_ORIGIN'];
  for (const k of needKeys) (envFile[k] ? ok : fail)(`.env ${k}`, envFile[k] || 'MISSING');
  if (!envFile.AUTH_SECRET) {
    const secretFile = path.join(ROOT, 'db', 'auth-secret');
    (fs.existsSync(secretFile) ? ok : warn)('signing secret', envFile.AUTH_SECRET ? 'AUTH_SECRET in .env' : (fs.existsSync(secretFile) ? 'auto-persisted at db/auth-secret' : 'neither AUTH_SECRET nor db/auth-secret — it will self-generate at first boot'));
  } else ok('.env AUTH_SECRET', 'set');

  // db path — same resolution rule as src/lib/db.ts (schema dir for relative file: URLs)
  let dbPath = envFile.DATABASE_URL || '';
  if (dbPath.startsWith('file:')) {
    let p = dbPath.slice('file:'.length).split('?')[0];
    if (!path.isAbsolute(p)) p = path.join(ROOT, 'prisma', p);
    dbPath = p;
    const parent = path.dirname(p);
    if (!fs.existsSync(parent)) { fs.mkdirSync(parent, { recursive: true }); fixed('db dir', `${parent} created (was missing — a fresh-clone publish killer)`); }
    (fs.existsSync(p) ? ok : warn)('sqlite file', `${p}${fs.existsSync(p) ? ` (${(fs.statSync(p).size / 1024).toFixed(0)} KB)` : ' — will be created on first boot/schema push'}`);
  } else if (dbPath) ok('database', `non-sqlite URL (${dbPath.split(':')[0]}:…) — sqlite checks skipped`);

  // prisma engines + libssl (engine fails to load -> 503 db:down)
  const engines = fs.existsSync(path.join(ROOT, 'node_modules', '@prisma', 'engines'))
    ? fs.readdirSync(path.join(ROOT, 'node_modules', '@prisma', 'engines')).filter((f) => f.endsWith('.node'))
    : [];
  (engines.length ? ok : fail)('prisma engines', engines.length ? engines.join(', ') : 'missing — run npm install');
  const ssl = spawnOut('bash', ['-c', 'ldconfig -p 2>/dev/null | grep -c "libssl.so.3"']);
  if (ssl.out.trim() === '0') fail('libssl3', 'Prisma query engine needs OpenSSL 3 — install: apt install libssl3');
  else ok('libssl3', 'present');

  for (const b of ['next', 'prisma', 'tsx']) {
    const p = path.join(ROOT, 'node_modules', '.bin', b);
    try { fs.accessSync(p, fs.constants.X_OK); ok(`bin ${b}`, 'present + executable'); }
    catch { fail(`bin ${b}`, p + (fs.existsSync(p) ? ' — not executable (chmod +x)' : ' — missing (npm install)')); }
  }

  const forLogs = ['dev.log', 'server.log'];
  for (const l of forLogs) {
    const p = path.join(ROOT, l);
    if (fs.existsSync(p)) {
      const mb = fs.statSync(p).size / 2 ** 20;
      (mb > 50 ? warn : ok)(`log ${l}`, `${mb.toFixed(1)} MB${mb > 50 ? ' — safe to delete' : ''}`);
    }
  }

  // ports
  for (const port of [3000, 3100]) {
    const r = await fetchHealth(port, 1500);
    if (r.up) {
      if (r.body?.ok) ok(`port ${port}`, `live JONTRIX server (v${r.body.version})`);
      else warn(`port ${port}`, 'something is listening but it is not healthy — a stale/crashed server');
    }
  }

  // stray processes from previous crashes (matched against this repo path only)
  const mine = new Set([process.pid]);
  try {
    let ppid = process.ppid;
    for (let i = 0; i < 8 && ppid > 1; i++) { mine.add(ppid); ppid = Number(fs.readFileSync(`/proc/${ppid}/stat`, 'utf8').split(') ')[1]?.split(' ')[1] ?? 1); }
  } catch { /* */ }
  const strays = [];
  try {
    for (const d of fs.readdirSync('/proc')) {
      if (!/^\d+$/.test(d)) continue;
      const pid = Number(d);
      if (mine.has(pid) || pid === 1) continue;
      let cmd = '';
      try { cmd = fs.readFileSync(`/proc/${d}/cmdline`, 'utf8').replace(/\0/g, ' ').trim(); } catch { continue; }
      if (cmd && cmd.includes(ROOT) && /node|next|turbopack/.test(cmd) && !cmd.includes('doctor.mjs')) strays.push({ pid, cmd: cmd.slice(0, 120) });
    }
  } catch { /* non-linux */ }
  if (strays.length === 0) ok('stray processes', 'none');
  else if (FIX) {
    for (const s of strays) { try { process.kill(s.pid, 'SIGTERM'); } catch { /* gone */ } }
    await new Promise((r) => setTimeout(r, 2000));
    for (const s of strays) { try { process.kill(s.pid, 'SIGKILL'); } catch { /* gone */ } }
    fixed('stray processes', `killed ${strays.length}: ${strays.map((s) => `#${s.pid}`).join(', ')} (leftovers from crashed runs eat RAM and invite OOM)`);
  } else warn('stray processes', `${strays.length} leftover from crashed runs: ${strays.map((s) => `#${s.pid} ${s.cmd.slice(0, 60)}`).join(' | ')} — re-run with -- --fix to kill them`);

  // .next crash artifacts — only wiped when we just killed strays (they died mid-write)
  const nextDir = path.join(ROOT, '.next');
  if (FIX && strays.length > 0 && fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    fixed('.next cache', 'wiped (processes were killed mid-write; a torn cache can crash the next boot)');
  }
}

// ── 6. low-memory persistence ────────────────────────────────────────────────

function applyLowMemoryFixes() {
  heading('low-memory mitigation');
  const cap = heapCapMB();
  if (!cap) { ok('heap cap', 'not needed (plenty of memory)'); return; }
  const npmrcPath = path.join(ROOT, '.npmrc');
  let content = '';
  try { content = fs.readFileSync(npmrcPath, 'utf8'); } catch { /* new file */ }
  if (/^\s*node-options\s*=/m.test(content)) {
    const cur = content.match(/^\s*node-options\s*=\s*(.*?)\s*$/m)?.[1];
    warn('heap cap (.npmrc node-options)', `already set to "${cur}" — edit .npmrc if it should change (recommended ~${cap})`);
    return;
  }
  const block = `\n# added by npm run doctor — Node heap cap for low-memory devices (Android/Termux).\n# Applies to every npm script. Remove these lines on desktop machines.\nnode-options=--max-old-space-size=${cap}\n`;
  fs.writeFileSync(npmrcPath, content.replace(/\s*$/, '\n') + block, 'utf8');
  fixed(`heap cap ${cap} MB`, `written to .npmrc as node-options — every npm run script now boots with it (OOM during route compile was the likely killer)`);
}

// ── 7. boot test with signal forensics ───────────────────────────────────────

async function bootTest(dotEnvValues) {
  heading('live boot test (the crash reproducer)');
  const reused = await fetchHealth(3000, 1500);
  if (reused.up) {
    if (reused.body?.ok) { ok('skipped', `a healthy server is already live on :3000 (v${reused.body.version}) — that IS the boot test passing`); return true; }
    warn('port 3000', 'occupied by an unhealthy server — testing on a separate port instead');
  }

  // pick a port that is truly free (nothing listening at TCP level)
  let port = 3100;
  for (; port <= 3119; port++) { if (!(await tcpInUse(port))) break; }

  const childEnv = { ...process.env, ...dotEnvValues, NEXT_TELEMETRY_DISABLED: '1' };
  const cap = heapCapMB();
  if (cap) childEnv.NODE_OPTIONS = `--max-old-space-size=${cap}`;

  const attempts = cap ? 2 : 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const result = await bootOnce(port, childEnv, attempt > 1);
    if (result.passed) return true;
    if (attempt < attempts) {
      warn(`boot attempt ${attempt} died (${result.diedAs}) — retrying once with .next wiped and the heap cap enforced`);
      try { fs.rmSync(path.join(ROOT, '.next'), { recursive: true, force: true }); } catch { /* */ }
      childEnv.NODE_OPTIONS = `--max-old-space-size=${cap}`;
    } else {
      diagnoseDeath(result, cap);
      return false;
    }
  }
  return false;
}

function bootOnce(port, childEnv, quiet) {
  return new Promise((resolve) => {
    if (!quiet) console.log(`  boot  next dev on :${port}${childEnv.NODE_OPTIONS ? ` (${childEnv.NODE_OPTIONS})` : ''} — will be killed after the probe`);
    const child = spawn(localBin('next'), ['dev', '-p', String(port)], {
      cwd: ROOT, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
    });
    const logLines = [];
    child.stdout.on('data', (d) => { logLines.push(String(d)); if (logLines.length > 80) logLines.shift(); });
    child.stderr.on('data', (d) => { logLines.push(String(d)); if (logLines.length > 80) logLines.shift(); });

    const killTree = (sig) => { try { process.kill(-child.pid, sig); } catch { try { child.kill(sig); } catch { /* */ } } };
    let exited = null; // {code, signal, message?} — signal !== null means an external killer
    child.on('exit', (code, signal) => { exited ??= { code, signal }; });
    child.on('error', (err) => { exited ??= { code: -1, signal: null, message: err.message }; });

    const tail = () => logLines.join('').slice(-2000);

    (async () => {
      const deadline = Date.now() + 300_000;
      let healthyOnce = false;
      try {
        while (Date.now() < deadline) {
          if (exited) { killTree('SIGKILL'); resolve({ passed: false, healthyOnce, diedAs: exited.message ? `spawn error: ${exited.message}` : exited.signal ? `signal ${exited.signal}` : `exit code ${exited.code}`, tail }); return; }
          const r = await fetchHealth(port, 60_000); // generous: first compile on slow devices
          if (r.up && r.body?.ok) {
            if (!healthyOnce) {
              healthyOnce = true;
              if (!quiet) ok(`first probe passed (db=up, v${r.body.version}) — holding 8 s to catch delayed kills`);
              await new Promise((res) => setTimeout(res, 8000));
              continue; // second probe proves survival
            }
            killTree('SIGTERM');
            await new Promise((res) => setTimeout(res, 3000));
            if (!exited) { killTree('SIGKILL'); await new Promise((res) => setTimeout(res, 1500)); }
            resolve({ passed: true, healthyOnce, diedAs: null, tail });
            return;
          }
          await new Promise((res) => setTimeout(res, 1000));
        }
        killTree('SIGKILL');
        resolve({ passed: false, healthyOnce, diedAs: 'timeout (300 s, no healthy answer)', tail });
      } catch (e) {
        killTree('SIGKILL');
        resolve({ passed: false, healthyOnce, diedAs: `probe error: ${e?.message ?? e}`, tail });
      }
    })();
  });
}

function diagnoseDeath(result, cap) {
  const t = result.tail();
  if (result.diedAs === 'signal SIGKILL') {
    const mi = meminfo();
    const availMB = (mi.MemAvailable ?? 0) / 1024;
    if (android.isAndroid && (android.sdk == null || android.sdk >= 31)) {
      fail('boot killed by SIGKILL', 'most likely the Android phantom-process killer (Turbopack spawns workers) or the OOM/low-memory killer. Apply the adb commands printed in the platform section above, free up RAM (see memory line above), then re-run.');
    } else if (availMB < 1200) {
      fail('boot killed by SIGKILL', `only ${availMB.toFixed(0)} MB available — OOM/low-memory killer. Heap cap (${cap ?? 'none'} MB) is applied; close background apps or add swap, then re-run.`);
    } else {
      fail('boot killed by SIGKILL', 'an external killer (OOM/phantom/security policy) took the server. Check: `dmesg | tail -30` for oom-kill lines, and whether a battery-optimizer app targets this process.');
    }
  } else if (/ENOSPC/i.test(t) && /inotify/i.test(t)) {
    fail('boot died', 'inotify watch limit exhausted — see the inotify line above');
  } else if (/EMFILE|too many open files/i.test(t)) {
    fail('boot died', 'file-descriptor limit too low — run `ulimit -n 65536` before npm run dev (see nofile line above)');
  } else {
    fail('boot died', `${result.diedAs} — log tail:\n${t}`);
  }
  console.log('\n  The environment itself (steps 1-8 in npm run setup) is ready — only the live boot is failing.');
  console.log('  Try `npm run dev` directly after applying the fixes above.');
}

// ── main ─────────────────────────────────────────────────────────────────────

console.log('JONTRIX doctor — environmental diagnostic & auto-fix');
checkPlatform();
checkBinaries();
await checkRepoFs();
await checkResources();
await checkProject();
applyLowMemoryFixes();

const dotEnvValues = parseEnvFile(path.join(ROOT, '.env'));
let bootOk = true;
if (BOOT) bootOk = await bootTest(dotEnvValues);
else { heading('live boot test'); console.log('  skip  (--no-boot-test)'); }

console.log(`\n── verdict ${'─'.repeat(48)}`);
console.log(`  ${counts.ok ?? 0} ok | ${counts.fix ?? 0} fixed | ${counts.warn ?? 0} warnings | ${counts.fail ?? 0} failures`);
if (android.isAndroid) {
  console.log('  Android reminders, in order of impact:');
  console.log('    1. keep >= 1.5 GB RAM free when running dev (the heap cap in .npmrc helps)');
  console.log('    2. on Android 12+: disable the phantom-process killer via adb (see platform section)');
  console.log('    3. keep the repo on the proot filesystem, never /sdcard');
}
if (counts.fail > 0 || !bootOk) process.exit(1);
ok('verdict', 'environment is healthy');
