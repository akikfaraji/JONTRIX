// Token factory — /api/v1/tokens (VOL-05 §6, D-04 LOCKED).
// Session cookie only. A PAT or AAT bearer here is 403 TOKEN_KIND_MISMATCH.
// Secrets are shown exactly once (creation/rotation responses carry the
// warning); only hash + prefix + last4 are stored (VOL-04 §1.4).

import { getSessionAuth } from '@/lib/auth';
import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { db } from '@/lib/db';
import { mintSecret } from '@/lib/tokens';
import { resolveEntitlement } from '@/lib/entitlements';
import { audit } from '@/lib/audit';
import { burstCheck } from '@/lib/burst';

export const dynamic = 'force-dynamic';

const SHOWN_ONCE_WARNING =
  'Store this secret now — it is shown once and cannot be recovered.';

/** Session-only gate shared by every factory route (D-04). */
async function requireSession(req: Request) {
  // A bearer here is wrong by kind — reject with the named code before anything.
  const header = req.headers.get('authorization') ?? '';
  if (header.toLowerCase().startsWith('bearer ')) {
    const bearer = await authenticateBearer(req);
    if (bearer) {
      return {
        error: fail(
          ERR.TOKEN_KIND_MISMATCH,
          'TOKEN_KIND_MISMATCH',
          'the token factory accepts a browser session only — PATs and AATs cannot manage tokens',
        ),
      };
    }
  }
  const auth = await getSessionAuth(req);
  if (!auth) return { error: fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required') };
  return { auth };
}

export async function GET(req: Request) {
  const gate = await requireSession(req);
  if (gate.error) return gate.error;

  const rows = await db.token.findMany({
    where: { userId: gate.auth!.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      kind: true,
      name: true,
      prefix: true,
      last4: true,
      status: true,
      scopesJson: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  // Never secrets in the listing (VOL-05 §6 MUST).
  return ok({
    items: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      name: r.name,
      prefix: r.prefix,
      last4: r.last4,
      status: r.status,
      scopes: safeParse(r.scopesJson),
      expires_at: r.expiresAt?.toISOString() ?? null,
      last_used_at: r.lastUsedAt?.toISOString() ?? null,
      created_at: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const gate = await requireSession(req);
  if (gate.error) return gate.error;
  const userId = gate.auth!.userId;
  if (!burstCheck(`factory:${userId}`).ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'slow down');
  }

  let body: { kind?: string; name?: string; scopes?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body');
  }
  if (body.kind !== 'pat' && body.kind !== 'aat') {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'kind must be pat or aat', {
      field: 'kind',
    });
  }

  const ent = await resolveEntitlement(userId);

  if (body.kind === 'pat') {
    // D-03: exactly one active PAT per user, every tier.
    const existing = await db.token.count({
      where: { userId, kind: 'pat', status: 'active' },
    });
    if (existing >= 1) {
      return fail(ERR.LIMIT_REACHED, 'LIMIT_REACHED', `your ${ent.tier} plan allows one PAT — rotate the existing one instead`);
    }
  } else {
    // D-04: AAT tier ladder 1 / 3 / 10 / unlimited.
    const existing = await db.token.count({
      where: { userId, kind: 'aat', status: 'active' },
    });
    if (existing >= ent.limits.mcp_aats_max) {
      return fail(
        ERR.LIMIT_REACHED,
        'LIMIT_REACHED',
        `your ${ent.tier} plan allows ${ent.limits.mcp_aats_max} agent token(s) — revoke one or upgrade`,
      );
    }
  }

  // VOL-10 §2/§4.4: an AAT-level max_calls_per_day clamp MUST be ≤ the
  // owner tier's daily server limit — 422 with the offending field on over-clamp.
  if (body.kind === 'aat' && body.scopes && typeof body.scopes === 'object') {
    const clamp = (body.scopes as { max_calls_per_day?: unknown }).max_calls_per_day;
    if (clamp !== undefined) {
      if (typeof clamp !== 'number' || clamp < 1 || !Number.isInteger(clamp)) {
        return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'max_calls_per_day must be a positive integer', {
          field: 'scopes.max_calls_per_day',
        });
      }
      if (clamp > ent.limits.server_calls_per_day) {
        return fail(
          ERR.ARGUMENTS_INVALID,
          'ARGUMENTS_INVALID',
          `max_calls_per_day ${clamp} exceeds your ${ent.tier} plan's daily server limit (${ent.limits.server_calls_per_day})`,
          { field: 'scopes.max_calls_per_day' },
        );
      }
    }
  }

  const minted = mintSecret(body.kind);
  const row = await db.token.create({
    data: {
      userId,
      kind: body.kind,
      name: body.name?.slice(0, 100) ?? null,
      hashSha256: minted.hash,
      prefix: minted.prefix,
      last4: minted.last4,
      scopesJson: JSON.stringify(body.scopes ?? {}),
      status: 'active',
      // VOL-10 §2: AATs default to 90-day expiry (renewable; scopes fixed
      // at creation). PATs never expire (rotatable + revocable, D-03).
      ...(body.kind === 'aat' ? { expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000) } : {}),
    },
  });

  await audit({
    actorKind: 'user_session',
    actorId: userId,
    event: 'token.created',
    subject: row.id,
    meta: { kind: body.kind },
  });

  return ok(
    {
      token: {
        id: row.id,
        kind: row.kind,
        name: row.name,
        prefix: row.prefix,
        last4: row.last4,
        status: row.status,
      },
      secret: minted.secret,
      warning: SHOWN_ONCE_WARNING,
    },
    { init: { status: 201 } },
  );
}

function safeParse(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json || '{}') as Record<string, unknown>;
  } catch {
    return {};
  }
}
