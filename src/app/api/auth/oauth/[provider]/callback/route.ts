// GET /api/auth/oauth/[provider]/callback — authorization-code callback.
// Verifies the single-use state (CSRF), exchanges the code, then:
//   known identity → sign in
//   email matches a JONTRIX account whose email is verified → link + sign in
//   email matches an UNVERIFIED account → refuse (squatting guard)
//   new email → provision user, link, sign in, welcome mail
// Browser lands on a neutral HTML interstitial; errors carry a code param.

import { db } from '@/lib/db';
import { PROVIDERS, isProvider, consumeState, exchangeCode } from '@/lib/oauth';
import { createProvisionedUser, createSession, setSessionCookie } from '@/lib/auth';
import { resolveEntitlement } from '@/lib/entitlements';
import { welcomeEmail, newSignInEmail, sendMail } from '@/lib/mailer';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function land(req: Request, status: 'signed_in' | 'error', detail: string): Response {
  const origin = process.env.APP_ORIGIN ?? new URL(req.url).origin;
  const url = new URL(origin);
  url.searchParams.set('auth', status);
  if (status === 'error') url.searchParams.set('detail', detail);
  return Response.redirect(url.toString(), 302);
}

function errorPage(title: string, detail: string): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign-in failed — JONTRIX</title></head>
<body style="margin:0;background:#f6f6f6;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;padding:64px 24px;text-align:center;">
    <p style="font-size:15px;font-weight:700;letter-spacing:0.08em;margin:0 0 24px;">JONTRIX</p>
    <div style="background:#ffffff;border:1px solid #e4e4e4;border-radius:8px;padding:32px;">
      <h1 style="font-size:18px;margin:0 0 12px;">${title}</h1>
      <p style="font-size:14px;line-height:1.6;color:#555555;margin:0 0 24px;">${detail}</p>
      <a href="/" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:6px;">Back to JONTRIX</a>
    </div>
  </div>
</body></html>`,
    { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider)) return errorPage('Unknown provider', 'That sign-in provider is not supported.');

  const url = new URL(req.url);
  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    return land(req, 'error', oauthError === 'access_denied' ? 'authorization was denied at the provider' : `provider error: ${oauthError}`);
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return errorPage('Incomplete callback', 'The provider callback was missing its code or state parameter.');

  // single-use state (CSRF): replay or unknown state refuses
  if (!(await consumeState(state))) {
    return errorPage('Session expired', 'This sign-in attempt is no longer valid — start again from the sign-in dialog.');
  }

  const profile = await exchangeCode(provider, code, req);
  if ('error' in profile) return errorPage('Sign-in failed', profile.error);

  // 1. known identity → sign in
  const identity = await db.authIdentity.findUnique({
    where: { provider_providerUid: { provider, providerUid: profile.providerUid } },
    include: { user: true },
  });
  if (identity) {
    if (identity.user.status !== 'active') return errorPage('Account unavailable', 'This account is not active.');
    await db.user.update({ where: { id: identity.userId }, data: { lastSeenAt: new Date() } });
    await resolveEntitlement(identity.userId).catch(() => undefined);
    const tokens = await createSession(identity.userId, 'pwa', req);
    await setSessionCookie(req, tokens);
    if (identity.user.email && identity.user.emailVerified) {
      void sendMail({
        to: identity.user.email,
        ...newSignInEmail(req.headers.get('x-forwarded-for'), req.headers.get('user-agent')),
      }).catch(() => undefined);
    }
    return land(req, 'signed_in', 'ok');
  }

  // 2. email match — auto-link only when ownership is proven
  const existing = await db.user.findUnique({
    where: { email: profile.email },
    include: { authIdentities: true },
  });
  if (existing) {
    const emailProven = existing.emailVerified !== null || existing.authIdentities.some((i) => i.provider === 'email');
    if (!emailProven) {
      return errorPage(
        'Email already registered',
        'An unverified account already uses this address. Sign in with a code (to prove ownership) or reset the password, then link from account settings.',
      );
    }
    await db.authIdentity.create({
      data: { userId: existing.id, provider, providerUid: profile.providerUid, metaJson: JSON.stringify({ linked_email: profile.email }) },
    });
    await audit({
      actorKind: 'user_session',
      actorId: existing.id,
      event: 'account.linked',
      subject: `${provider}:${profile.providerUid}`,
    });
    await db.user.update({ where: { id: existing.id }, data: { lastSeenAt: new Date(), emailVerified: existing.emailVerified ?? new Date() } });
    await resolveEntitlement(existing.id).catch(() => undefined);
    const tokens = await createSession(existing.id, 'pwa', req);
    await setSessionCookie(req, tokens);
    if (existing.email) {
      void sendMail({
        to: existing.email,
        ...newSignInEmail(req.headers.get('x-forwarded-for'), req.headers.get('user-agent')),
      }).catch(() => undefined);
    }
    return land(req, 'signed_in', 'ok');
  }

  // 3. brand-new account (OAuth-only: no password credential — identity auth)
  try {
    const user = await createProvisionedUser(profile.email, null, profile.displayName);
    await db.authIdentity.create({
      data: { userId: user.id, provider, providerUid: profile.providerUid },
    });
    await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    await audit({ actorKind: 'user_session', actorId: user.id, event: 'account.created', subject: `${provider}-oauth` });
    await resolveEntitlement(user.id).catch(() => undefined);
    if (user.email) await sendMail({ to: user.email, ...welcomeEmail(user.handle) });
    const tokens = await createSession(user.id, 'pwa', req);
    await setSessionCookie(req, tokens);
    return land(req, 'signed_in', 'ok');
  } catch {
    return errorPage('Sign-in failed', 'The account could not be provisioned — the email may have been registered a moment ago.');
  }
}
