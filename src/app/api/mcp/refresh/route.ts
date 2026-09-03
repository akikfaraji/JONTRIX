// POST /api/mcp/refresh — session rotation (VOL-10 §4.8, LOCKED).
// Bearer = the refresh token. Success returns a NEW pair; single-use
// rotation means presenting an already-rotated refresh revokes the whole
// session family (theft signal) → 401 session_revoked. Access-token
// lifetimes never extend by refreshing; scopes never widen.

import { bearerHash } from '@/lib/tokens';
import { rotateSession } from '@/lib/mcp/sessions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(jx_(?:pat|aat|sess)_[0-9a-f]{64})$/i.exec(header.trim());
  if (!match) {
    return Response.json(
      { ok: false, error: { code: 'AUTH_REQUIRED', message: 'missing or malformed bearer' } },
      { status: 401 },
    );
  }

  const result = await rotateSession(bearerHash(match[1]));
  if (result === null) {
    return Response.json(
      { ok: false, error: { code: 'AUTH_INVALID', message: 'unknown or expired refresh token' } },
      { status: 401 },
    );
  }
  if ('revoked' in result) {
    return Response.json(
      { ok: false, error: { code: 'session_revoked', message: 'refresh reuse detected — the session family has been revoked; log in again' } },
      { status: 401 },
    );
  }

  return Response.json(result, { status: 200 });
}
