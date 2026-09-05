// GET/POST /api/v1/presets — PAT data-plane preset CRUD (VOL-05 §3.1).
// Reads: unmetered against srv but counted under the PAT daily ceiling.
// Writes: draw from the same daily server-call quota as app writes
// (check-and-increment, VOL-01 §4.3) and enforce presets_max (422, tier named).

import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { db } from '@/lib/db';
import { resolveEntitlement, checkAndIncrement } from '@/lib/entitlements';
import { burstCheck } from '@/lib/burst';
import { readJsonWithLimit } from '@/lib/validate';

export const dynamic = 'force-dynamic';
const PAGE = 100;

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

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor');

  const rows = await db.preset.findMany({
    where: { userId: auth.userId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], // stable sort — diffable re-runs (§3.2)
    take: PAGE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  return ok(
    {
      items: rows.map((r) => ({
        id: r.id,
        tool_id: r.toolId,
        name: r.name,
        payload: safeParse(r.payloadJson),
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      })),
      next_cursor: rows.length === PAGE ? rows[rows.length - 1].id : null,
    },
    { warnings: patCheck.snapshot.warnings },
  );
}

export async function POST(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'valid PAT bearer required');
  if (auth.kind !== 'pat') {
    return fail(ERR.TOKEN_KIND_MISMATCH, 'TOKEN_KIND_MISMATCH', 'this surface accepts a PAT only');
  }
  if (!burstCheck(`pat:${auth.tokenId}`).ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'burst limit reached (10 req / 10 s)');
  }

  // PAT daily ceiling + shared daily server-call quota (§3.2 MUST).
  const patCheck = await checkAndIncrement(auth.userId, 'pat');
  if (!patCheck.allowed) {
    return fail(ERR.QUOTA_EXCEEDED, 'QUOTA_EXCEEDED', 'PAT daily ceiling reached', {
      resets_at: patCheck.resets_at,
    });
  }
  const srvCheck = await checkAndIncrement(auth.userId, 'srv');
  if (!srvCheck.allowed) {
    return fail(ERR.QUOTA_EXCEEDED, 'QUOTA_EXCEEDED', 'daily server-call quota reached', {
      resets_at: srvCheck.resets_at,
    });
  }

  let body: { tool_id?: string; name?: string; payload?: unknown };
  try {
    const parsedBody = await readJsonWithLimit(req, 64 * 1024);

    if (!parsedBody.ok) throw new Error('BAD_BODY');

    body = parsedBody.body as typeof body;
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body');
  }
  if (!body.tool_id || !body.name || body.payload === undefined) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'tool_id, name, and payload are required');
  }

  const ent = await resolveEntitlement(auth.userId);
  const count = await db.preset.count({ where: { userId: auth.userId } });
  if (count >= ent.limits.presets_max) {
    return fail(
      ERR.LIMIT_REACHED,
      'LIMIT_REACHED',
      `your ${ent.tier} plan allows ${ent.limits.presets_max} presets`,
    );
  }

  const row = await db.preset.create({
    data: {
      userId: auth.userId,
      toolId: body.tool_id,
      name: body.name.slice(0, 200),
      payloadJson: JSON.stringify(body.payload),
    },
  });

  return ok(
    {
      preset: {
        id: row.id,
        tool_id: row.toolId,
        name: row.name,
        created_at: row.createdAt.toISOString(),
      },
    },
    { warnings: srvCheck.snapshot.warnings, init: { status: 201 } },
  );
}

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
