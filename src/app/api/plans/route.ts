// GET /api/plans — the seeded tier ladder (VOL-01 §4.1 / VOL-04 §4 plans).
// Pricing surfaces render from these rows, never from hard-coded strings
// (VOL-01 §5.6 honesty contract).

import { db } from '@/lib/db';
import { fail, ok, ERR } from '@/lib/envelope';
import type { Limits, Tier } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.plan.findMany({
      where: { active: true },
      orderBy: { priceUsdCents: 'asc' },
    });

    const plans = rows.map((r) => ({
      tier: r.tier as Tier,
      price_usd_cents: r.priceUsdCents,
      price_usd_annual_cents: r.priceUsdAnnualCents,
      price_stars: r.priceStars,
      limits: JSON.parse(r.limitsJson) as Limits,
    }));

    return ok({ plans });
  } catch {
    return fail(ERR.INTERNAL, 'INTERNAL', 'plan store unavailable');
  }
}
