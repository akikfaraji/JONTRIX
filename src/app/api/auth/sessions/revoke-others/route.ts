// POST /api/auth/sessions/revoke-others — "sign out everywhere else".
// Keeps the calling session, revokes every other active session of the user.

import { ok, fail, ERR } from '@/lib/envelope';
import { getSessionAuth, revokeOtherSessions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  const count = await revokeOtherSessions(auth.userId, auth.sessionId);
  return ok({ revoked: count });
}
