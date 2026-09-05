// Entitlements middleware — VOL-05 §5 + VOL-01 §4 (LOCKED).
// One authority: the entitlements row (this module is its only writer of
// counters). Check-and-increment is a single transaction so two parallel
// calls can never both consume the last remaining unit. Quota windows are
// UTC-fixed (VOL-01 §4.3): counters carry their window in the key
// (srv_YYYYMMDD, mcp_YYYYMM, ai_YYYYMM, pat_YYYYMMDD), so UTC reset is a new
// key — never a mutation scan (VOL-04 §4 MUST).
//
// Ad-boost (D-02): Free-tier only; boost rows live in boost_ledger; the
// effective daily cap = base + min(boost sum, ad_boost_daily_calls_max).
// The quota block always reports base / boost / effective separately (C8).

import { db } from '@/lib/db';
import type { Limits } from '@/lib/plans';
import { utcDay, utcMonth, dailyResetsAt, monthlyResetsAt } from '@/lib/utc';

export type CounterKind = 'srv' | 'mcp' | 'ai' | 'pat';

export interface ResolvedEntitlement {
  userId: string;
  tier: string;
  source: string | null;
  windowStarts: Date | null;
  windowExpires: Date | null;
  limits: Limits;
  counters: Record<string, number>;
  version: number;
}

const DEFAULT_LIMITS: Limits = {
  jonts_unlocked: 'FREE',
  server_calls_per_day: 25,
  max_upload_mb: 2,
  batch_rows_max: 100,
  concurrent_jobs: 1,
  mcp_calls_per_month: 40,
  mcp_aats_max: 1,
  mcp_pats_max: 1,
  ad_boost_daily_calls_max: 20,
  ai_fallback_calls_per_month: 0,
  history_days: 0,
  presets_max: 3,
  seats: 1,
};

/**
 * Resolve the live entitlement for a user (VOL-01 §4.1 projection).
 * Creates the free-default row on first touch. Plan rows are the limits
 * authority — never hard-coded strings (VOL-01 §5.6).
 */
export async function resolveEntitlement(userId: string): Promise<ResolvedEntitlement> {
  let row = await db.entitlement.findUnique({ where: { userId } });
  if (!row) {
    row = await db.entitlement.create({ data: { userId, tier: 'free' } });
  }

  const plan = await db.plan.findUnique({ where: { tier: row.tier } });
  let limits = DEFAULT_LIMITS;
  if (plan) {
    try {
      limits = JSON.parse(plan.limitsJson) as Limits;
    } catch {
      // fall through to defaults — honest refusal beats invented limits
    }
  }

  let counters: Record<string, number> = {};
  try {
    counters = JSON.parse(row.countersJson) as Record<string, number>;
  } catch {
    counters = {};
  }

  return {
    userId,
    tier: row.tier,
    source: row.source,
    windowStarts: row.windowStarts,
    windowExpires: row.windowExpires,
    limits,
    counters,
    version: row.version,
  };
}

/** Boost total granted to this user for the current UTC day (D-02). */
async function boostForToday(userId: string): Promise<number> {
  const rows = await db.boostLedger.findMany({
    where: { userId, utcDay: utcDay() },
    select: { amount: true },
  });
  return rows.reduce((sum, r) => sum + r.amount, 0);
}

export interface QuotaSnapshot {
  base: number;
  boost: number;
  effective: number;
  remaining: number;
  used: number;
  resets_at: string;
  warnings: string[];
}

/** Compute the honest quota snapshot for a counter kind (VOL-05 §2 quota block). */
export async function quotaSnapshot(
  ent: ResolvedEntitlement,
  kind: CounterKind,
): Promise<QuotaSnapshot> {
  const now = new Date();
  const monthly = kind === 'mcp' || kind === 'ai';
  const key = counterKey(kind, monthly);
  const used = ent.counters[key] ?? 0;

  let base: number;
  if (kind === 'srv') base = ent.limits.server_calls_per_day;
  else if (kind === 'mcp') base = ent.limits.mcp_calls_per_month;
  else if (kind === 'ai') base = ent.limits.ai_fallback_calls_per_month;
  else base = 2000; // PAT daily write ceiling — VOL-05 §3.2

  let boost = 0;
  if (kind === 'srv') {
    boost = Math.min(await boostForToday(ent.userId), ent.limits.ad_boost_daily_calls_max);
  }

  const effective = base + boost;
  const remaining = Math.max(0, effective - used);
  const warnings: string[] = [];
  if (effective > 0 && used >= Math.ceil(effective * 0.8) && remaining > 0) {
    warnings.push('quota_80'); // one honest prompt at 80% — VOL-01 §3.4
  }

  return {
    base,
    boost,
    effective,
    remaining,
    used,
    resets_at: monthly ? monthlyResetsAt(now) : dailyResetsAt(now),
    warnings,
  };
}

function counterKey(kind: CounterKind, monthly: boolean): string {
  return monthly ? `${kind}_${utcMonth()}` : `${kind}_${utcDay()}`;
}

export type CheckResult =
  | { allowed: true; snapshot: QuotaSnapshot }
  | { allowed: false; resets_at: string; snapshot: QuotaSnapshot };

/**
 * The atomic check-and-increment (VOL-01 §4.1 MUST). Read, compare, and
 * write happen in one serialized transaction — the last unit can only be
 * consumed once. 80% stamps `quota_80` on the result; 100% refuses with the
 * reset instant (402 QUOTA_EXCEEDED at the route layer, never 403).
 */
export async function checkAndIncrement(
  userId: string,
  kind: CounterKind,
): Promise<CheckResult> {
  const result = await db.$transaction(
    async (tx) => {
      const row = await tx.entitlement.findUnique({ where: { userId } });
      if (!row) return null;
      const counters = JSON.parse(row.countersJson || '{}') as Record<string, number>;

      const ent: ResolvedEntitlement = {
        userId,
        tier: row.tier,
        source: row.source,
        windowStarts: row.windowStarts,
        windowExpires: row.windowExpires,
        limits: DEFAULT_LIMITS,
        counters,
        version: row.version,
      };
      const plan = await tx.plan.findUnique({ where: { tier: row.tier } });
      if (plan) {
        try {
          ent.limits = JSON.parse(plan.limitsJson) as Limits;
        } catch {
          /* defaults hold */
        }
      }

      const monthly = kind === 'mcp' || kind === 'ai';
      const key = counterKey(kind, monthly);
      const used = counters[key] ?? 0;

      let base: number;
      if (kind === 'srv') base = ent.limits.server_calls_per_day;
      else if (kind === 'mcp') base = ent.limits.mcp_calls_per_month;
      else if (kind === 'ai') base = ent.limits.ai_fallback_calls_per_month;
      else base = 2000; // PAT daily ceiling

      let boost = 0;
      if (kind === 'srv') {
        const boosts = await tx.boostLedger.findMany({
          where: { userId, utcDay: utcDay() },
          select: { amount: true },
        });
        boost = Math.min(
          boosts.reduce((s, r) => s + r.amount, 0),
          ent.limits.ad_boost_daily_calls_max,
        );
      }

      const effective = base + boost;
      const warnings: string[] = [];
      if (effective > 0 && used >= Math.ceil(effective * 0.8) && used < effective) {
        warnings.push('quota_80');
      }

      if (used >= effective) {
        return {
          allowed: false as const,
          resets_at: monthly ? monthlyResetsAt() : dailyResetsAt(),
          snapshot: {
            base,
            boost,
            effective,
            remaining: 0,
            used,
            resets_at: monthly ? monthlyResetsAt() : dailyResetsAt(),
            warnings,
          },
        };
      }

      counters[key] = used + 1;
      await tx.entitlement.update({
        where: { userId },
        data: { countersJson: JSON.stringify(counters) },
      });

      return {
        allowed: true as const,
        snapshot: {
          base,
          boost,
          effective,
          remaining: Math.max(0, effective - counters[key]),
          used: counters[key],
          resets_at: monthly ? monthlyResetsAt() : dailyResetsAt(),
          warnings,
        },
      };
    },
    { timeout: 5_000 },
  );

  if (result === null) {
    // No entitlement row exists yet — create the free default and re-check.
    await db.entitlement.create({ data: { userId, tier: 'free' } });
    return checkAndIncrement(userId, kind);
  }
  return result;
}

/**
 * Refund one unit of a counter window (server-fault honesty): when an engine
 * crashes or times out after the quota was consumed, the user did not get a
 * result and the call must not cost one. Never drops below zero and only
 * touches the CURRENT window key — stale-window refunds are no-ops.
 */
export async function refundCounter(userId: string, kind: CounterKind): Promise<void> {
  await db.$transaction(async (tx) => {
    const row = await tx.entitlement.findUnique({ where: { userId } });
    if (!row) return;
    const counters = JSON.parse(row.countersJson || '{}') as Record<string, number>;
    const monthly = kind === 'mcp' || kind === 'ai';
    const key = counterKey(kind, monthly);
    const used = counters[key] ?? 0;
    if (used <= 0) return;
    counters[key] = used - 1;
    await tx.entitlement.update({
      where: { userId },
      data: { countersJson: JSON.stringify(counters) },
    });
  });
}

/** Tier-fit gate — VOL-01 §4.2 mapping rule (mechanical, no judgment). */
export function tierUnlocks(tier: string, tierFit: 'FREE' | 'PRO' | 'MAX'): boolean {
  if (tierFit === 'FREE') return true;
  if (tierFit === 'PRO') return tier === 'pro' || tier === 'studio' || tier === 'max';
  return tier === 'max'; // MAX-fit: Max only (Studio buys capacity, not Jonts)
}
