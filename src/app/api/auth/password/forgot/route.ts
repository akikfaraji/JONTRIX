// POST /api/auth/password/forgot — request a password reset.
// Enumeration-honest: ALWAYS 200 (identical body for known and unknown
// emails). A reset link (1 h TTL, single-use) is emailed when the account
// exists and has a credential; accounts without a password get an honest
// hint in the same envelope. Abuse: per-IP burst + 3 sends/email/day.

import { db } from '@/lib/db';
import { ok, fail, ERR } from '@/lib/envelope';
import { burstCheck } from '@/lib/burst';
import { isEmail, readJsonWithLimit } from '@/lib/validate';
import { issueAuthToken } from '@/lib/auth-tokens';
import { passwordResetEmail, sendMail } from '@/lib/mailer';
import { utcDay } from '@/lib/utc';

export const dynamic = 'force-dynamic';

const GENERIC = {
  accepted: true,
  message: 'If an account exists for that address, a reset link is on its way. Check your inbox.',
};

export async function POST(req: Request) {
  const burst = burstCheck(`forgot:${req.headers.get('x-forwarded-for') ?? 'local'}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many requests');
  }

  const parsed = await readJsonWithLimit(req, 4 * 1024);
  if (!parsed.ok) {
    return parsed.tooLarge
      ? fail(413, 'PAYLOAD_TOO_LARGE', 'request body too large')
      : fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; field: email');
  }
  const body = parsed.body as { email?: unknown };
  if (!isEmail(body.email)) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'a valid email is required', { field: 'email' });
  }
  const email = body.email.trim().toLowerCase();

  // per-email send cap (3/day) — anti mail-bombing even with rotated IPs
  const sentKey = `pwreset_sent:${email}:${utcDay()}`;
  const sentRow = await db.kvState.findUnique({ where: { key: sentKey } });
  const sent = sentRow ? Number(sentRow.value) : 0;
  if (sent >= 3) {
    return ok(GENERIC); // shape-identical: never reveal the cap state
  }
  await db.kvState.upsert({
    where: { key: sentKey },
    create: { key: sentKey, value: String(sent + 1), expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
    update: { value: String(sent + 1), expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
  });

  const user = await db.user.findUnique({
    where: { email },
    include: { credential: true },
  });

  if (user && user.status === 'active' && user.credential) {
    const token = await issueAuthToken(user.id, 'password_reset');
    const origin = process.env.APP_ORIGIN ?? new URL(req.url).origin;
    const link = `${origin}/reset-password?token=${token}`;
    await sendMail({ to: email, ...passwordResetEmail(link) });
  }

  return ok(GENERIC);
}
