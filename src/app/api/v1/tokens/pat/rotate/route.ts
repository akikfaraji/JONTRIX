// POST /api/v1/tokens/pat/rotate — PAT rotation (VOL-05 §6, D-03).
// Body {"confirm":"ROTATE"} required — the UI makes old-secret death
// explicit. New secret shown exactly once; old secret dead ≤ 60 s
// (row marked rotated immediately); audited token.rotated.

import { getSessionAuth } from '@/lib/auth';
import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { db } from '@/lib/db';
import { mintSecret } from '@/lib/tokens';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Kind check: bearers never manage tokens (D-04).
  const header = req.headers.get('authorization') ?? '';
  if (header.toLowerCase().startsWith('bearer ')) {
    const bearer = await authenticateBearer(req);
    if (bearer) {
      return fail(
        ERR.TOKEN_KIND_MISMATCH,
        'TOKEN_KIND_MISMATCH',
        'the token factory accepts a browser session only',
      );
    }
  }

  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  let body: { confirm?: string };
  try {
    body = (await req.json()) as { confirm?: string };
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body');
  }
  if (body.confirm !== 'ROTATE') {
    return fail(
      ERR.ARGUMENTS_INVALID,
      'ARGUMENTS_INVALID',
      'rotation requires {"confirm":"ROTATE"} — the old secret dies immediately',
      { field: 'confirm' },
    );
  }

  const current = await db.token.findFirst({
    where: { userId: auth.userId, kind: 'pat', status: 'active' },
  });
  if (!current) {
    return fail(ERR.NOT_FOUND, 'NOT_FOUND', 'no active PAT to rotate — create one instead');
  }

  const minted = mintSecret('pat');
  const replacement = await db.$transaction(async (tx) => {
    await tx.token.update({
      where: { id: current.id },
      data: { status: 'rotated', revokedAt: new Date() },
    });
    return tx.token.create({
      data: {
        userId: auth.userId,
        kind: 'pat',
        name: current.name,
        hashSha256: minted.hash,
        prefix: minted.prefix,
        last4: minted.last4,
        scopesJson: current.scopesJson,
        status: 'active',
      },
    });
  });

  await audit({
    actorKind: 'user_session',
    actorId: auth.userId,
    event: 'token.rotated',
    subject: replacement.id,
    meta: { kind: 'pat', previous: current.id },
  });

  return ok({
    token: {
      id: replacement.id,
      kind: 'pat',
      prefix: replacement.prefix,
      last4: replacement.last4,
      status: replacement.status,
    },
    secret: minted.secret,
    warning: 'Store this secret now — it is shown once. The previous secret is already dead.',
  });
}
