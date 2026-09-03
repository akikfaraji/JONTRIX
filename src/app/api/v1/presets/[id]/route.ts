// PUT/DELETE /api/v1/presets/{id} — PAT data-plane preset item routes.
// Writes draw from the shared daily quota; ownership is absolute — every
// query is WHERE user_id = token owner (VOL-05 §3.2 NEVER cross-user).

import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { db } from '@/lib/db';
import { checkAndIncrement } from '@/lib/entitlements';
import { burstCheck } from '@/lib/burst';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

async function gate(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth) return { error: fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'valid PAT bearer required') };
  if (auth.kind !== 'pat') {
    return { error: fail(ERR.TOKEN_KIND_MISMATCH, 'TOKEN_KIND_MISMATCH', 'this surface accepts a PAT only') };
  }
  if (!burstCheck(`pat:${auth.tokenId}`).ok) {
    return { error: fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'burst limit reached (10 req / 10 s)') };
  }
  const patCheck = await checkAndIncrement(auth.userId, 'pat');
  if (!patCheck.allowed) {
    return { error: fail(ERR.QUOTA_EXCEEDED, 'QUOTA_EXCEEDED', 'PAT daily ceiling reached', { resets_at: patCheck.resets_at }) };
  }
  return { auth };
}

export async function PUT(req: Request, { params }: Params) {
  const g = await gate(req);
  if (g.error) return g.error;
  const { id } = await params;

  const row = await db.preset.findFirst({ where: { id, userId: g.auth!.userId } });
  if (!row) return fail(ERR.NOT_FOUND, 'NOT_FOUND', 'preset not found');

  let body: { name?: string; payload?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body');
  }

  const updated = await db.preset.update({
    where: { id: row.id },
    data: {
      name: body.name?.slice(0, 200) ?? row.name,
      payloadJson: body.payload !== undefined ? JSON.stringify(body.payload) : row.payloadJson,
    },
  });

  return ok({
    preset: {
      id: updated.id,
      tool_id: updated.toolId,
      name: updated.name,
      updated_at: updated.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const g = await gate(req);
  if (g.error) return g.error;
  const { id } = await params;

  const row = await db.preset.findFirst({ where: { id, userId: g.auth!.userId } });
  if (!row) return fail(ERR.NOT_FOUND, 'NOT_FOUND', 'preset not found');

  await db.preset.delete({ where: { id: row.id } });
  return ok({ deleted: row.id });
}
