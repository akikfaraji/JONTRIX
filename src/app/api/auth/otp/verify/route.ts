// POST /api/auth/otp/verify — email OTP verification + session issue (VOL-06 §2).
// First login creates users + auth_identities; the session cookie jx_sess
// carries access(15 min) + refresh(30 d, single-use). A free entitlement row
// is provisioned on first touch (VOL-01 §4.1).

import { verifyOtp, upsertUserByEmail, createSession, setSessionCookie } from '@/lib/auth';
import { ok, fail, ERR } from '@/lib/envelope';
import { resolveEntitlement } from '@/lib/entitlements';
import { burstCheck } from '@/lib/burst';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const burst = burstCheck(`otpv:${req.headers.get('x-forwarded-for') ?? 'local'}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many attempts');
  }

  let body: { email?: string; code?: string };
  try {
    body = (await req.json()) as { email?: string; code?: string };
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; fields: email, code');
  }
  if (!body.email || !body.code) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'email and code are required');
  }

  const result = await verifyOtp(body.email, body.code);
  if (!result.ok) {
    const msg =
      result.reason === 'locked'
        ? 'too many wrong codes — locked for the day'
        : result.reason === 'expired'
          ? 'code expired — request a new one'
          : 'wrong code';
    return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', msg);
  }

  const user = await upsertUserByEmail(result.email);
  if (user.status !== 'active') {
    return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'account is not active');
  }

  // Free-default entitlement (VOL-01 §4.1 projection bootstrap).
  await resolveEntitlement(user.id);

  const tokens = await createSession(user.id, 'pwa', req);
  await setSessionCookie(req, tokens);

  return ok({
    user_id: user.id,
    handle: user.handle,
    display_name: user.displayName,
    consent_state: user.aiTrainingConsent,
    consent_asked: user.consentAskedAt !== null,
  });
}
