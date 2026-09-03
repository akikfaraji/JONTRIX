// MCP bearer resolution — VOL-10 §2/§4.10 (LOCKED).
// Kind check precedes every other authorization decision: a PAT on any
// /api/mcp/* route is 403 TOKEN_KIND_MISMATCH before scope, tier, or quota
// is consulted, and nothing is metered (D-03, §8.11). AUTH_INVALID answers
// are uniformly delayed by 100 ms to blunt timing oracles (§8.10).

import { db } from '@/lib/db';
import { bearerHash } from '@/lib/tokens';

export interface McpAuth {
  kind: 'aat' | 'sess';
  tokenId: string;
  userId: string;
  scopes: Record<string, unknown>;
  /** sess access tokens proxy the AAT that approved the device flow. */
  aatTokenId: string | null;
  name: string | null;
}

export type McpResolve =
  | { outcome: 'ok'; auth: McpAuth }
  | { outcome: 'pat' } // valid PAT — route answers TOKEN_KIND_MISMATCH
  | { outcome: 'missing' } // no/malformed bearer → AUTH_REQUIRED
  | { outcome: 'invalid' }; // unknown/revoked/expired → AUTH_INVALID

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resolveMcpBearer(req: Request): Promise<McpResolve> {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(jx_(?:pat|aat|sess)_[0-9a-f]{64})$/i.exec(header.trim());
  if (!match) return { outcome: 'missing' };
  const secret = match[1];

  const row = await db.token.findUnique({ where: { hashSha256: bearerHash(secret) } });
  if (!row) {
    await sleep(100); // §8.10 uniform delay
    return { outcome: 'invalid' };
  }
  if (row.kind === 'pat') {
    // Kind isolation check comes first — a PAT never reaches status/quota
    // evaluation here, and no request counters move (§8.11).
    return { outcome: 'pat' };
  }
  if (row.status !== 'active') {
    await sleep(100);
    return { outcome: 'invalid' };
  }
  if (row.expiresAt && row.expiresAt < new Date()) {
    await sleep(100);
    return { outcome: 'invalid' };
  }

  // Touch last-used (attribution is the point of the taxonomy, §2).
  await db.token.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });

  let scopes: Record<string, unknown> = {};
  try {
    scopes = JSON.parse(row.scopesJson || '{}') as Record<string, unknown>;
  } catch {
    scopes = {};
  }

  // A sess access row carries the AAT it proxies in scopes_json.__aat_id.
  const aatTokenId = typeof scopes.__aat_id === 'string' ? (scopes.__aat_id as string) : null;
  if (aatTokenId) delete scopes.__aat_id;

  return {
    outcome: 'ok',
    auth: {
      kind: row.kind === 'sess' ? 'sess' : 'aat',
      tokenId: row.id,
      userId: row.userId,
      scopes,
      aatTokenId,
      name: row.name,
    },
  };
}

/** Map a resolve outcome to the §4.10 refusal, or null to proceed. */
export async function mcpAuthFailure(
  resolved: McpResolve,
): Promise<Response | null> {
  switch (resolved.outcome) {
    case 'ok':
      return null;
    case 'missing':
      return Response.json(
        { ok: false, error: { code: 'AUTH_REQUIRED', message: 'missing or malformed bearer' } },
        { status: 401 },
      );
    case 'invalid':
      return Response.json(
        { ok: false, error: { code: 'AUTH_INVALID', message: 'unknown, revoked, or expired token' } },
        { status: 401 },
      );
    case 'pat':
      return Response.json(
        {
          ok: false,
          error: {
            code: 'TOKEN_KIND_MISMATCH',
            message:
              'PATs are data-plane credentials for /api/v1/* and never drive agents — create an AAT in the dashboard (Settings → Tokens)',
          },
        },
        { status: 403 },
      );
  }
}

/**
 * All-in-one gate for /api/mcp/* handlers: resolves the bearer, applies the
 * §4.10 refusal mapping, and returns either the auth context or a final
 * Response — never null — so route signatures stay `Promise<Response>`.
 */
export async function requireMcpAuth(
  req: Request,
): Promise<{ auth: McpAuth; failure: null } | { auth: null; failure: Response }> {
  const resolved = await resolveMcpBearer(req);
  const failure = await mcpAuthFailure(resolved);
  if (failure !== null || resolved.outcome !== 'ok') {
    return {
      auth: null,
      failure:
        failure ??
        Response.json(
          { ok: false, error: { code: 'AUTH_REQUIRED', message: 'missing or malformed bearer' } },
          { status: 401 },
        ),
    };
  }
  return { auth: resolved.auth, failure: null };
}
