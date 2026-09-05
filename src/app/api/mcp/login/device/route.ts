// POST /api/mcp/login/device — VOL-10 §4.2 (LOCKED).
// Issues device_code (43-char url-safe, stored hashed, single-use) +
// user_code (JX-XXXX-XXXX from a 31-char unambiguous set). 20/min/IP.
// Codes expire at expires_in exactly (900 s).

import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { sha256 } from '@/lib/tokens';
import { ipLimit, clientIp } from '@/lib/mcp/ratelimit';
import { readJsonWithLimit } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// 31 characters, ambiguous glyphs excluded (0/O, 1/I/L, and friends).
const USER_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function generateUserCode(): string {
  const bytes = randomBytes(8);
  const chars = [...bytes].map((b) => USER_CODE_ALPHABET[b % USER_CODE_ALPHABET.length]);
  return `JX-${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}`;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = ipLimit(`device:${ip}`);
  if (!limit.ok) {
    return Response.json(
      { error: 'rate_limited', retry_after: limit.retryAfter },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: { agent_name?: string; client_hint?: string } = {};
  try {
    const parsedBody = await readJsonWithLimit(req, 4 * 1024);

    if (!parsedBody.ok) throw new Error('BAD_BODY');

    body = parsedBody.body as typeof body;
  } catch {
    // empty body is valid per §4.2
  }

  const deviceCode = `dvc_${randomBytes(32).toString('base64url')}`; // 43 chars after prefix
  const userCode = generateUserCode();
  const expiresAt = new Date(Date.now() + 900_000);

  await db.mcpDeviceCode.create({
    data: {
      deviceHash: sha256(deviceCode),
      userCode,
      status: 'pending',
      agentName: body.agent_name?.slice(0, 100) ?? null,
      clientHint: body.client_hint?.slice(0, 200) ?? null,
      issuedIp: ip,
      expiresAt,
    },
  });

  const origin = new URL(req.url).origin;
  return Response.json(
    {
      device_code: deviceCode,
      user_code: userCode,
      verify_url: `${origin}/api/mcp/login`,
      interval: 5,
      expires_in: 900,
    },
    { status: 201 },
  );
}
