// OAuth (Google + GitHub) — authorization-code flow with single-use state
// (KvState, hashed, 10-min TTL). Account linking rule: an unclaimed provider
// identity auto-links ONLY when the profile email is verified on an existing
// JONTRIX account (OTP login or prior verification proves ownership);
// otherwise it refuses honestly — no account takeover via unverified email.

import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { sha256, randomSecret } from '@/lib/tokens';

export type Provider = 'google' | 'github';

export const PROVIDERS: Record<Provider, {
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  configured: () => boolean;
  clientId: () => string | undefined;
  clientSecret: () => string | undefined;
}> = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    configured: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
    configured: () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET,
  },
};

export function isProvider(v: string): v is Provider {
  return v === 'google' || v === 'github';
}

export function callbackUrl(req: Request, provider: Provider): string {
  const origin = process.env.APP_ORIGIN ?? new URL(req.url).origin;
  return `${origin}/api/auth/oauth/${provider}/callback`;
}

// ── state (CSRF) ─────────────────────────────────────────────────────────────

export async function mintState(): Promise<string> {
  const state = randomSecret() + randomBytes(8).toString('base64url');
  await db.kvState.upsert({
    where: { key: `oauth_state:${sha256(state)}` },
    create: { key: `oauth_state:${sha256(state)}`, value: '1', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    update: { value: '1', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  return state;
}

/** Single-use consume: a replayed state refuses. */
export async function consumeState(state: string): Promise<boolean> {
  const key = `oauth_state:${sha256(state)}`;
  const row = await db.kvState.findUnique({ where: { key } });
  if (!row || row.expiresAt < new Date()) return false;
  await db.kvState.delete({ where: { key } }).catch(() => undefined);
  return true;
}

// ── profile exchange ────────────────────────────────────────────────────────

export interface OAuthProfile {
  providerUid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
}

export async function exchangeCode(
  provider: Provider,
  code: string,
  req: Request,
): Promise<OAuthProfile | { error: string }> {
  const conf = PROVIDERS[provider];
  const clientId = conf.clientId();
  const clientSecret = conf.clientSecret();
  if (!clientId || !clientSecret) return { error: 'provider not configured' };

  const tokenRes = await fetch(conf.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl(req, provider),
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!tokenRes.ok) return { error: `token exchange failed (${tokenRes.status})` };
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) return { error: 'no access token in exchange response' };

  if (provider === 'google') {
    const ui = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!ui.ok) return { error: `profile fetch failed (${ui.status})` };
    const p = (await ui.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string };
    if (!p.email) return { error: 'google profile carries no email — grant the email scope' };
    return {
      providerUid: p.sub,
      email: p.email.toLowerCase(),
      emailVerified: p.email_verified === true,
      displayName: p.name ?? null,
    };
  }

  // github
  const ui = await fetch('https://api.github.com/user', {
    headers: { authorization: `Bearer ${tokenJson.access_token}`, accept: 'application/vnd.github+json' },
  });
  if (!ui.ok) return { error: `profile fetch failed (${ui.status})` };
  const p = (await ui.json()) as { id: number; login: string; name?: string; email?: string };

  let email = p.email;
  let emailVerified = Boolean(email); // GitHub public emails on /user are confirmed addresses
  if (!email) {
    const em = await fetch('https://api.github.com/user/emails', {
      headers: { authorization: `Bearer ${tokenJson.access_token}`, accept: 'application/vnd.github+json' },
    });
    if (em.ok) {
      const list = (await em.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
      const primary = list.find((e) => e.primary && e.verified) ?? list.find((e) => e.verified);
      if (primary) {
        email = primary.email;
        emailVerified = primary.verified;
      }
    }
  }
  if (!email) return { error: 'github account has no verified email — add one on github.com' };
  return {
    providerUid: String(p.id),
    email: email.toLowerCase(),
    emailVerified,
    displayName: p.name ?? p.login,
  };
}
