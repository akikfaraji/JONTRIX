// POST /api/auth/login — email + password sign-in.
// Scrypt verify with constant-time compare; a missing account or credential
// burns the same scrypt work (equalized timing — no enumeration by latency).
// Abuse: per-IP burst + 5 failures per email per UTC day (lockout resets at
// midnight UTC). Success mints the standard jx_sess session pair.

import { db } from '@/lib/db';
import { ok, fail, ERR } from '@/lib/envelope';
import { burstCheck } from '@/lib/burst';
import { isEmail, readJsonWithLimit } from '@/lib/validate';
import { verifyPassword, equalizeTiming } from '@/lib/password';
import { createSession, setSessionCookie } from '@/lib/auth';
import { newSignInEmail, sendMail } from '@/lib/mailer';
import { resolveEntitlement } from '@/lib/entitlements';
import { utcDay } from '@/lib/utc';

export const dynamic = 'force-dynamic';

const MAX_FAILS_PER_DAY = 5;

export async function POST(req: Request) {
  const burst = burstCheck(`login:${req.headers.get('x-forwarded-for') ?? 'local'}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many sign-in attempts');
  }

  const parsed = await readJsonWithLimit(req, 16 * 1024);
  if (!parsed.ok) {
    return parsed.tooLarge
      ? fail(413, 'PAYLOAD_TOO_LARGE', 'request body too large')
      : fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; fields: email, password');
  }
  const body = parsed.body as { email?: unknown; password?: unknown };
  if (!isEmail(body.email) || typeof body.password !== 'string') {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'email and password are required');
  }
  const email = body.email.trim().toLowerCase();

  // per-email daily lockout (KV-backed, same shape as the OTP lock)
  const failKey = `pw_fail:${email}:${utcDay()}`;
  const lockKey = `pw_lock:${email}:${utcDay()}`;
  const lockRow = await db.kvState.findUnique({ where: { key: lockKey } });
  if (lockRow && lockRow.expiresAt > new Date()) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many failed attempts — locked for the day', {
      resets_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { credential: true },
  });

  const failAndReturn = async (message: string) => {
    const row = await db.kvState.findUnique({ where: { key: failKey } });
    const fails = row ? Number(row.value) : 0;
    const next = fails + 1;
    await db.kvState.upsert({
      where: { key: failKey },
      create: { key: failKey, value: String(next), expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
      update: { value: String(next), expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
    });
    if (next >= MAX_FAILS_PER_DAY) {
      await db.kvState.upsert({
        where: { key: lockKey },
        create: { key: lockKey, value: '1', expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
        update: { value: '1', expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
      });
    }
    return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', message);
  };

  if (!user || user.status !== 'active') {
    await equalizeTiming(body.password);
    return failAndReturn('wrong email or password');
  }
  if (!user.credential) {
    // account exists via OTP/OAuth only — no password to verify against
    await equalizeTiming(body.password);
    return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'this account has no password set — sign in with a code or use password reset');
  }

  const valid = await verifyPassword(body.password, user.credential.passwordHash);
  if (!valid) {
    return failAndReturn('wrong email or password');
  }

  // clear failure counters on success
  await db.kvState.deleteMany({ where: { key: { in: [failKey, lockKey] } } }).catch(() => undefined);

  await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  await resolveEntitlement(user.id).catch(() => undefined);

  const tokens = await createSession(user.id, 'pwa', req);
  await setSessionCookie(req, tokens);

  // security notification — fire-and-safe, never blocks the sign-in
  if (user.emailVerified) {
    void sendMail({
      to: email,
      ...newSignInEmail(
        req.headers.get('x-forwarded-for'),
        req.headers.get('user-agent'),
      ),
    }).catch(() => undefined);
  }

  return ok({
    user_id: user.id,
    handle: user.handle,
    display_name: user.displayName,
    email,
    email_verified: user.emailVerified !== null,
    consent_state: user.aiTrainingConsent,
    consent_asked: user.consentAskedAt !== null,
  });
}
