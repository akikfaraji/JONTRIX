// GET /api/jonts/[id] — one Jont's public detail (VOL-07 §3 card + VOL-11 §2
// input schema for built server tools). The manifest is the source for the
// schema; the registry row is the projection.

import { db } from '@/lib/db';
import { fail, ok, ERR } from '@/lib/envelope';
import { getServerEngine } from '@/lib/jont-runtime/engines';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.jont.findUnique({ where: { id } });
  if (!row) return fail(ERR.NOT_FOUND, 'NOT_FOUND', 'no such Jont');

  const engine = getServerEngine(row.id);
  return ok({
    jont: {
      id: row.id,
      title: row.title,
      slug: row.seoSlug,
      pattern: row.family,
      context: row.context,
      tier_fit: row.tierFit,
      platform_role: row.platformRole,
      score: row.score,
      mcp_exposed: row.mcpExposed,
      description: row.description,
      status: row.status,
      input_schema: engine?.manifest.io.input ?? null,
    },
  });
}
