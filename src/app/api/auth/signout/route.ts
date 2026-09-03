// POST /api/auth/signout — revoke the current session row, clear the cookie.

import { getSessionAuth, revokeSession } from '@/lib/auth';
import { ok, fail, ERR } from '@/lib/envelope';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) {
    return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'no active session');
  }
  await revokeSession(auth);
  return ok({ signed_out: true });
}
