// GET /api/jonts — catalog registry (VOL-04 §4 jonts, seeded from the frozen
// 247-row catalog). Filters: q (name/slug substring), tier, pattern, context,
// sort=score|id, limit. One envelope per VOL-05 §2.

import { db } from '@/lib/db';
import { fail, ok, ERR } from '@/lib/envelope';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const tier = url.searchParams.get('tier') ?? '';
  const pattern = url.searchParams.get('pattern') ?? '';
  const context = url.searchParams.get('context') ?? '';
  const sort = url.searchParams.get('sort') === 'id' ? 'id' : 'score';
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 247) || 247, 247);

  const where: Record<string, unknown> = {};
  if (q) where.OR = [{ title: { contains: q } }, { seoSlug: { contains: q } }];
  if (tier) where.tierFit = tier.toUpperCase();
  if (pattern) where.family = pattern;
  if (context) where.context = context;

  try {
    // keep registry statuses in sync with the engine registry before reading
    // (deploy-safe path shared with the run route) so the UI can render
    // honest built/planned states without a stale deploy race
    const { getBuiltJontIds } = await import('@/lib/jont-runtime/engines');
    await db.jont.updateMany({
      where: { id: { in: getBuiltJontIds() }, status: { not: 'built' } },
      data: { status: 'built' },
    });

    const rows = await db.jont.findMany({
      where,
      orderBy: sort === 'score' ? [{ score: 'desc' }, { id: 'asc' }] : [{ id: 'asc' }],
      take: limit,
    });

    const total = await db.jont.count({ where });

    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.seoSlug,
      pattern: r.family,
      context: r.context,
      status: r.status,
      tier_fit: r.tierFit,
      platform_role: r.platformRole,
      score: r.score,
      mcp_exposed: r.mcpExposed,
      description: r.description,
    }));

    return ok({ items, total });
  } catch {
    return fail(ERR.INTERNAL, 'INTERNAL', 'catalog unavailable');
  }
}
