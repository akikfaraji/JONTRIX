// connect — client config writers — VOL-10 §9 (LOCKED).
// Writes the host's MCP config entry pointing at the gateway binary — never
// at JONTRIX endpoints, never embedding tokens. Backs up the target file
// (*.jontrix-backup), merges (never clobbers) existing mcpServers entries,
// and refuses to edit files it cannot parse.

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir, platform } from 'node:os';
import { mkdirSync } from 'node:fs';

const ENTRY = { command: 'jontrix-gateway', args: ['mcp', '--profile', 'default'] };

function configPathFor(host: string): string | null {
  const home = homedir();
  const paths: Record<string, string> = {
    'claude-desktop':
      platform() === 'darwin'
        ? join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
        : platform() === 'win32'
          ? join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json')
          : join(home, '.config', 'Claude', 'claude_desktop_config.json'),
    cursor: join(home, '.cursor', 'mcp.json'),
    vscode: join(home, '.config', 'Code', 'User', 'mcp.json'),
    cline:
      platform() === 'darwin'
        ? join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json')
        : join(home, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'),
    windsurf: join(home, '.codeium', 'windsurf', 'mcp_config.json'),
    'gemini-cli': join(home, '.gemini', 'settings.json'),
  };
  return paths[host] ?? null;
}

export async function connect(host: string, profile: string): Promise<number> {
  const path = configPathFor(host);
  if (!path) {
    console.error(`unknown host "${host}" — supported: claude-desktop, cursor, vscode, cline, windsurf, gemini-cli`);
    return 5;
  }

  const entry = { command: ENTRY.command, args: [...ENTRY.args.slice(0, 2), profile] };

  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify({ mcpServers: { jontrix: entry } }, null, 2));
    console.log(`Created ${path} with the jontrix entry.`);
    return 0;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch (e) {
    console.error(`Refusing to edit ${path}: it does not parse as JSON (${(e as Error).message}). Fix or remove the file first.`);
    return 5;
  }

  const servers = (parsed.mcpServers ?? {}) as Record<string, unknown>;
  const existing = servers.jontrix;
  if (existing && JSON.stringify(existing) === JSON.stringify(entry)) {
    console.log(`${host} already points at the gateway — nothing to do.`);
    return 0;
  }

  copyFileSync(path, `${path}.jontrix-backup`);
  servers.jontrix = entry;
  parsed.mcpServers = servers;
  writeFileSync(path, JSON.stringify(parsed, null, 2));
  console.log(`Updated ${path} (backup at ${path}.jontrix-backup).`);
  console.log('Restart your host; the catalog appears as "jontrix".');
  return 0;
}
