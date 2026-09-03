// GET /api/mcp/quota — entitlement + counter snapshot for gateway
// pre-flight (VOL-10 §4.7). This is the truth the gateway caches ≤ 60 s;
// pre-flight never permits what the server would refuse (§7).

import { requireMcpAuth } from '@/lib/mcp/auth';
import { aatDailyClamp } from '@/lib/mcp/scopes';
import { resolveEntitlement, quotaSnapshot } from '@/lib/entitlements';
import { db } from '@/lib/db';
import { utcDay, dailyResetsAt, monthlyResetsAt } from '@/lib/utc';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { auth, failure } = await requireMcpAuth(req);
  if (failure) return failure;

  const ent = await resolveEntitlement(auth.userId);
  const mcp = await quotaSnapshot(ent, 'mcp');
  const server = await quotaSnapshot(ent, 'srv');

  const today = await db.mcpUsageDaily.findUnique({
    where: { tokenId_day: { tokenId: auth.tokenId, day: utcDay() } },
  });
  const clamp = aatDailyClamp(auth.scopes);

  return Response.json(
    {
      tier: ent.tier,
      mcp: {
        calls_made_month: mcp.used,
        calls_limit_month: mcp.effective,
        resets_at: monthlyResetsAt(),
      },
      server: {
        calls_made_today: server.used,
        calls_limit_today: server.effective,
        resets_at: dailyResetsAt(),
      },
      aat_clamp:
        clamp !== null
          ? { calls_made_today: today?.calls ?? 0, calls_limit_today: clamp, resets_at: dailyResetsAt() }
          : null,
    },
    { status: 200 },
  );
}
