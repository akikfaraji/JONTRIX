// PATCH/DELETE /api/v1/tokens/{id} — VOL-05 §6.
// PATCH (rename or AAT scope edit) issues a REPLACEMENT token — scope edits
// never mutate a live secret; the old row is rotated. DELETE revokes; for a
// PAT the dashboard asks twice (UI ceremony) — the API revokes once, audited.

import { getSessionAuth } from '@/lib/auth';
import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { db } from '@/lib/db';
import { mintSecret } from '@/lib/tokens';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** Session-only gate shared by both verbs (D-04 — bearers cannot manage tokens). */
async function requireSession(req: Request) {
  const header = req.headers.get('authorization') ?? '';
  if (header.toLowerCase().startsWith('bearer ')) {
    const bearer = await authenticateBearer(req);
    if (bearer) {
      return {
        error: fail(
          ERR.TOKEN_KIND_MISMATCH,
          'TOKEN_KIND_MISMATCH',
          'the token factory accepts a browser session only',
        ),
      };
    }
  }
  const auth = await getSessionAuth(req);
  if (!auth) return { error: fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required') };
  return { auth };
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireSession(req);
  if (gate.error) return gate.error;
  const { id } = await params;

  const row = await db.token.findFirst({ where: { id, userId: gate.auth!.userId } });
  if (!row || row.status !== 'active') {
    return fail(ERR.NOT_FOUND, 'NOT_FOUND', 'token not found or not active');
  }

  let body: { name?: string; scopes?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body');
  }

  const newName = body.name?.slice(0, 100) ?? row.name;
  const newScopes =
    body.scopes !== undefined ? JSON.stringify(body.scopes) : row.scopesJson;

  // Replacement semantics: old row rotated, new secret minted, shown once.
  const minted = mintSecret(row.kind === 'pat' ? 'pat' : 'aat');
  const replacement = await db.$transaction(async (tx) => {
    await tx.token.update({
      where: { id: row.id },
      data: { status: 'rotated', revokedAt: new Date() },
    });
    return tx.token.create({
      data: {
        userId: row.userId,
        kind: row.kind,
        name: newName,
        hashSha256: minted.hash,
        prefix: minted.prefix,
        last4: minted.last4,
        scopesJson: newScopes,
        status: 'active',
      },
    });
  });

  await audit({
    actorKind: 'user_session',
    actorId: row.userId,
    event: 'token.rotated',
    subject: replacement.id,
    meta: { kind: row.kind, previous: row.id, reason: 'edited' },
  });

  return ok({
    token: {
      id: replacement.id,
      kind: replacement.kind,
      name: replacement.name,
      prefix: replacement.prefix,
      last4: replacement.last4,
      status: replacement.status,
    },
    secret: minted.secret,
    warning:
      'Store this secret now — it is shown once. The previous token was rotated.',
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const gate = await requireSession(req);
  if (gate.error) return gate.error;
  const { id } = await params;

  const row = await db.token.findFirst({ where: { id, userId: gate.auth!.userId } });
  if (!row || row.status === 'revoked') {
    return fail(ERR.NOT_FOUND, 'NOT_FOUND', 'token not found or already revoked');
  }

  await db.token.update({
    where: { id: row.id },
    data: { status: 'revoked', revokedAt: new Date() },
  });

  await audit({
    actorKind: 'user_session',
    actorId: row.userId,
    event: 'token.revoked',
    subject: row.id,
    meta: { kind: row.kind },
  });

  return ok({
    revoked: row.id,
    ...(row.kind === 'pat'
      ? { notice: 'You now have no PAT. You can create a new one at any time.' }
      : {}),
  });
}
