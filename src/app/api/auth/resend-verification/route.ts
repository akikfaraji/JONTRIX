// POST /api/auth/resend-verification — session-authenticated re-send of the
// email verification mail. Caps: 3 per address per UTC day (shared with the
// register-time send via AuthToken issue + KV counter) so a signed-in user
// cannot mail-bomb themselves or anyone else.

import { db } from '@/lib/db';
import { ok, fail, ERR } from '@/lib/envelope';
import { burstCheck } from '@/lib/burst';
import { getSessionAuth } from '@/lib/auth';
import { issueAuthToken } from '@/lib/auth-tokens';
import { verifyEmailEmail, sendMail } from '@/lib/mailer';
import { utcDay } from '@/lib/utc';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  const burst = burstCheck(`resend:${auth.userId}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many requests');
  }

  const user = await db.user.findUnique({ where: { id: auth.userId } });
  if (!user) return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'account unavailable');
  if (!user.email) return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'this account has no email address to verify');
  if (user.emailVerified) return ok({ sent: false, message: 'your email is already verified' });

  const sentKey = `verify_sent:${user.email}:${utcDay()}`;
  const row = await db.kvState.findUnique({ where: { key: sentKey } });
  const sent = row ? Number(row.value) : 0;
  if (sent >= 3) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'verification email limit reached for today — try again after 00:00 UTC');
  }
  await db.kvState.upsert({
    where: { key: sentKey },
    create: { key: sentKey, value: String(sent + 1), expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
    update: { value: String(sent + 1), expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
  });

  const token = await issueAuthToken(user.id, 'email_verify');
  const origin = process.env.APP_ORIGIN ?? new URL(req.url).origin;
  const link = `${origin}/api/auth/verify-email?token=${token}`;
  const mail = await sendMail({ to: user.email, ...verifyEmailEmail(link) });

  return ok({ sent: true, mail_driver: mail.driver });
}
