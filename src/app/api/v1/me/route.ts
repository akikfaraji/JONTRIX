// GET /api/v1/me — PAT data-plane identity (VOL-05 §3.1).
// Kind check first: any other bearer (session cookie aside, an AAT here)
// gets 403 TOKEN_KIND_MISMATCH with data_plane_only: true.

import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { resolveEntitlement, quotaSnapshot, checkAndIncrement } from '@/lib/entitlements';
import { db } from '@/lib/db';
import { burstCheck } from '@/lib/burst';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'valid PAT bearer required');
  if (auth.kind !== 'pat') {
    return fail(ERR.TOKEN_KIND_MISMATCH, 'TOKEN_KIND_MISMATCH', 'this surface accepts a PAT only');
  }
  if (!burstCheck(`pat:${auth.tokenId}`).ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'burst limit reached (10 req / 10 s)');
  }

  // PAT daily ceiling: pat_YYYYMMDD < 2000 — reads unmetered against srv but
  // counted here so runaway loops die (VOL-05 §3.2).
  const patCheck = await checkAndIncrement(auth.userId, 'pat');
  if (!patCheck.allowed) {
    return fail(ERR.QUOTA_EXCEEDED, 'QUOTA_EXCEEDED', 'PAT daily ceiling reached', {
      resets_at: patCheck.resets_at,
    });
  }

  const [user, ent] = await Promise.all([
    db.user.findUnique({ where: { id: auth.userId } }),
    resolveEntitlement(auth.userId),
  ]);
  if (!user) return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'account unavailable');

  const pat = await db.token.findFirst({
    where: { userId: auth.userId, kind: 'pat', status: 'active' },
    select: { last4: true, prefix: true },
  });

  const mcp = await quotaSnapshot(ent, 'mcp');
  return ok(
    {
      user_id: user.id,
      handle: user.handle,
      tier: ent.tier,
      window: {
        starts_at: ent.windowStarts?.toISOString() ?? null,
        expires_at: ent.windowExpires?.toISOString() ?? null,
      },
      consent: { state: user.aiTrainingConsent }, // read-only projection (D-05)
      pat_last4: pat?.last4 ?? null,
      mcp_calls: {
        base: mcp.base,
        effective: mcp.effective,
        remaining: mcp.remaining,
        resets_at: mcp.resets_at,
      },
    },
    { warnings: patCheck.snapshot.warnings },
  );
}
