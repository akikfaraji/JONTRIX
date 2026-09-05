// POST /api/boost/claim — the ONLY ad integration in the product (VOL-08 §5,
// D-02 LOCKED). Grant lands only after a verified AdsGram reward callback —
// never on ad start, never on a client-side claim of completion. Day cap 2
// grants (+10 each) on boost_ledger; a third attempt same-day returns
// 429 boost_cap with honest copy. One grant per ad session id — a replayed
// callback is refused by the unique ad_session_id in the ledger.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { getSessionAuth } from '@/lib/auth';
import { ok, fail, ERR } from '@/lib/envelope';
import { resolveEntitlement, quotaSnapshot } from '@/lib/entitlements';
import { utcDay, dailyResetsAt } from '@/lib/utc';

export const dynamic = 'force-dynamic';

const BOOST_AMOUNT = 10; // 1 ad = +10 calls today
const BOOST_DAILY_GRANTS = 2; // hard cap: +20 max

function anonIdentity(req: Request): string {
  // Salted IP+UA identity (VOL-01 §4.3) — farm rotation cannot stack.
  const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
  const ua = req.headers.get('user-agent') ?? 'unknown';
  const salt = process.env.BOOST_SALT ?? 'jontrix-boost-salt';
  return `anon_${Math.abs(
    [...`${salt}:${ip}:${ua}`].reduce((h: number, c) => (h * 33 + c.charCodeAt(0)) | 0, 5381),
  ).toString(36)}`;
}

export async function POST(req: Request) {
  // AdsGram server-side verification key — absent means honest refusal.
  const verifyKey = process.env.ADSGRAM_VERIFY_KEY;

  let body: { ad_session_id?: string; signature?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body');
  }
  const adSessionId = (body.ad_session_id ?? '').trim();
  const signature = (body.signature ?? '').trim();
  if (!adSessionId || !signature) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'ad_session_id and signature are required', {
      field: 'ad_session_id',
    });
  }

  // ── signature verification (grant only after a verified callback, §5) ──
  if (!verifyKey) {
    return fail(503, 'TOOL_UNAVAILABLE', 'reward verification is not configured in this environment — no grant can land');
  }
  const expected = createHmac('sha256', verifyKey).update(adSessionId).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return fail(403, 'FORBIDDEN_TOOL', 'reward callback verification failed — the grant is refused');
  }

  // ── identity: Mini App session, else anonymous salted identity ──
  const session = await getSessionAuth(req);
  const userId = session?.userId ?? anonIdentity(req);

  // ── day cap on boost_ledger (max 2 grants per UTC day, §5) ──
  const day = utcDay();
  const grants = await db.boostLedger.findMany({
    where: { userId, utcDay: day },
    select: { amount: true },
  });

  if (grants.length >= BOOST_DAILY_GRANTS) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'boost_cap',
          message: "that's today's max — resets 00:00 UTC",
          resets_at: dailyResetsAt(),
        },
      },
      { status: 429 },
    );
  }

  // ── one grant per ad session id — replay refused (§5 fraud rules) ──
  const replayed = await db.boostLedger.findFirst({
    where: { adSessionId },
    select: { id: true },
  });
  if (replayed) {
    return fail(409, 'CONFLICT_IDEMPOTENCY', 'this ad session already granted its reward');
  }

  // ── atomic day cap: the ledger row's id is deterministic
  // (user|day|slot) — the PK constraint makes the cap race-free. Two
  // parallel claims with one slot left cannot both insert; the loser
  // catches P2002 and reports the cap honestly. ──
  const slot = grants.length; // 0-based next slot; >= cap was refused above
  try {
    await db.boostLedger.create({
      data: {
        id: `bst_${userId}_${day}_${slot}`,
        userId,
        adSessionId,
        amount: BOOST_AMOUNT,
        utcDay: day,
      },
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'boost_cap',
          message: "that's today's max — resets 00:00 UTC",
          resets_at: dailyResetsAt(),
        },
      },
      { status: 429 },
    );
  }

  const ent = await resolveEntitlement(userId);
  const boost = await quotaSnapshot(ent, 'srv');

  return ok({
    granted: BOOST_AMOUNT,
    quota: {
      base: boost.base,
      boost: boost.boost,
      effective: boost.effective,
      remaining: Math.max(0, boost.remaining),
      resets_at: boost.resets_at,
    },
  });
}
