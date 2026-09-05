// POST /api/auth/register — email + password sign-up.
// Creates the user (with the same AuthIdentity('email') marker OTP uses so
// both paths converge), stores a scrypt credential, auto-signs-in, and sends
// the verification + welcome emails. An existing account → 409 (ownership
// proof for adding a password to an OTP/OAuth account is the password-reset
// flow, not blind registration). Abuse: per-IP burst + OTP-style mail caps.

import { db } from '@/lib/db';
import { ok, fail, ERR } from '@/lib/envelope';
import { burstCheck } from '@/lib/burst';
import { isEmail, readJsonWithLimit } from '@/lib/validate';
import { checkPasswordStrength, hashPassword } from '@/lib/password';
import { createProvisionedUser, createSession, setSessionCookie } from '@/lib/auth';
import { issueAuthToken } from '@/lib/auth-tokens';
import { verifyEmailEmail, welcomeEmail, sendMail } from '@/lib/mailer';
import { audit } from '@/lib/audit';
import { resolveEntitlement } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const burst = burstCheck(`register:${req.headers.get('x-forwarded-for') ?? 'local'}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many sign-up attempts');
  }

  const parsed = await readJsonWithLimit(req, 16 * 1024);
  if (!parsed.ok) {
    return parsed.tooLarge
      ? fail(413, 'PAYLOAD_TOO_LARGE', 'request body too large')
      : fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; fields: email, password');
  }
  const body = parsed.body as { email?: unknown; password?: unknown; display_name?: unknown };

  if (!isEmail(body.email)) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'a valid email is required', { field: 'email' });
  }
  const strength = checkPasswordStrength(body.password);
  if (!strength.ok) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', strength.message ?? 'password rejected', {
      field: 'password',
    });
  }
  const email = (body.email as string).trim().toLowerCase();
  const password = body.password as string;
  const displayName =
    typeof body.display_name === 'string' ? body.display_name.trim().slice(0, 60) || null : null;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return fail(409, 'CONFLICT_IDEMPOTENCY', 'an account with this email already exists — sign in or reset your password');
  }

  const passwordHash = await hashPassword(password);

  // Provision user + credential + identity atomically (handle collisions
  // resolve inside with suffix retries, so a duplicate never 500s).
  let user;
  try {
    user = await createProvisionedUser(email, passwordHash, displayName);
  } catch {
    return fail(409, 'CONFLICT_IDEMPOTENCY', 'an account with this email already exists — sign in or reset your password');
  }

  await audit({ actorKind: 'user_session', actorId: user.id, event: 'account.created', subject: user.id });
  await resolveEntitlement(user.id).catch(() => undefined);

  // verification + welcome email (real SMTP when configured; honest log driver otherwise)
  const origin = process.env.APP_ORIGIN ?? new URL(req.url).origin;
  const verifyToken = await issueAuthToken(user.id, 'email_verify');
  const verifyLink = `${origin}/api/auth/verify-email?token=${verifyToken}`;
  const [verifyMail] = await Promise.all([
    sendMail({ to: email, ...verifyEmailEmail(verifyLink) }),
    sendMail({ to: email, ...welcomeEmail(user.handle) }),
  ]);

  const tokens = await createSession(user.id, 'pwa', req);
  await setSessionCookie(req, tokens);

  return ok({
    user_id: user.id,
    handle: user.handle,
    email,
    email_verified: false,
    consent_state: user.aiTrainingConsent,
    consent_asked: user.consentAskedAt !== null,
    mail_driver: verifyMail.driver,
  });
}
