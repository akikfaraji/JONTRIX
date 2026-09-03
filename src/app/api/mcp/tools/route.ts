// GET /api/mcp/tools — tool catalog filtered to scopes + tier (VOL-10 §4.5).
// List = (mcp_exposed ∧ built ∧ server-runnable) ∧ tier unlock ∧ AAT scope.
// A scoped-out tool is omitted, never listed-and-refused. ETag = hash of the
// filtered list; 304 on match; Cache-Control: private, max-age=300.
// Tool metadata derives from the same manifest source the dispatcher uses
// (VOL-10 §1.1: never a second implementation of tool metadata).

import { createHash } from 'node:crypto';
import { requireMcpAuth } from '@/lib/mcp/auth';
import { toolAllowed } from '@/lib/mcp/scopes';
import { resolveEntitlement, tierUnlocks } from '@/lib/entitlements';
import { db } from '@/lib/db';
import { MCP_PROTOCOL_VERSION } from '@/lib/mcp/protocol';
import { getServerEngine } from '@/lib/jont-runtime/engines';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { auth, failure } = await requireMcpAuth(req);
  if (failure) return failure;

  const ent = await resolveEntitlement(auth.userId);

  const rows = await db.jont.findMany({
    where: { mcpExposed: true, status: 'built', context: { not: 'client' } },
    orderBy: { id: 'asc' },
  });

  const tools: Array<Record<string, unknown>> = [];
  for (const r of rows) {
    if (!tierUnlocks(ent.tier, r.tierFit as 'FREE' | 'PRO' | 'MAX')) continue;
    if (!toolAllowed(auth.scopes, r.id)) continue;
    const engine = getServerEngine(r.id);
    tools.push({
      name: r.id,
      title: r.title,
      description: r.description ?? r.title,
      inputSchema: engine?.manifest.io.input ?? { type: 'object', properties: {} },
      tier_fit: r.tierFit,
      mcp_exposed: r.mcpExposed,
    });
  }

  const body = JSON.stringify({ protocol_version: MCP_PROTOCOL_VERSION, tools });
  const tag = `"${createHash('sha256').update(body).digest('hex').slice(0, 32)}"`;

  if (req.headers.get('if-none-match') === tag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: tag, 'Cache-Control': 'private, max-age=300' },
    });
  }

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ETag: tag,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
