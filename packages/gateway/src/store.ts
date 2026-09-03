// Configuration and secret storage — VOL-10 §5.3 (LOCKED).
// Config root: $JONTRIX_CONFIG_DIR or ~/.jontrix/. Human-editable
// config.toml holds profiles; secrets NEVER live there. Secret storage:
// OS keyring first, fallback secrets.json at 0600 with a permanent
// one-line warning on status until the keyring works. In this build the
// pure-Node keyring helper is a no-op → the 0600 fallback is active and
// admits it (C8 honesty applies to the CLI too).

import { readFileSync, writeFileSync, mkdirSync, chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface Profile {
  endpoint: string;
  agent_name?: string;
}

export const CONFIG_DIR = process.env.JONTRIX_CONFIG_DIR || join(homedir(), '.jontrix');

function configPath(): string {
  return join(CONFIG_DIR, 'config.toml');
}

function secretsPath(): string {
  return join(CONFIG_DIR, 'secrets.json');
}

// ── config.toml (minimal flat parser — profiles only, no nested tables) ────

export function readProfiles(): Record<string, Profile> {
  if (!existsSync(configPath())) return {};
  const text = readFileSync(configPath(), 'utf8');
  const profiles: Record<string, Profile> = {};
  let current = '';
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    const section = /^\[profile\.(.+)\]$/.exec(line);
    if (section) {
      current = section[1];
      profiles[current] = profiles[current] ?? { endpoint: 'https://mcp.jontrix.app' };
      continue;
    }
    if (!current) continue;
    const kv = /^(\w+)\s*=\s*"(.*)"$/.exec(line);
    if (kv) {
      const [, key, value] = kv;
      if (key === 'endpoint') profiles[current].endpoint = value;
      if (key === 'agent_name') profiles[current].agent_name = value;
    }
  }
  return profiles;
}

export function writeProfile(name: string, profile: Profile): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const profiles = readProfiles();
  profiles[name] = profile;
  const lines: string[] = [];
  for (const [pname, p] of Object.entries(profiles)) {
    lines.push(`[profile.${pname}]`);
    lines.push(`endpoint = "${p.endpoint}"`);
    if (p.agent_name) lines.push(`agent_name = "${p.agent_name}"`);
    lines.push('');
  }
  writeFileSync(configPath(), lines.join('\n'), { mode: 0o644 });
}

// ── secrets (keyring-adjacent 0600 file; namespaced per profile/kind) ──────

export interface SecretEntry {
  access_token?: string;
  refresh_token?: string;
  aat?: string;
  pat?: string;
  endpoint: string;
  kind: 'session' | 'aat' | 'pat';
  last4: string;
  scope?: string;
}

export function keyringAvailable(): boolean {
  // A native helper (keytar-class) would live here; none ships in the
  // pure-Node build → the documented fallback is the storage of record.
  return false;
}

export function readSecrets(): Record<string, SecretEntry> {
  if (!existsSync(secretsPath())) return {};
  try {
    return JSON.parse(readFileSync(secretsPath(), 'utf8')) as Record<string, SecretEntry>;
  } catch {
    return {};
  }
}

export function writeSecret(profile: string, entry: SecretEntry): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const secrets = readSecrets();
  secrets[profile] = entry;
  writeFileSync(secretsPath(), JSON.stringify(secrets, null, 2), { mode: 0o600 });
  try {
    chmodSync(secretsPath(), 0o600);
  } catch {
    /* chmod is best-effort on platforms that ignore it */
  }
}

export function deleteSecret(profile: string): void {
  const secrets = readSecrets();
  delete secrets[profile];
  writeFileSync(secretsPath(), JSON.stringify(secrets, null, 2), { mode: 0o600 });
}

export function last4(secret: string): string {
  return secret.slice(-4);
}
