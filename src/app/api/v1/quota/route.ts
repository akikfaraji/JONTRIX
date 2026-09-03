// GET /api/v1/quota — PAT data-plane quota (VOL-05 §3.1).
// Same counters block as the envelope plus MCP monthly (§3.1 route table).

import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { resolveEntitlement, quotaSnapshot, checkAndIncrement } from '@/lib/entitlements';
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

  const patCheck = await checkAndIncrement(auth.userId, 'pat');
  if (!patCheck.allowed) {
    return fail(ERR.QUOTA_EXCEEDED, 'QUOTA_EXCEEDED', 'PAT daily ceiling reached', {
      resets_at: patCheck.resets_at,
    });
  }

  const ent = await resolveEntitlement(auth.userId);
  const srv = await quotaSnapshot(ent, 'srv');
  const mcp = await quotaSnapshot(ent, 'mcp');
  const pat = await quotaSnapshot(ent, 'pat');

  return ok({
    server_calls: {
      base: srv.base,
      boost: srv.boost,
      effective: srv.effective,
      remaining: srv.remaining,
      resets_at: srv.resets_at,
    },
    mcp_calls: {
      base: mcp.base,
      effective: mcp.effective,
      remaining: mcp.remaining,
      resets_at: mcp.resets_at,
    },
    pat_calls: {
      base: pat.base,
      effective: pat.effective,
      remaining: pat.remaining,
      resets_at: pat.resets_at,
    },
  });
}
