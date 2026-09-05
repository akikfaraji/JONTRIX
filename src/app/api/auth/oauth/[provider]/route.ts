// GET /api/auth/oauth/[provider] — OAuth start (google | github).
// Mints a single-use state (hashed, 10-min TTL) and redirects to the
// provider. Unconfigured provider → honest 503 JSON, never a fake redirect.

import { NextResponse } from 'next/server';
import { PROVIDERS, isProvider, mintState, callbackUrl } from '@/lib/oauth';
import { burstCheck } from '@/lib/burst';
import { fail, ERR } from '@/lib/envelope';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider)) {
    return fail(ERR.NOT_FOUND, 'NOT_FOUND', 'unknown OAuth provider');
  }
  const burst = burstCheck(`oauth:${req.headers.get('x-forwarded-for') ?? 'local'}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many OAuth attempts');
  }

  const conf = PROVIDERS[provider];
  if (!conf.configured()) {
    return fail(
      503,
      'TOOL_UNAVAILABLE',
      `${provider} sign-in is not configured in this environment — set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET`,
    );
  }

  const state = await mintState();
  const authorize = new URL(conf.authorizeUrl);
  authorize.searchParams.set('client_id', conf.clientId()!);
  authorize.searchParams.set('redirect_uri', callbackUrl(req, provider));
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', conf.scope);
  authorize.searchParams.set('state', state);
  if (provider === 'google') {
    authorize.searchParams.set('access_type', 'online');
    authorize.searchParams.set('prompt', 'select_account');
  }

  return NextResponse.redirect(authorize.toString(), { status: 302 });
}
