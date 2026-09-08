// GET /api/auth/oauth/[provider]/status — cheap configuration probe for the
// sign-in dialog. Returns whether the provider has client credentials set.
//
// Why this exists: the dialog used to probe the start route with
// fetch(..., { redirect: 'manual' }) and check status === 302 — but the Fetch
// spec turns a manual-redirect response into an opaqueredirect whose status
// is 0, so the check never held and the Google button stayed permanently
// disabled even with a fully correct setup (found in live debugging,
// 2026-09-08). This route has zero side effects: no burst slot, no state
// minting, no database — just env reads. Revealing "configured" is harmless:
// the sign-in UI exposes the same information through button availability.

import { ok } from '@/lib/envelope';
import { PROVIDERS, isProvider } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider)) {
    return ok({ provider, configured: false });
  }
  return ok({ provider, configured: PROVIDERS[provider].configured() });
}
