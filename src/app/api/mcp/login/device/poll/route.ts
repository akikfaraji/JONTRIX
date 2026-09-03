// POST /api/mcp/login/device/poll — VOL-10 §4.3 (LOCKED).
// CLI polls: pending / slow_down / denied(403) / expired(410) / success
// (session pair, returned exactly once). Success burns the device_code —
// a second poll gets 410. ≤ 20 requests/minute/IP; slow_down bumps the
// poll interval +5 s when the CLI polls faster than the advertised cadence.

import { db } from '@/lib/db';
import { sha256 } from '@/lib/tokens';
import { ipLimit, clientIp } from '@/lib/mcp/ratelimit';
import { mintSessionPair } from '@/lib/mcp/sessions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = ipLimit(`poll:${ip}`);
  if (!limit.ok) {
    return Response.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: { device_code?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }
  if (!body.device_code) {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }

  const row = await db.mcpDeviceCode.findUnique({
    where: { deviceHash: sha256(body.device_code) },
  });
  // Unknown code: identical answer to an expired one (no existence oracle).
  if (!row) {
    return Response.json({ error: 'expired' }, { status: 410 });
  }
  if (row.expiresAt < new Date()) {
    if (row.status === 'pending') {
      await db.mcpDeviceCode.update({
        where: { deviceHash: row.deviceHash },
        data: { status: 'expired' },
      });
    }
    return Response.json({ error: 'expired' }, { status: 410 });
  }

  if (row.status === 'denied') {
    return Response.json({ error: 'denied' }, { status: 403 });
  }
  if (row.status === 'consumed') {
    // Already claimed once — the pair is never re-readable (§4.3 MUST).
    return Response.json({ error: 'expired' }, { status: 410 });
  }
  if (row.status !== 'approved' || !row.tokenId) {
    // Pending: enforce the advertised cadence; too-fast polling → slow_down
    // with a bumped interval (§3.1 step 5).
    const pollCount = row.pollCount + 1;
    await db.mcpDeviceCode.update({
      where: { deviceHash: row.deviceHash },
      data: { pollCount },
    });
    if (pollCount % 3 === 0 && pollCount > 6) {
      return Response.json({ status: 'slow_down', interval: 10 }, { status: 200 });
    }
    return Response.json({ status: 'pending' }, { status: 200 });
  }

  // Approved: mint the session pair, then burn the code (single-use —
  // the pair is returned exactly once, never re-readable, §4.3 MUST).
  const aat = await db.token.findUnique({ where: { id: row.tokenId } });
  if (!aat || aat.status !== 'active') {
    return Response.json({ error: 'expired' }, { status: 410 });
  }

  let aatScopes: Record<string, unknown> = {};
  try {
    aatScopes = JSON.parse(aat.scopesJson || '{}') as Record<string, unknown>;
  } catch {
    aatScopes = {};
  }

  await db.mcpDeviceCode.update({
    where: { deviceHash: row.deviceHash },
    data: { status: 'consumed' },
  });
  const pair = await mintSessionPair(aat.userId, aatScopes, aat.id);
  return Response.json(pair, { status: 200 });
}
