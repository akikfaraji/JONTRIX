// GET /api/v1/usage — the PAT owner's per-call ledger read (VOL-15 meter of
// record, VOL-05 §3.2: PAT sees its own rows, never cross-user). Query: limit
// (1..200, default 50), tool (substring), status filter. Envelope per §2.

import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { db } from '@/lib/db';
import { burstCheck } from '@/lib/burst';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'valid PAT bearer required');
  if (auth.kind !== 'pat') {
    return fail(ERR.TOKEN_KIND_MISMATCH, 'TOKEN_KIND_MISMATCH', 'usage reads take a PAT only');
  }
  if (!burstCheck(`pat:${auth.tokenId}`).ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'burst limit reached (10 req / 10 s)');
  }

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50) || 50, 1), 200);
  const tool = url.searchParams.get('tool')?.trim() ?? '';
  const status = url.searchParams.get('status')?.trim() ?? '';

  const where: Record<string, unknown> = { userId: auth.userId };
  if (tool) where.toolId = { contains: tool };
  if (['ok', 'client_error', 'server_error'].includes(status)) where.status = status;

  const rows = await db.jontUsage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return ok({
    items: rows.map((r) => ({
      id: r.id,
      tool_id: r.toolId,
      source: r.source,
      token_id: r.tokenId,
      ms: r.ms,
      bytes_in: r.bytesIn,
      bytes_out: r.bytesOut,
      status: r.status,
      created_at: r.createdAt.toISOString(),
    })),
    total: rows.length,
  });
}
