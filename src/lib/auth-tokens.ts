// One-time auth tokens (email verification, password reset) — sha256 at
// rest, single-use (usedAt set in the same transaction that reads), TTL
// enforced on read. Issue purges prior unused tokens of the same purpose
// (one live token per purpose per user — no mailbox token stuffing).

import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { sha256 } from '@/lib/tokens';

export type AuthTokenPurpose = 'email_verify' | 'password_reset';

export const VERIFY_TTL_MS = 24 * 3600 * 1000; // 24 h
export const RESET_TTL_MS = 60 * 60 * 1000; // 1 h

export async function issueAuthToken(
  userId: string,
  purpose: AuthTokenPurpose,
): Promise<string> {
  // one live token per purpose — invalidate prior unused ones
  await db.authToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString('base64url');
  await db.authToken.create({
    data: {
      userId,
      purpose,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + (purpose === 'email_verify' ? VERIFY_TTL_MS : RESET_TTL_MS)),
    },
  });
  return token;
}

export async function consumeAuthToken(
  token: string,
  purpose: AuthTokenPurpose,
): Promise<{ ok: true; userId: string } | { ok: false; reason: 'invalid' | 'expired' | 'used' }> {
  const row = await db.authToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.purpose !== purpose) return { ok: false, reason: 'invalid' };
  if (row.usedAt) return { ok: false, reason: 'used' };
  if (row.expiresAt < new Date()) return { ok: false, reason: 'expired' };

  // single-use, atomically: the conditional update wins exactly once
  const claimed = await db.authToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return { ok: false, reason: 'used' };
  return { ok: true, userId: row.userId };
}

/** Purge expired/used token rows (housekeeping; safe to call often). */
export async function purgeAuthTokens(): Promise<void> {
  await db.authToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null, lt: new Date(Date.now() - 24 * 3600 * 1000) } }],
    },
  }).catch(() => undefined);
}
