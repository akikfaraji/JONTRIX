// GET /api/auth/verify-email?token=… — the link target from verification
// emails. Consumes the single-use token, stamps emailVerified, audits, and
// sends the welcome email on FIRST verification. The browser lands on a
// minimal neutral page (no JSON) with a link back into the app.
// POST /api/auth/verify-email { token } — same logic for in-app forms.

import { db } from '@/lib/db';
import { burstCheck } from '@/lib/burst';
import { consumeAuthToken } from '@/lib/auth-tokens';
import { welcomeEmail, sendMail } from '@/lib/mailer';
import { audit } from '@/lib/audit';
import { readJsonWithLimit } from '@/lib/validate';
import { ok, fail, ERR } from '@/lib/envelope';

export const dynamic = 'force-dynamic';

function landing(success: boolean, headline: string, detail: string): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${success ? 'Email verified' : 'Verification failed'} — JONTRIX</title></head>
<body style="margin:0;background:#f6f6f6;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;padding:64px 24px;text-align:center;">
    <p style="font-size:15px;font-weight:700;letter-spacing:0.08em;margin:0 0 24px;">JONTRIX</p>
    <div style="background:#ffffff;border:1px solid #e4e4e4;border-radius:8px;padding:32px;">
      <h1 style="font-size:18px;margin:0 0 12px;">${headline}</h1>
      <p style="font-size:14px;line-height:1.6;color:#555555;margin:0 0 24px;">${detail}</p>
      <a href="/" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:6px;">Open JONTRIX</a>
    </div>
  </div>
</body></html>`,
    { status: success ? 200 : 400, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

async function consume(token: string): Promise<{ ok: true; first: boolean } | { ok: false; reason: string }> {
  const consumed = await consumeAuthToken(token, 'email_verify');
  if (!consumed.ok) return { ok: false, reason: consumed.reason };

  const user = await db.user.findUnique({ where: { id: consumed.userId } });
  if (!user) return { ok: false, reason: 'invalid' };

  const first = user.emailVerified === null;
  await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });

  await audit({
    actorKind: 'user_session',
    actorId: user.id,
    event: 'email.verified',
    subject: user.id,
  });

  if (first && user.email) {
    await sendMail({ to: user.email, ...welcomeEmail(user.handle) });
  }
  return { ok: true, first };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';
  if (!token) return landing(false, 'Verification failed', 'This link is missing its token — request a new verification email from your account settings.');

  const result = await consume(token);
  if (!result.ok) {
    return landing(
      false,
      'Verification failed',
      'This verification link is invalid, already used, or expired. Sign in and request a fresh one from your account settings.',
    );
  }
  return landing(true, 'Email verified', 'Your email address is confirmed. Everything on your account is now unlocked.');
}

export async function POST(req: Request) {
  const parsed = await readJsonWithLimit(req, 4 * 1024);
  if (!parsed.ok) return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; field: token');
  const body = parsed.body as { token?: unknown };
  if (typeof body.token !== 'string' || !body.token) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'a verification token is required', { field: 'token' });
  }
  void burstCheck('verify-email'); // per-IP soft cap; token itself is single-use
  const result = await consume(body.token);
  if (!result.ok) {
    return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'this verification link is invalid, already used, or expired');
  }
  return ok({ verified: true });
}
