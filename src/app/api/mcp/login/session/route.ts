// POST /api/mcp/login/session — completes email-OTP sign-in started on the
// /api/mcp/login front door (VOL-10 §3.1 step 3: the page asks the visitor
// to sign in). Verifies the code, provisions the user, sets the browser
// session cookie, and returns to the device-approval page. This route only
// ever creates a browser session — never a token (D-04).

import { verifyOtp, upsertUserByEmail, createSession, setSessionCookie } from '@/lib/auth';
import { ipLimit, clientIp } from '@/lib/mcp/ratelimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!ipLimit(`loginsession:${ip}`).ok) {
    return new Response('Too many requests', { status: 429 });
  }

  const params = new URLSearchParams(await req.text());
  const email = (params.get('email') ?? '').trim();
  const code = (params.get('code') ?? '').trim();
  const userCode = (params.get('user_code') ?? '').trim();

  if (!email || !code) {
    return Response.redirect(
      new URL(`/api/mcp/login?user_code=${encodeURIComponent(userCode)}&error=missing`, req.url),
      303,
    );
  }

  const verified = await verifyOtp(email, code);
  if (!verified.ok) {
    return Response.redirect(
      new URL(`/api/mcp/login?user_code=${encodeURIComponent(userCode)}&error=${verified.reason}`, req.url),
      303,
    );
  }

  const user = await upsertUserByEmail(verified.email);
  const tokens = await createSession(user.id, 'dashboard', req);
  await setSessionCookie(req, tokens);

  return Response.redirect(
    new URL(`/api/mcp/login?user_code=${encodeURIComponent(userCode)}`, req.url),
    303,
  );
}
