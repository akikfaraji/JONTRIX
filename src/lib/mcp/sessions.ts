// Gateway session pairs — VOL-10 §2 `sess` kind + §4.8 refresh (LOCKED).
// Short-lived pairwise credential so a long-lived AAT need not sit in the
// gateway's memory: access 15 min, refresh 30 d rotating single-use.
// Reuse of a rotated refresh revokes the whole family (theft signal).

import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { sha256 } from '@/lib/tokens';
import { scopeString } from '@/lib/mcp/scopes';

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 3600 * 1000;

export interface SessionPair {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

function newFamilyId(): string {
  return `fam_${randomBytes(12).toString('hex')}`;
}

function mintSessSecret(): { secret: string; hash: string; prefix: string; last4: string } {
  const secret = `jx_sess_${randomBytes(32).toString('hex')}`;
  return {
    secret,
    hash: sha256(secret),
    prefix: secret.slice(0, 10),
    last4: secret.slice(-4),
  };
}

/**
 * Mint an access+refresh pair (kind 'sess') bound to `userId` with the
 * AAT's scopes. The proxy AAT id rides in the rows' scopes JSON
 * (`__aat_id`) so usage attribution stays exact without widening scopes.
 */
export async function mintSessionPair(
  userId: string,
  scopes: Record<string, unknown>,
  aatTokenId: string | null,
  familyId?: string,
): Promise<SessionPair> {
  const fam = familyId ?? newFamilyId();
  const scoped = aatTokenId ? { ...scopes, __aat_id: aatTokenId } : { ...scopes };

  const access = mintSessSecret();
  const refresh = mintSessSecret();

  await db.token.createMany({
    data: [
      {
        userId,
        kind: 'sess',
        name: `gateway-access:${aatTokenId ?? 'pasted'}`,
        hashSha256: access.hash,
        prefix: access.prefix,
        last4: access.last4,
        scopesJson: JSON.stringify(scoped),
        status: 'active',
        familyId: fam,
        expiresAt: new Date(Date.now() + ACCESS_TTL_MS),
      },
      {
        userId,
        kind: 'sess',
        name: `gateway-refresh:${aatTokenId ?? 'pasted'}`,
        hashSha256: refresh.hash,
        prefix: refresh.prefix,
        last4: refresh.last4,
        scopesJson: JSON.stringify(scoped),
        status: 'active',
        familyId: fam,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    ],
  });

  return {
    access_token: access.secret,
    refresh_token: refresh.secret,
    token_type: 'Bearer',
    expires_in: 900,
    scope: scopeString(scopes),
  };
}

/**
 * Single-use rotation (§4.8): presenting an already-rotated refresh revokes
 * the whole session family and returns 401 session_revoked. Scopes never
 * widen — the new pair copies the old rows' scopes verbatim.
 */
export async function rotateSession(
  refreshTokenHash: string,
): Promise<SessionPair | { revoked: 'session_revoked' } | null> {
  const row = await db.token.findUnique({ where: { hashSha256: refreshTokenHash } });
  if (!row || row.kind !== 'sess' || !row.familyId) return null;

  if (row.status !== 'active') {
    // Theft signal: this refresh was already rotated once.
    await db.token.updateMany({
      where: { familyId: row.familyId, kind: 'sess' },
      data: { status: 'revoked', revokedAt: new Date() },
    });
    return { revoked: 'session_revoked' };
  }

  if (row.expiresAt && row.expiresAt < new Date()) return null;

  let scopes: Record<string, unknown> = {};
  try {
    scopes = JSON.parse(row.scopesJson || '{}') as Record<string, unknown>;
  } catch {
    scopes = {};
  }

  // Burn the presented refresh, then mint a fresh pair in the same family.
  await db.token.update({
    where: { id: row.id },
    data: { status: 'rotated' },
  });
  const { __aat_id, ...cleanScopes } = scopes as Record<string, unknown>;
  return mintSessionPair(row.userId, cleanScopes, (__aat_id as string) ?? null, row.familyId);
}

/** Revoke an entire session family (logout, family theft, admin). */
export async function revokeFamily(familyId: string): Promise<void> {
  await db.token.updateMany({
    where: { familyId, kind: 'sess' },
    data: { status: 'revoked', revokedAt: new Date() },
  });
}
