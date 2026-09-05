// GET    /api/auth/sessions        — list active sessions (security view)
// DELETE /api/auth/sessions?id=…   — revoke one session (owner-scoped, IDOR-safe)
//
// The list never carries refresh hashes or any secret material — only the
// metadata a user needs to recognize a device (kind, IP, UA, timestamps).

import { ok, fail, ERR } from '@/lib/envelope';
import {
  getSessionAuth,
  listActiveSessions,
  revokeSessionById,
  clearSessionCookie,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  const sessions = await listActiveSessions(auth.userId, auth.sessionId);
  return ok({ sessions });
}

export async function DELETE(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id || id.length > 64) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'query parameter id is required');
  }

  const result = await revokeSessionById(auth.userId, id);
  if (result === 'not_found') {
    // same 404 for a foreign id and a bogus id — no existence leak
    return fail(404, 'NOT_FOUND', 'no such session');
  }

  // revoking the session that made the request: the cookie must die too
  if (id === auth.sessionId) {
    await clearSessionCookie();
    return ok({ revoked: true, current: true });
  }

  return ok({ revoked: true, current: false });
}
