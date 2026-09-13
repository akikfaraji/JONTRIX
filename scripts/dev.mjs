#!/usr/bin/env node
// `npm run dev` — dev-server launcher with a per-device engine override.
//
// `npm run doctor` boots the app through several configurations and, on
// devices where the webpack engine is the one that survives (Turbopack's
// native bundler has known issues on Android/Termux), records that in
// .dev-engine. This wrapper honors the marker so `npm run dev` just works
// everywhere; without a marker it behaves exactly like `next dev -p 3000`,
// including the tee-to-dev.log parity of the old script.
//
//PORT=3100 npm run dev  — run on another port
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = String(process.env.PORT || 3000);

let engine = '';
try { engine = fs.readFileSync(path.join(ROOT, '.dev-engine'), 'utf8').trim(); } catch { /* default */ }

const args = [path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '-p', PORT];
if (engine === 'webpack') args.push('--webpack');
if (engine === 'webpack') console.log('[dev] webpack engine selected (.dev-engine marker written by npm run doctor)');

const log = fs.createWriteStream(path.join(ROOT, 'dev.log'), { flags: 'a' });
log.write(`\n--- dev start ${new Date().toISOString()} (engine: ${engine || 'turbopack'}, port: ${PORT}) ---\n`);

const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ['inherit', 'pipe', 'pipe'] });
const tap = (chunk, out) => { out.write(chunk); log.write(chunk); };
child.stdout.on('data', (d) => tap(d, process.stdout));
child.stderr.on('data', (d) => tap(d, process.stderr));
let exited = false;
child.on('exit', (code, signal) => {
  exited = true;
  log.end();
  process.exitCode = code ?? (signal ? 1 : 0);
});

// Forward signals and WAIT for the child: exiting immediately would close the
// stdio pipes mid-shutdown and can leave the dev server wedged (its graceful
// shutdown writes hit EPIPE). Escalate to SIGKILL if it stalls.
let shuttingDown = false;
async function forwardAndWait(sig, code) {
  if (shuttingDown) { try { child.kill('SIGKILL'); } catch { /* gone */ } process.exit(130); }
  shuttingDown = true;
  try { child.kill(sig); } catch { /* gone */ }
  const deadline = Date.now() + 5000;
  while (!exited && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
  if (!exited) { try { child.kill('SIGKILL'); } catch { /* gone */ } await new Promise((r) => setTimeout(r, 1000)); }
  process.exit(exited ? code : 1);
}
process.on('SIGINT', () => forwardAndWait('SIGINT', 130));
process.on('SIGTERM', () => forwardAndWait('SIGTERM', 143));
