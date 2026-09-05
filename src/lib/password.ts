// Password hashing — Node scrypt (OWASP parameters), constant-time verify.
// Format: s2$N$r$p$salt_b64url$hash_b64url — everything needed to verify is
// in the stored string; upgrades just rewrite it. No plaintext ever persists.

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const N = 16384; // 2^14 — OWASP 2024 floor for interactive logins
const R = 8;
const P = 1;
const KEYLEN = 64;

/** Policy: >= 10 chars, at least two character classes, top-blocklist denied. */
const COMMON = new Set([
  'password', 'password1', 'password12', 'password123', '123456', '12345678', '123456789',
  '1234567890', 'qwerty', 'qwerty123', 'qwertyuiop', 'abc123', '111111', '000000', '121212',
  '123123', '123321', '654321', 'iloveyou', 'admin', 'administrator', 'welcome', 'welcome1',
  'monkey', 'dragon', 'letmein', 'sunshine', 'princess', 'football', 'baseball', 'master',
  'shadow', 'superman', 'trustno1', 'hunter2', 'passw0rd', 'p@ssw0rd', 'passwort', 'contrasena',
  'jontrix', 'jontrix1', 'jontrix123', 'fraziym', 'changeme', 'secret', 'test123', 'aaaa',
]);

export interface PasswordCheck {
  ok: boolean;
  reason?: 'too_short' | 'too_long' | 'weak' | 'common';
  message?: string;
}

export function checkPasswordStrength(pw: unknown): PasswordCheck {
  if (typeof pw !== 'string') return { ok: false, reason: 'weak', message: 'password is required' };
  if (pw.length < 10) return { ok: false, reason: 'too_short', message: 'use at least 10 characters' };
  if (pw.length > 200) return { ok: false, reason: 'too_long', message: 'maximum 200 characters' };
  const classes = [
    /[a-z]/.test(pw),
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
  if (classes < 2) {
    return { ok: false, reason: 'weak', message: 'mix at least two of: lower, upper, digits, symbols' };
  }
  if (COMMON.has(pw.toLowerCase())) {
    return { ok: false, reason: 'common', message: 'that password is too common — choose another' };
  }
  return { ok: true };
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(pw.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `s2$${N}$${R}$${P}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 's2') return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, 'base64url');
  const expected = Buffer.from(hashB64, 'base64url');
  try {
    const actual = await scryptAsync(pw.normalize('NFKC'), salt, expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
      maxmem: 64 * 1024 * 1024,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Dummy verification target — equalizes login timing when the account or
 * credential does not exist (no user-enumeration via response latency).
 */
const DUMMY_HASH = `s2$${N}$${R}$${P}$${Buffer.alloc(16, 7).toString('base64url')}$${Buffer.alloc(64, 9).toString('base64url')}`;

export async function equalizeTiming(pw: string): Promise<void> {
  await verifyPassword(pw, DUMMY_HASH).catch(() => undefined);
}
