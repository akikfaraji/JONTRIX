// Runtime bootstrap guard — the database must never serve a broken platform.
// If plans or jonts are missing (fresh volume, wiped file, failed migration),
// the seed re-runs idempotently at server start (upsert-only, never
// duplicates — prisma/seed.ts contract). Runs once per process via the
// Next.js instrumentation hook.
//
// Fresh-clone case: the SQLite file exists (src/lib/db.ts creates its
// directory and the engine creates the file) but has NO TABLES — count
// queries throw. In that state `prisma db push` is executed once (it is
// declarative and idempotent) before seeding.

import { execSync } from 'child_process';

async function pushSchema(): Promise<boolean> {
  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: process.cwd(),
      stdio: 'pipe',
      timeout: 60_000,
      env: { ...process.env },
    });
    return true;
  } catch (err) {
    console.error('[bootstrap] prisma db push failed:', err instanceof Error ? `${err.message}`.slice(0, 300) : String(err).slice(0, 300));
    return false;
  }
}

export async function bootstrapDatabase(): Promise<{ seeded: boolean; jonts: number; plans: number }> {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  try {
    let jonts = -1;
    let plans = -1;
    try {
      [jonts, plans] = await Promise.all([db.jont.count(), db.plan.count()]);
    } catch (err) {
      // Tables missing (fresh clone / wiped file) — build the schema first.
      console.warn(
        '[bootstrap] schema queries failed — running prisma db push:',
        err instanceof Error ? `${err.message}`.slice(0, 200) : String(err).slice(0, 200),
      );
      if (!(await pushSchema())) {
        throw err;
      }
      [jonts, plans] = await Promise.all([db.jont.count(), db.plan.count()]);
    }

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
