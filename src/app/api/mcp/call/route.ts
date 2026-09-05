// POST /api/mcp/call — the metered tool pipeline (VOL-10 §4.6, §7; LOCKED).
// Order: auth → kind check (PAT → TOKEN_KIND_MISMATCH, nothing metered) →
// token status → scope → tier → monthly MCP quota → AAT daily clamp → burst
// → idempotency replay/409 → argument validation → dispatch → meter
// (mcp_usage_daily rollup + jont_usage ledger with source='mcp').
// A failure at any stage never executes the tool.

import { randomUUID } from 'node:crypto';
import { requireMcpAuth } from '@/lib/mcp/auth';
import { toolAllowed, aatDailyClamp } from '@/lib/mcp/scopes';
import { resolveEntitlement, tierUnlocks, checkAndIncrement } from '@/lib/entitlements';
import { burstCheck } from '@/lib/burst';
import { preflightJont, dispatchServerJont } from '@/lib/jont-runtime/dispatch';
import { db } from '@/lib/db';
import { utcDay, dailyResetsAt } from '@/lib/utc';
import { UPGRADE_URL } from '@/lib/mcp/protocol';
import { readJsonWithLimit } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const INLINE_IDEMPOTENCY_BYTES = 4 * 1024; // §6: inline response ≤ 4 KB

export async function POST(req: Request) {
  const started = Date.now();
  const { auth, failure } = await requireMcpAuth(req);
  if (failure) return failure;

  let body: { tool?: string; arguments?: Record<string, unknown>; idempotency_key?: string };
  try {
    const parsedBody = await readJsonWithLimit(req, 256 * 1024);

    if (!parsedBody.ok) throw new Error('BAD_BODY');

    body = parsedBody.body as typeof body;
  } catch {
    return Response.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'malformed JSON body' } },
      { status: 400 },
    );
  }
  const tool = (body.tool ?? '').trim();
  const args = body.arguments ?? {};
  const idemKey = body.idempotency_key ? body.idempotency_key.slice(0, 128) : null;

  // ── scope (the exact AAT is named, never the owner — §4.10) ──
  if (!toolAllowed(auth.scopes, tool)) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'FORBIDDEN_TOOL',
          message: `this AAT${auth.name ? ` (${auth.name})` : ''} is not scoped for ${tool} — edit its scopes in the dashboard (a replacement token is issued)`,
        },
      },
      { status: 403 },
    );
  }

  // ── tool existence (404 before tier/quota burns anything) ──
  const preflight = await preflightJont(tool, args);
  if (preflight) {
    const status =
      preflight.code === 'UNKNOWN_TOOL'
        ? 404
        : preflight.code === 'TOOL_UNAVAILABLE'
          ? 503
          : preflight.code === 'CLIENT_CONTEXT'
            ? 400
            : preflight.code === 'ARGUMENTS_INVALID'
              ? 422
              : preflight.code === 'NOT_FOUND'
                ? 404
                : 400;
    const code =
      preflight.code === 'CLIENT_CONTEXT'
        ? 'TOOL_UNAVAILABLE'
        : preflight.code;
    return Response.json(
      {
        ok: false,
        error: {
          code,
          message: preflight.message,
          ...(preflight.issues ? { fields: preflight.issues } : {}),
        },
      },
      { status },
    );
  }

  // ── tier gate (VOL-01 §4.2 mapping) ──
  const row = await db.jont.findUnique({ where: { id: tool }, select: { tierFit: true } });
  const ent = await resolveEntitlement(auth.userId);
  if (!row || !tierUnlocks(ent.tier, row.tierFit as 'FREE' | 'PRO' | 'MAX')) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'TIER_LOCKED',
          message: `your ${ent.tier} tier does not unlock ${tool} — upgrade to use it`,
          upgrade_url: UPGRADE_URL,
        },
      },
      { status: 402 },
    );
  }

  // ── idempotency replay (§4.6 / §6 mcp_idempotency, TTL 24 h) ──
  if (idemKey) {
    const existing = await db.mcpIdempotency.findUnique({
      where: { tokenId_idemKey: { tokenId: auth.tokenId, idemKey } },
    });
    if (existing) {
      if (existing.status === 0) {
        // in-flight execution — never double-run (§6 MUST)
        return Response.json(
          { ok: false, error: { code: 'CONFLICT_IDEMPOTENCY', message: 'the original call is still executing' } },
          { status: 409 },
        );
      }
      const replayBody: Record<string, unknown> = {
        ok: true,
        replayed: true,
        call_id: existing.callId,
      };
      if (existing.responseRef && existing.responseRef.startsWith('{')) {
        try {
          replayBody.result = JSON.parse(existing.responseRef).result;
          replayBody.usage = JSON.parse(existing.responseRef).usage;
        } catch {
          /* replay without body is still a replay */
        }
      } else {
        replayBody.note = 'original response body expired — replay is metadata-only';
      }
      return Response.json(replayBody, { status: existing.status });
    }
    // Reserve the key (status 0 = in-flight). Executions that follow will
    // update the row; a concurrent replay sees status 0 → 409.
    try {
      await db.mcpIdempotency.create({
        data: {
          tokenId: auth.tokenId,
          idemKey,
          callId: '',
          status: 0,
        },
      });
    } catch {
      // unique-constraint race: another caller reserved first → in-flight 409
      return Response.json(
        { ok: false, error: { code: 'CONFLICT_IDEMPOTENCY', message: 'the original call is still executing' } },
        { status: 409 },
      );
    }
  }

  const finishIdempotency = async (status: number, resultBody: unknown): Promise<void> => {
    if (!idemKey) return;
    const ref = JSON.stringify(resultBody);
    await db.mcpIdempotency.update({
      where: { tokenId_idemKey: { tokenId: auth.tokenId, idemKey } },
      data: {
        status,
        callId: callId,
        responseRef: Buffer.byteLength(ref, 'utf8') <= INLINE_IDEMPOTENCY_BYTES ? ref : null,
      },
    });
  };

  const callId = randomUUID();

  // ── monthly MCP quota (authoritative, in the dispatch decision) ──
  const quota = await checkAndIncrement(auth.userId, 'mcp');
  if (!quota.allowed) {
    await finishIdempotency(402, {
      ok: false,
      error: { code: 'QUOTA_EXCEEDED', message: 'monthly MCP quota exhausted', resets_at: quota.resets_at },
    });
    await meterRollup(auth.tokenId, 0, 0, 1, 0);
    return Response.json(
      {
        ok: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: 'monthly MCP quota exhausted',
          resets_at: quota.resets_at,
          upgrade_url: UPGRADE_URL,
        },
      },
      { status: 402 },
    );
  }

  // ── AAT daily clamp (§2/§7: the smaller of clamp vs monthly governs) ──
  const clamp = aatDailyClamp(auth.scopes);
  if (clamp !== null) {
    const day = utcDay();
    const rollup = await db.mcpUsageDaily.findUnique({
      where: { tokenId_day: { tokenId: auth.tokenId, day } },
    });
    if ((rollup?.calls ?? 0) >= clamp) {
      await finishIdempotency(402, {
        ok: false,
        error: { code: 'QUOTA_EXCEEDED', message: 'AAT daily clamp reached' },
      });
      return Response.json(
        {
          ok: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `this AAT is clamped to ${clamp} calls/day — raise the clamp in the dashboard (issues a replacement token)`,
            resets_at: dailyResetsAt(),
          },
        },
        { status: 402 },
      );
    }
  }

  // ── burst window: 10 calls / 10 s per bearer (§4.10) ──
  const burst = burstCheck(`mcp:${auth.tokenId}`);
  if (!burst.ok) {
    await finishIdempotency(429, {
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'burst window tripped' },
    });
    await meterRollup(auth.tokenId, 0, 0, 1, 0);
    return Response.json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'max 10 calls per 10 s — slow down' } },
      { status: 429, headers: { 'Retry-After': String(burst.retryAfter) } },
    );
  }

  // ── dispatch (execution + jont_usage ledger inside dispatch) ──
  const outcome = await dispatchServerJont(tool, args, {
    userId: auth.userId,
    concurrentJobs: ent.limits.concurrent_jobs,
    source: 'mcp',
    tokenId: auth.tokenId,
  });

  if (!outcome.ok) {
    await meterRollup(auth.tokenId, 0, 0, outcome.status < 500 ? 1 : 0, outcome.status >= 500 ? 1 : 0);
    const code = outcome.code === 'CLIENT_CONTEXT' ? 'TOOL_UNAVAILABLE' : outcome.code;
    const status =
      code === 'RATE_LIMITED'
        ? 429
        : code === 'TOOL_UNAVAILABLE'
          ? 503
          : code === 'ARGUMENTS_INVALID'
            ? 422
            : code === 'UNKNOWN_TOOL' || code === 'NOT_FOUND'
              ? 404
              : 500;
    await finishIdempotency(status, { ok: false, error: { code, message: outcome.message } });
    return Response.json({ ok: false, error: { code, message: outcome.message } }, { status });
  }

  const ms = Date.now() - started;
  await meterRollup(auth.tokenId, 1, ms, 0, 0, outcome.bytesOut);

  const quotaRemaining = {
    daily: clamp !== null ? Math.max(0, clamp - (await mcpCallsToday(auth.tokenId))) : (await dailyRemaining(auth.userId)),
    monthly: quota.snapshot.remaining,
  };

  const responseBody = {
    ok: true,
    result: outcome.result,
    usage: {
      call_id: callId,
      ms,
      quota_remaining: quotaRemaining,
    },
  };
  await finishIdempotency(200, responseBody);
  return Response.json(responseBody, { status: 200 });
}

async function mcpCallsToday(tokenId: string): Promise<number> {
  const r = await db.mcpUsageDaily.findUnique({
    where: { tokenId_day: { tokenId, day: utcDay() } },
  });
  return r?.calls ?? 0;
}

async function dailyRemaining(userId: string): Promise<number> {
  const { quotaSnapshot } = await import('@/lib/entitlements');
  const ent = await resolveEntitlement(userId);
  const snap = await quotaSnapshot(ent, 'srv');
  return snap.remaining;
}

/** mcp_usage_daily rollup (VOL-10 §6) — two writes per call total. */
async function meterRollup(
  tokenId: string,
  calls: number,
  ms: number,
  error4xx: number,
  error5xx: number,
  bytesOut = 0,
): Promise<void> {
  if (calls === 0 && error4xx === 0 && error5xx === 0) return;
  const day = utcDay();
  await db.mcpUsageDaily.upsert({
    where: { tokenId_day: { tokenId, day } },
    create: { tokenId, day, calls, msTotal: ms, bytesOut, error4xx, error5xx },
    update: {
      calls: { increment: calls },
      msTotal: { increment: ms },
      bytesOut: { increment: bytesOut },
      error4xx: { increment: error4xx },
      error5xx: { increment: error5xx },
    },
  });
}
