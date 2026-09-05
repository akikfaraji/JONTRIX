// GET /api/me — session-authenticated identity snapshot (VOL-05 §4).
// Returns identity, tier, window, consent state, and the honest quota block
// (base / boost / effective separately — VOL-01 §4.3, C8).

import { getSessionAuth } from '@/lib/auth';
import { ok, fail, ERR } from '@/lib/envelope';
import { resolveEntitlement, quotaSnapshot } from '@/lib/entitlements';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  const [user, ent] = await Promise.all([
    db.user.findUnique({ where: { id: auth.userId } }),
    resolveEntitlement(auth.userId),
  ]);
  if (!user) return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'account unavailable');

  const srvQuota = await quotaSnapshot(ent, 'srv');
  const mcpQuota = await quotaSnapshot(ent, 'mcp');

  return ok(
    {
      user_id: user.id,
      handle: user.handle,
      display_name: user.displayName,
      email: user.email,
      email_verified: user.emailVerified !== null,
      has_password: (await db.credential.findUnique({ where: { userId: user.id } })) !== null,
      tier: ent.tier,
      source: ent.source,
      window: {
        starts_at: ent.windowStarts?.toISOString() ?? null,
        expires_at: ent.windowExpires?.toISOString() ?? null,
      },
      consent: {
        state: user.aiTrainingConsent,
        version: user.consentVersion,
        asked_at: user.consentAskedAt?.toISOString() ?? null,
      },
      quota: {
        server_calls: {
          base: srvQuota.base,
          boost: srvQuota.boost,
          effective: srvQuota.effective,
          remaining: srvQuota.remaining,
          resets_at: srvQuota.resets_at,
        },
        mcp_calls: {
          base: mcpQuota.base,
          boost: 0,
          effective: mcpQuota.effective,
          remaining: mcpQuota.remaining,
          resets_at: mcpQuota.resets_at,
        },
      },
    },
    { warnings: srvQuota.warnings },
  );
}
