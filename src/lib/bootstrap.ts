// Runtime bootstrap guard — the database must never serve a broken platform.
// If plans or jonts are missing (fresh volume, wiped file, failed migration),
// the seed re-runs idempotently at server start (upsert-only, never
// duplicates — prisma/seed.ts contract). Runs once per process via the
// Next.js instrumentation hook.

export async function bootstrapDatabase(): Promise<{ seeded: boolean; jonts: number; plans: number }> {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  try {
    const [jonts, plans] = await Promise.all([db.jont.count(), db.plan.count()]);
    if (jonts > 0 && plans > 0) return { seeded: false, jonts, plans };

    console.warn(`[bootstrap] database incomplete (jonts=${jonts}, plans=${plans}) — running idempotent seed`);
    const { runSeed } = await import('../../prisma/seed');
    await runSeed();
    const [j2, p2] = await Promise.all([db.jont.count(), db.plan.count()]);
    console.log(`[bootstrap] seed complete (jonts=${j2}, plans=${p2})`);
    return { seeded: true, jonts: j2, plans: p2 };
  } finally {
    await db.$disconnect().catch(() => undefined);
  }
}
