// UTC window helpers — VOL-01 §4.3 quota semantics (LOCKED).
// All quota windows are UTC; daily counters reset at 00:00 UTC; monthly on
// the 1st at 00:00 UTC. Fixed resets, no rolling windows (C8: explainable).

export function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
}

export function utcMonth(d = new Date()): string {
  return d.toISOString().slice(0, 7).replace(/-/g, ''); // YYYYMM
}

/** Next 00:00 UTC after `d` — the reset instant for daily counters. */
export function nextUtcMidnight(d = new Date()): Date {
  const next = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0),
  );
  return next;
}

/** First day of the next UTC month, 00:00 — reset instant for monthly counters. */
export function nextUtcMonthStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

/** ISO string of the reset instant for a daily-keyed counter. */
export function dailyResetsAt(d = new Date()): string {
  return nextUtcMidnight(d).toISOString();
}

/** ISO string of the reset instant for a monthly-keyed counter. */
export function monthlyResetsAt(d = new Date()): string {
  return nextUtcMonthStart(d).toISOString();
}
