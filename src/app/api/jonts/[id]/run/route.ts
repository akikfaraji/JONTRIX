// POST /api/jonts/[id]/run — server dispatch (VOL-11 §4, VOL-05 §4).
// Auth: browser session or PAT bearer (data plane). AAT here is a kind
// mismatch (D-03): AATs drive /api/mcp/* only. The daily server counter is
// consumed atomically BEFORE execution; client-context Jonts are refused
// honestly (T11.5); planned/disabled Jonts refuse with honest status.

import { getSessionAuth } from '@/lib/auth';
import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { checkAndIncrement, refundCounter, resolveEntitlement } from '@/lib/entitlements';
import { dispatchServerJont, preflightJont, tryAcquireSlot, releaseSlot } from '@/lib/jont-runtime/dispatch';
import { getBuiltJontIds } from '@/lib/jont-runtime/engines';
import { db } from '@/lib/db';
import { readJsonWithLimit } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB — mirrors max_upload_mb free tier

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // auth: session first, then PAT bearer (data plane may run tools)
  const session = await getSessionAuth(req);
  let userId: string;
  let tokenId: string | undefined;
  let source: string;

  if (session) {
    userId = session.userId;
    source = 'pwa';
  } else {
    const bearer = await authenticateBearer(req);
    if (!bearer) {
      return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in or send a PAT bearer');
    }
    if (bearer.kind !== 'pat') {
      // D-03 kind isolation: AATs never touch platform routes
      return fail(
        ERR.TOKEN_KIND_MISMATCH,
        'TOKEN_KIND_MISMATCH',
        'AATs drive agents over /api/mcp/* only — this route takes a browser session or a PAT',
      );
    }
    userId = bearer.userId;
    tokenId = bearer.tokenId;
    source = 'api_v1';
  }

  // Registry statuses sync BEFORE the preflight — a freshly deployed engine
  // whose row still says 'planned' must never false-503 (stale status is a
  // deploy race, not a tool property).
  try {
    await db.jont.updateMany({
      where: { id: { in: getBuiltJontIds() }, status: { not: 'built' } },
      data: { status: 'built' },
    });
  } catch {
    // non-fatal: preflight still reads the row as-is
  }

  // body: { arguments: {...} } — size-capped (2 MB) before parsing
  const parsed = await readJsonWithLimit(req, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return parsed.tooLarge
      ? fail(413, 'PAYLOAD_TOO_LARGE', `request body exceeds the ${MAX_BODY_BYTES / (1024 * 1024)} MB limit`)
      : fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body');
  }
  const body = parsed.body as { arguments?: Record<string, unknown> };
  const args = body.arguments ?? {};

  // Registry + argument preflight BEFORE quota — refusals (planned,
  // disabled, client-context, 422) must never consume a daily call
  // (honest metering: only executed tools cost a unit).
  const preflight = await preflightJont(id, args);
  if (preflight) {
    if (preflight.code === 'ARGUMENTS_INVALID') {
      return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', preflight.message, {
        fields: preflight.issues?.map((i) => `${i.field} ${i.message}`).join('; '),
      });
    }
    if (preflight.code === 'CLIENT_CONTEXT') return fail(400, 'CLIENT_CONTEXT', preflight.message);
    if (preflight.code === 'UNKNOWN_TOOL') return fail(ERR.UNKNOWN_TOOL, 'UNKNOWN_TOOL', preflight.message);
    if (preflight.code === 'NOT_FOUND') return fail(ERR.NOT_FOUND, 'NOT_FOUND', preflight.message);
    return fail(503, 'TOOL_UNAVAILABLE', preflight.message);
  }

  // concurrency slot BEFORE quota (VOL-11 §4(3) + honest metering): a 429
  // for a busy slot must never have consumed a unit. The slot is released in
  // every path below.
  const ent0 = await resolveEntitlement(userId);
  if (!tryAcquireSlot(userId, ent0.limits.concurrent_jobs)) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', `concurrent run limit reached (${ent0.limits.concurrent_jobs}) — retry after the current run finishes`);
  }

  try {
  // atomic quota consumption (VOL-05 §5) — the gate precedes every dispatch
  const gate = await checkAndIncrement(userId, 'srv');
  if (!gate.allowed) {
    return fail(ERR.QUOTA_EXCEEDED, 'QUOTA_EXCEEDED', 'daily server-call quota exhausted', {
      resets_at: gate.resets_at,
    });
  }

  const ent = await resolveEntitlement(userId);

  const outcome = await dispatchServerJont(id, args, {
    userId,
    concurrentJobs: ent.limits.concurrent_jobs,
    source,
    tokenId,
    slotHeld: true,
  });

  if (!outcome.ok) {
    // server-fault honesty: a crashed or timed-out engine refunds the unit —
    // the user did not get a result, so the call must not cost one.
    if (outcome.code === 'TOOL_FAILED' || (outcome.code === 'TOOL_UNAVAILABLE' && outcome.status === 503)) {
      await refundCounter(userId, 'srv').catch(() => undefined);
    }
    switch (outcome.code) {
      case 'CLIENT_CONTEXT':
        // honest refusal, named as such (T11.5)
        return fail(400, 'CLIENT_CONTEXT', outcome.message);
      case 'UNKNOWN_TOOL':
        return fail(ERR.UNKNOWN_TOOL, 'UNKNOWN_TOOL', outcome.message);
      case 'NOT_FOUND':
        return fail(ERR.NOT_FOUND, 'NOT_FOUND', outcome.message);
      case 'RATE_LIMITED':
        return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', outcome.message);
      case 'TOOL_UNAVAILABLE':
        return fail(503, 'TOOL_UNAVAILABLE', outcome.message);
      case 'ARGUMENTS_INVALID':
        return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', outcome.message, {
          field: outcome.issues?.map((i) => i.field).join(','),
        });
      default:
        return fail(500, 'TOOL_FAILED', outcome.message);
    }
  }

  return ok(
    {
      result: outcome.result,
      usage: {
        ms: outcome.ms,
        bytes_out: outcome.bytesOut,
        stored_ref: outcome.stored_ref,
        quota_remaining: { daily: gate.snapshot.remaining, resets_at: gate.snapshot.resets_at },
      },
    },
    {
      quota: {
        base: gate.snapshot.base,
        boost: gate.snapshot.boost,
        effective: gate.snapshot.effective,
        remaining: gate.snapshot.remaining,
        resets_at: gate.snapshot.resets_at,
      },
    },
  );
  } finally {
    releaseSlot(userId);
  }
}
