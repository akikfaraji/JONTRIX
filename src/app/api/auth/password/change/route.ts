// POST /api/auth/password/change — session-authenticated credential change.
// Verifies the current password first (an open laptop must not be an account
// takeover), revokes every OTHER session, audits, and sends the security
// notification. Accounts without a password (OTP/OAuth only) set one here —
// that is the supported upgrade path.

import { db } from '@/lib/db';
import { ok, fail, ERR } from '@/lib/envelope';
import { burstCheck } from '@/lib/burst';
import { readJsonWithLimit } from '@/lib/validate';
import { verifyPassword, hashPassword, checkPasswordStrength, equalizeTiming } from '@/lib/password';
import { getSessionAuth } from '@/lib/auth';
import { passwordChangedEmail, sendMail } from '@/lib/mailer';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  const burst = burstCheck(`pwchange:${auth.userId}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many attempts');
  }

  const parsed = await readJsonWithLimit(req, 8 * 1024);
  if (!parsed.ok) {
    return parsed.tooLarge
      ? fail(413, 'PAYLOAD_TOO_LARGE', 'request body too large')
      : fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; fields: current_password, new_password');
  }
  const body = parsed.body as { current_password?: unknown; new_password?: unknown };

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    include: { credential: true },
  });
  if (!user || user.status !== 'active') {
    return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'account unavailable');
  }

  if (user.credential) {
    if (typeof body.current_password !== 'string') {
      return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'your current password is required', {
        field: 'current_password',
      });
    }
    const valid = await verifyPassword(body.current_password, user.credential.passwordHash);
    if (!valid) {
      return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'wrong current password');
    }
  } else {
    // upgrade path (no existing password) — equalize timing with the verify branch
    await equalizeTiming(typeof body.current_password === 'string' ? body.current_password : '');
  }

  const strength = checkPasswordStrength(body.new_password);
  if (!strength.ok) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', strength.message ?? 'password rejected', {
      field: 'new_password',
    });
  }
  const passwordHash = await hashPassword(body.new_password as string);

  await db.credential.upsert({
    where: { userId: user.id },
    create: { userId: user.id, passwordHash },
    update: { passwordHash },
  });

  // keep the current session alive; every other session dies
  await db.session.updateMany({
    where: { userId: user.id, id: { not: auth.sessionId }, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await audit({
    actorKind: 'user_session',
    actorId: user.id,
    event: 'password.changed',
    subject: user.id,
  });

  if (user.email) {
    await sendMail({ to: user.email, ...passwordChangedEmail() });
  }

  return ok({ changed: true, message: 'password updated — other sessions were signed out' });
}
