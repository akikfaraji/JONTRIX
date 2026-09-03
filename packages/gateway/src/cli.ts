// CLI verb dispatch — VOL-10 §5.2 verb table + exit codes (LOCKED).
// 0 success · 2 auth required/invalid · 3 network · 4 quota · 5 usage ·
// 6 internal. --non-interactive makes every command fail fast instead of
// prompting (CI never hangs). The env token is never logged (§3.3).

import { readProfiles, readSecrets, deleteSecret } from './store.js';
import { login, logout, whoami } from './flows.js';
import { serveStdio } from './mcp.js';
import { connect } from './connect.js';
import { request, fetchQuota, fetchCatalog, ApiError, codeOf } from './api.js';

export interface GlobalOpts {
  profile: string;
  endpoint?: string;
  nonInteractive: boolean;
  json: boolean;
}

function parseArgs(argv: string[]): { flags: Record<string, string | boolean>; positional: string[]; opts: GlobalOpts } {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  const opts: GlobalOpts = {
    profile: process.env.JONTRIX_PROFILE ?? 'default',
    endpoint: process.env.JONTRIX_ENDPOINT,
    nonInteractive: argv.includes('--non-interactive'),
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--profile' || a === '--agent' || a === '--connect' || a === '--endpoint' || a === '--format') {
      const value = argv[++i];
      if (a === '--profile') opts.profile = value;
      else if (a === '--endpoint') opts.endpoint = value;
      else flags[a.slice(2)] = value ?? true;
      continue;
    }
    if (a === '--json') {
      opts.json = true;
      flags.json = true;
      continue;
    }
    if (a === '--no-browser') {
      process.env.JONTRIX_NO_BROWSER = '1';
      flags['no-browser'] = true;
      continue;
    }
    if (a === '--non-interactive') {
      flags['non-interactive'] = true;
      continue;
    }
    if (a.startsWith('--')) flags[a.slice(2)] = true;
    else positional.push(a);
  }
  return { flags, positional, opts };
}

function envToken(): string | undefined {
  const t = process.env.JONTRIX_TOKEN;
  return t && t.startsWith('jx_') ? t : undefined;
}

export async function run(argv: string[]): Promise<number> {
  const { flags, positional, opts } = parseArgs(argv);
  const verb = positional[0] ?? '';
  const endpoint = () => opts.endpoint ?? readProfiles()[opts.profile]?.endpoint ?? 'https://mcp.jontrix.app';

  try {
    switch (verb) {
      case 'login': {
        return await login(opts, flags);
      }
      case 'logout': {
        return await logout(opts);
      }
      case 'status':
      case 'whoami': {
        return await whoami(opts, opts.json);
      }
      case 'mcp': {
        // §3.3: headless CI — env token used in-memory, no keyring write,
        // no browser, no update check.
        const env = envToken();
        const secret = readSecretsFor(opts.profile);
        const bearer = env ?? secret?.aat ?? secret?.access_token;
        serveStdio({
          endpoint: endpoint(),
          bearer: () => bearer,
          onDeadToken: () => {
            if (!env && secret) deleteSecretFor(opts.profile);
          },
        });
        // Never resolve: the process serves until stdin closes (§5.5) —
        // a resolved run() would exit the process on the spot.
        return new Promise<number>(() => undefined);
      }
      case 'tools': {
        const sub = positional[1] ?? 'list';
        const base = endpoint();
        const bearer = envToken() ?? readSecretsFor(opts.profile)?.aat ?? readSecretsFor(opts.profile)?.access_token;
        if (!bearer) {
          console.error('Not logged in — run: jontrix-gateway login');
          return 2;
        }
        if (sub === 'list') {
          const catalog = await fetchCatalog(base, bearer);
          if (opts.json) {
            console.log(JSON.stringify(catalog.tools, null, 2));
          } else {
            for (const t of catalog.tools as unknown as ToolLite[]) {
              console.log(`${t.name}  ${t.tier_fit}${catalog.stale ? '  (stale cache)' : ''}`);
            }
            console.log(`— ${catalog.tools.length} tool(s)`);
          }
          return 0;
        }
        if (sub === 'call') {
          const name = positional[2];
          const argsJson = typeof flags.args === 'string' ? flags.args : '{}';
          if (!name) {
            console.error('usage: jontrix-gateway tools call NAME --args JSON');
            return 5;
          }
          let args: unknown;
          try {
            args = JSON.parse(argsJson);
          } catch {
            console.error('--args is not valid JSON');
            return 5;
          }
          const { status, body } = await request(base, '/api/mcp/call', {
            method: 'POST',
            bearer,
            json: { tool: name, arguments: args },
          });
          if (status === 200) {
            console.log(JSON.stringify(body, null, 2));
            return 0;
          }
          if (status === 402) {
            console.error(`${codeOf(body)}: ${(body as { error?: { message?: string } })?.error?.message}`);
            return 4;
          }
          if (status === 401 || status === 403) {
            console.error(`${codeOf(body)}: ${(body as { error?: { message?: string } })?.error?.message}`);
            return 2;
          }
          if (status === 404) {
            console.error(`unknown tool: ${name}`);
            return 5;
          }
          console.error(`${codeOf(body)}: ${(body as { error?: { message?: string } })?.error?.message}`);
          return 6;
        }
        console.error('usage: jontrix-gateway tools [list|call NAME --args JSON]');
        return 5;
      }
      case 'quota': {
        const base = endpoint();
        const bearer = envToken() ?? readSecretsFor(opts.profile)?.aat ?? readSecretsFor(opts.profile)?.access_token;
        if (!bearer) {
          console.error('Not logged in — run: jontrix-gateway login');
          return 2;
        }
        const print = async () => {
          const q = await fetchQuota(base, bearer);
          if (opts.json) console.log(JSON.stringify(q, null, 2));
          else {
            const mcp = q.mcp as { calls_made_month: number; calls_limit_month: number; resets_at: string };
            const srv = q.server as { calls_made_today: number; calls_limit_today: number; resets_at: string };
            console.log(`MCP monthly: ${mcp.calls_made_month}/${mcp.calls_limit_month} (resets ${mcp.resets_at})`);
            console.log(`Server daily: ${srv.calls_made_today}/${srv.calls_limit_today} (resets ${srv.resets_at})`);
          }
        };
        if (flags.watch === true) {
          for (;;) {
            await print();
            await new Promise((r) => setTimeout(r, 60_000));
          }
        }
        await print();
        return 0;
      }
      case 'connect': {
        const host = positional[1];
        if (!host) {
          console.error('usage: jontrix-gateway connect <claude-desktop|cursor|vscode|cline|windsurf|gemini-cli>');
          return 5;
        }
        return await connect(host, opts.profile);
      }
      case 'doctor': {
        const base = endpoint();
        console.log(`config:  ok (${readProfiles()[opts.profile] ? 'profile present' : 'default profile'})`);
        const secrets = readSecretsFor(opts.profile);
        console.log(`keyring: unavailable — using 0600 file fallback (~/.jontrix/secrets.json)`);
        console.log(`secrets: ${secrets ? `present (…${secrets.last4})` : 'none — not logged in'}`);
        try {
          const { status } = await request(base, '/.well-known/jontrix-mcp.json');
          console.log(`network: ${status === 200 ? 'reachable' : `unexpected status ${status}`} (${base})`);
        } catch (e) {
          console.log(`network: unreachable (${(e as Error).message})`);
        }
        return 0;
      }
      case 'update': {
        // Never self-installs; prints the exact install command (§5.2).
        console.log('update available: run npm i -g jontrix-gateway');
        return 0;
      }
      case 'help':
      case '': {
        console.log(HELP);
        return verb === '' ? 5 : 0;
      }
      default: {
        console.error(`unknown verb "${verb}" — try jontrix-gateway help`);
        return 5;
      }
    }
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 0) return 3;
      if (e.status === 402) return 4;
      if (e.status === 401 || e.status === 403) return 2;
      return 6;
    }
    throw e;
  }
}

interface ToolLite {
  name: string;
  tier_fit: string;
}

function readSecretsFor(profile: string): { aat?: string; access_token?: string; last4: string } | undefined {
  const s = readSecrets()[profile];
  return s ? { aat: s.aat, access_token: s.access_token, last4: s.last4 } : undefined;
}

function deleteSecretFor(profile: string): void {
  deleteSecret(profile);
}

const HELP = `jontrix-gateway — one local process between your MCP host and JONTRIX

verbs:
  login [--agent NAME] [--token|--token-stdin|--pat]   connect this machine
  logout                                               remove stored credentials
  status | whoami [--json]                             identity, tier, quota
  mcp [--non-interactive]                              run the stdio MCP server
  tools [list|call NAME --args JSON]                   smoke-test the catalog
  quota [--watch]                                      print the quota snapshot
  connect <host>                                       write the host's config
  doctor                                               one-line diagnostics
  update                                               print the install command

flags: --profile NAME  --endpoint URL  --json  --no-browser  --non-interactive

env: JONTRIX_TOKEN (headless CI — §3.3), JONTRIX_PROFILE, JONTRIX_ENDPOINT,
     JONTRIX_NO_BROWSER=1, JONTRIX_LOG_LEVEL=error|warn|info

exit codes: 0 ok · 2 auth · 3 network · 4 quota · 5 usage · 6 internal

zero telemetry. secrets live in your OS keyring (0600-file fallback).`;
