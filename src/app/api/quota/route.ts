// GET /api/quota — session quota block only (VOL-05 §4).
// Honest counters: base, boost, effective, remaining, resets_at.

import { getSessionAuth } from '@/lib/auth';
import { ok, fail, ERR } from '@/lib/envelope';
import { resolveEntitlement, quotaSnapshot } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  const ent = await resolveEntitlement(auth.userId);
  const srv = await quotaSnapshot(ent, 'srv');
  const mcp = await quotaSnapshot(ent, 'mcp');

  return ok(
    {
      server_calls: {
        base: srv.base,
        boost: srv.boost,
        effective: srv.effective,
        remaining: srv.remaining,
        resets_at: srv.resets_at,
      },
      mcp_calls: {
        base: mcp.base,
        boost: 0,
        effective: mcp.effective,
        remaining: mcp.remaining,
        resets_at: mcp.resets_at,
      },
    },
    { warnings: srv.warnings },
  );
}
