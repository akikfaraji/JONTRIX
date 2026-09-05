// Server dispatch — VOL-11 §4 (LOCKED pipeline order):
// (1) manifest fetch → (2) argument validation (422) → (3) concurrency slot
// (429 on saturation) → (4) engine execution with hard 10 s timeout →
// (5) metering (jont_usage + counters in the dispatch decision transaction)
// → (6) result ≤ 64 KB inline, larger stored with a handle.
//
// Client-context Jonts are refused with an honest "runs in your browser"
// message (T11.5). The dispatcher never executes a planned/disabled Jont —
// status honesty beats a fake 200.

import { db } from '@/lib/db';
import type { JontResult } from './types';
import { validateAgainstSchema, type SchemaIssue } from './schema';
import { getServerEngine } from './engines';
import { stableStringify } from './util';

export const INLINE_LIMIT_BYTES = 64 * 1024; // VOL-11 §4(6)
const HARD_TIMEOUT_MS = 10_000; // VOL-11 §4(4)

export type DispatchFailure = {
  ok: false;
  code: string;
  status: number;
  message: string;
  issues?: SchemaIssue[];
};

export type DispatchResult =
  | { ok: true; result: JontResult; bytesOut: number; ms: number; stored_ref: string | null }
  | { ok: false; code: string; status: number; message: string; issues?: SchemaIssue[] };

// ── concurrency slots (VOL-11 §4(3); in-process adaptation, D-07 note) ─────
const activeSlots = new Map<string, number>();

export function tryAcquireSlot(userId: string, concurrentJobs: number): boolean {
  const current = activeSlots.get(userId) ?? 0;
  if (current >= Math.max(1, concurrentJobs)) return false;
  activeSlots.set(userId, current + 1);
  return true;
}

export function releaseSlot(userId: string): void {
  const current = activeSlots.get(userId) ?? 0;
  if (current <= 1) activeSlots.delete(userId);
  else activeSlots.set(userId, current - 1);
}

export function runWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`hard timeout ${ms} ms exceeded`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * Cheap pre-dispatch registry check (VOL-11 §4 step 1 + honesty rule):
 * refuses client-context, disabled, and planned Jonts, and validates the
 * arguments BEFORE the caller consumes any quota — a "not built" or 422
 * refusal must never cost a call. Returns null when dispatch may proceed.
 */
export async function preflightJont(jontId: string, args?: Record<string, unknown>): Promise<DispatchFailure | null> {
  const row = await db.jont.findUnique({ where: { id: jontId } });
  if (!row) {
    return { ok: false, code: 'UNKNOWN_TOOL', status: 404, message: `no Jont registered as ${jontId}` };
  }
  if (row.status === 'disabled') {
    return { ok: false, code: 'NOT_FOUND', status: 404, message: 'this Jont has been disabled by the publisher' };
  }
  if (row.context === 'client') {
    return {
      ok: false,
      code: 'CLIENT_CONTEXT',
      status: 400,
      message: 'this Jont runs in your browser — the server never executes it; open it in the app',
    };
  }
  if (row.status !== 'built' || !getServerEngine(jontId)) {
    return {
      ok: false,
      code: 'TOOL_UNAVAILABLE',
      status: 503,
      message: row.status === 'built'
        ? 'server engine not wired for this Jont yet'
        : 'this Jont is planned but not built yet — status is honest, not a stub',
    };
  }
  if (args !== undefined) {
    const engine = getServerEngine(jontId)!;
    const issues = validateAgainstSchema(args, engine.manifest.io.input);
    if (issues.length > 0) {
      return {
        ok: false,
        code: 'ARGUMENTS_INVALID',
        status: 422,
        message: 'arguments failed the manifest input schema',
        issues,
      };
    }
  }
  return null;
}

/**
 * Execute a server Jont. The caller has already authenticated the user and
 * consumed the daily server counter (VOL-05 §4/§5) — this function enforces
 * the manifest pipeline and writes the usage row. Metering note: the
 * counter increment happens in the caller's check-and-increment; the
 * jont_usage row lands here with the dispatch outcome, source-tagged.
 */
export async function dispatchServerJont(
  jontId: string,
  args: Record<string, unknown>,
  opts: { userId: string; concurrentJobs: number; source: string; tokenId?: string; slotHeld?: boolean },
): Promise<DispatchResult> {
  const engine = getServerEngine(jontId);

  // (1) registry row must exist
  const row = await db.jont.findUnique({ where: { id: jontId } });
  if (!row) {
    return { ok: false, code: 'UNKNOWN_TOOL', status: 404, message: `no Jont registered as ${jontId}` };
  }
  if (row.status === 'disabled') {
    return { ok: false, code: 'NOT_FOUND', status: 404, message: 'this Jont has been disabled by the publisher' };
  }

  if (!engine) {
    if (row.context === 'client') {
      // T11.5 — refuse by manifest, say so honestly
      return {
        ok: false,
        code: 'CLIENT_CONTEXT',
        status: 400,
        message: 'this Jont runs in your browser — the server never executes it; open it in the app',
      };
    }
    return {
      ok: false,
      code: 'TOOL_UNAVAILABLE',
      status: 503,
      message: row.status === 'built'
        ? 'server engine not wired for this Jont yet'
        : 'this Jont is planned but not built yet — status is honest, not a stub',
    };
  }

  // (2) argument validation against io.input
  const issues = validateAgainstSchema(args, engine.manifest.io.input);
  if (issues.length > 0) {
    return { ok: false, code: 'ARGUMENTS_INVALID', status: 422, message: 'arguments failed the manifest input schema', issues };
  }

  // (3) concurrency slot — the route may have already acquired one (slot-
  // before-quota ordering: a 429-for-slots must never have consumed a unit)
  const heldByRoute = opts.slotHeld === true;
  if (!heldByRoute && !tryAcquireSlot(opts.userId, opts.concurrentJobs)) {
    return {
      ok: false,
      code: 'RATE_LIMITED',
      status: 429,
      message: `concurrent run limit reached (${opts.concurrentJobs}) — retry after the current run finishes; queued jobs are not held`,
    };
  }

  try {
    // (4) execution with hard timeout
    const started = process.hrtime.bigint();
    let result: JontResult;
    try {
      result = await runWithTimeout(
        Promise.resolve(engine.run(args, {})),
        HARD_TIMEOUT_MS,
      );
    } catch (e) {
      const message = (e as Error).message ?? 'engine failure';
      await db.jontUsage.create({
        data: {
          userId: opts.userId,
          toolId: jontId,
          source: opts.source,
          tokenId: opts.tokenId ?? null,
          status: 'server_error',
        },
      });
      const isTimeout = message.includes('hard timeout');
      return {
        ok: false,
        code: isTimeout ? 'TOOL_UNAVAILABLE' : 'TOOL_FAILED',
        status: isTimeout ? 503 : 500,
        message: isTimeout ? `execution exceeded the ${HARD_TIMEOUT_MS / 1000}s budget — use the batch path for larger jobs` : 'engine execution failed',
      };
    }
    const ms = Number(process.hrtime.bigint() - started) / 1_000_000;
    result.ms = Math.round(ms);

    // (5) metering — usage row with attribution
    const bytesIn = Buffer.byteLength(stableStringify(args), 'utf8');
    const bytesOut = Buffer.byteLength(stableStringify(result.data), 'utf8');
    await db.jontUsage.create({
      data: {
        userId: opts.userId,
        toolId: jontId,
        source: opts.source,
        tokenId: opts.tokenId ?? null,
        ms: result.ms,
        bytesIn,
        bytesOut,
        status: 'ok',
      },
    });

    // (6) inline vs stored handle
    let stored_ref: string | null = null;
    if (bytesOut > INLINE_LIMIT_BYTES) {
      const { createHash } = await import('node:crypto');
      const bodyText = stableStringify(result.data);
      const row2 = await db.result.create({
        data: {
          userId: opts.userId,
          toolId: jontId,
          bodyText,
          bodySha256: createHash('sha256').update(bodyText).digest('hex'),
          bytes: Buffer.byteLength(bodyText, 'utf8'),
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        },
      });
      stored_ref = row2.id;
      result.data = { handle: row2.id, bytes: bytesOut, note: 'result exceeds 64 KB inline limit — stored with a handle' };
    }

    return { ok: true, result, bytesOut, ms: result.ms, stored_ref };
  } finally {
    if (!heldByRoute) releaseSlot(opts.userId); // route-held slots are released by the route
  }
}
