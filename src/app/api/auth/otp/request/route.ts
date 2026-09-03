// POST /api/auth/otp/request — email OTP issuance (VOL-06 §2).
// Codes are hashed at rest, TTL 10 min; the dev log driver prints the code
// to the server log (honest dev-mode copy ships in the UI). Lockout after
// 5 failed verifies, keyed for the UTC day (T6.1).

import { issueOtp } from '@/lib/auth';
import { ok, fail, ERR } from '@/lib/envelope';
import { burstCheck } from '@/lib/burst';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const burst = burstCheck(`otp:${req.headers.get('x-forwarded-for') ?? 'local'}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many code requests');
  }

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; field: email');
  }
  const email = body.email?.trim() ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'a valid email is required', {
      field: 'email',
    });
  }

  const result = await issueOtp(email);
  if (!result.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many attempts — locked for the day', {
      resets_at: result.resets_at,
    });
  }

  // The code itself never crosses the wire; the UI states where to find it.
  return ok({
    sent: true,
    delivery: 'log',
    message:
      'Verification code sent. In this build environment it appears in the server log.',
  });
}
