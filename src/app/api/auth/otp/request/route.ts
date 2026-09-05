// POST /api/auth/otp/request — email OTP issuance (VOL-06 §2).
// Codes are hashed at rest, TTL 10 min; delivery driver sends real mail when
// SMTP is configured, else the honest dev log driver. Lockout after 5 failed
// verifies, keyed for the UTC day (T6.1). Anti-abuse: per-IP burst window AND
// per-email daily send cap + minimum resend interval — rotating spoofed
// X-Forwarded-For values cannot trigger unlimited emails to a victim address.

import { issueOtp } from '@/lib/auth';
import { ok, fail, ERR } from '@/lib/envelope';
import { burstCheck } from '@/lib/burst';
import { isEmail, readJsonWithLimit } from '@/lib/validate';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const burst = burstCheck(`otp:${req.headers.get('x-forwarded-for') ?? 'local'}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many code requests');
  }

  let body: { email?: unknown };
  try {
    const parsedBody = await readJsonWithLimit(req, 4 * 1024);

    if (!parsedBody.ok) throw new Error('BAD_BODY');

    body = parsedBody.body as { email?: unknown };
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; field: email');
  }
  if (!isEmail(body.email)) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'a valid email is required', {
      field: 'email',
    });
  }

  const result = await issueOtp(body.email);
  if (!result.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many attempts — locked for the day', {
      resets_at: result.resets_at,
    });
  }

  // The code itself never crosses the wire; the UI states where to find it.
  return ok({
    sent: true,
    delivery: result.driver,
    message:
      result.driver === 'smtp'
        ? 'Verification code sent to your email address.'
        : 'Verification code generated. In this build environment it appears in the server log.',
  });
}
