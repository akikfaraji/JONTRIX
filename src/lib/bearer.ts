// Bearer authentication for the PAT/AAT planes — VOL-05 §3 + §6 (LOCKED).
// Kind check comes first: the right secret on the wrong surface is
// 403 TOKEN_KIND_MISMATCH, never a silent fallthrough. Control-plane
// capabilities are never reachable with a PAT (D-03).

import { db } from '@/lib/db';
import { bearerHash } from '@/lib/tokens';

export interface BearerAuth {
  kind: 'pat' | 'aat';
  tokenId: string;
  userId: string;
  scopes: Record<string, unknown>;
}

/**
 * Resolve the `Authorization: Bearer jx_pat_… / jx_aat_…` header against the
 * unified token registry. Returns null when the header is missing or the
 * secret is unknown/revoked/rotated/expired (→ 401 AUTH_INVALID upstream).
 */
export async function authenticateBearer(req: Request): Promise<BearerAuth | null> {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(jx_(?:pat|aat)_[0-9a-f]{64})$/i.exec(header.trim());
  if (!match) return null;

  const row = await db.token.findUnique({ where: { hashSha256: bearerHash(match[1]) } });
  if (!row || row.status !== 'active') return null;
  if (row.expiresAt && row.expiresAt < new Date()) return null;

  // Touch last-used (one cheap write per authenticated bearer call).
  await db.token.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });

  let scopes: Record<string, unknown> = {};
  try {
    scopes = JSON.parse(row.scopesJson || '{}') as Record<string, unknown>;
  } catch {
    scopes = {};
  }

  return {
    kind: row.kind === 'pat' ? 'pat' : 'aat',
    tokenId: row.id,
    userId: row.userId,
    scopes,
  };
}

/** Enforce the PAT-only data plane (VOL-05 §3). AAT here → kind mismatch. */
export function isPat(auth: BearerAuth): boolean {
  return auth.kind === 'pat';
}
