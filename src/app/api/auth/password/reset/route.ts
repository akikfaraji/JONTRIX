// POST /api/auth/password/reset — consume a reset token, set the new
// password, revoke every session of the user (a stolen session must not
// survive a credential rotation), audit, and send the security notification.

import { db } from '@/lib/db';
import { ok, fail, ERR } from '@/lib/envelope';
import { burstCheck } from '@/lib/burst';
import { readJsonWithLimit } from '@/lib/validate';
import { checkPasswordStrength, hashPassword } from '@/lib/password';
import { consumeAuthToken } from '@/lib/auth-tokens';
import { passwordChangedEmail, sendMail } from '@/lib/mailer';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const burst = burstCheck(`pwreset:${req.headers.get('x-forwarded-for') ?? 'local'}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many attempts');
  }

  const parsed = await readJsonWithLimit(req, 8 * 1024);
  if (!parsed.ok) {
    return parsed.tooLarge
      ? fail(413, 'PAYLOAD_TOO_LARGE', 'request body too large')
      : fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; fields: token, password');
  }
  const body = parsed.body as { token?: unknown; password?: unknown };
  if (typeof body.token !== 'string' || !body.token) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'a reset token is required', { field: 'token' });
  }
  const strength = checkPasswordStrength(body.password);
  if (!strength.ok) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', strength.message ?? 'password rejected', {
      field: 'password',
    });
  }
  const newPassword = body.password as string;

  const consumed = await consumeAuthToken(body.token, 'password_reset');
  if (!consumed.ok) {
    return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'this reset link is invalid, already used, or expired — request a new one');
  }

  const passwordHash = await hashPassword(newPassword);
  await db.credential.upsert({
    where: { userId: consumed.userId },
    create: { userId: consumed.userId, passwordHash },
    update: { passwordHash },
  });

  // credential rotated → every existing session dies (VOL-06 §2 spirit)
  await db.session.updateMany({
    where: { userId: consumed.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await audit({
    actorKind: 'user_session',
    actorId: consumed.userId,
    event: 'password.reset',
    subject: consumed.userId,
  });

  const user = await db.user.findUnique({ where: { id: consumed.userId } });
  if (user?.email) {
    await sendMail({ to: user.email, ...passwordChangedEmail() });
  }

  return ok({ reset: true, message: 'password updated — sign in with your new password' });
}
