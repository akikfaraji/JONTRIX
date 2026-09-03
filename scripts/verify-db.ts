// VOL-00 Phase-1 exit condition + VOL-04 §7: verify the database matches the
// schema contract. Asserts every table exists, the 4 plan rows match the
// VOL-01 §4.1 contract byte-for-byte, 247 jonts rows load, meta.version equals
// the single source (src/version.ts), and no view/trigger exists that would
// tax per-request reads.
// Run: npm run db:verify   (exit 0 = green)

import { PrismaClient } from '@prisma/client';
import { PLANS_SEED } from '../src/lib/plans';
import { VERSION } from '../src/version';

const db = new PrismaClient();

// VOL-04 §2 table map — every table the schema contract requires.
const REQUIRED_TABLES = [
  'User', 'AuthIdentity', 'Session', 'Token',
  'Plan', 'Entitlement', 'WebhookEvent', 'Payment', 'Invoice',
  'Jont', 'JontUsage', 'Preset', 'Result',
  'McpDeviceCode', 'McpUsageDaily', 'McpIdempotency',
  'BoostLedger', 'ConsentEvent', 'AuditLog', 'Meta',
] as const;

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  console.log(`db:verify against version ${VERSION}`);

  // 1. Every required table exists (SQLite shadow check via sqlite_master).
  const tables = await db.$queryRaw<{ name: string }[]>`
    SELECT name FROM sqlite_master WHERE type = 'table'`;
  const present = new Set(tables.map((t) => t.name));
  for (const t of REQUIRED_TABLES) {
    check(`table ${t}`, present.has(t));
  }

  // 2. No views or triggers (VOL-04 §7 — nothing that taxes every request).
  const extras = await db.$queryRaw<{ name: string }[]>`
    SELECT name FROM sqlite_master WHERE type IN ('view','trigger')`;
  check('no views/triggers', extras.length === 0, `found ${extras.length}`);

  // 3. Four plan rows, byte-for-byte against the VOL-01 §4.1 seed contract.
  const plans = await db.plan.findMany();
  check('plans row count = 4', plans.length === 4, `got ${plans.length}`);
  for (const p of PLANS_SEED) {
    const row = plans.find((r) => r.tier === p.tier);
    check(
      `plan ${p.tier} matches contract`,
      !!row &&
        row.priceUsdCents === p.price_usd_cents &&
        row.priceUsdAnnualCents === p.price_usd_annual_cents &&
        row.priceStars === p.price_stars &&
        row.limitsJson === JSON.stringify(p.limits),
    );
  }

  // 4. 247 jonts rows, and the tier-fit census 155/79/13 (VOL-13 T13.6 / G-03).
  const jontCount = await db.jont.count();
  check('jonts row count = 247', jontCount === 247, `got ${jontCount}`);
  const freeFit = await db.jont.count({ where: { tierFit: 'FREE' } });
  const proFit = await db.jont.count({ where: { tierFit: 'PRO' } });
  const maxFit = await db.jont.count({ where: { tierFit: 'MAX' } });
  check('tier census 155/79/13', freeFit === 155 && proFit === 79 && maxFit === 13,
    `got ${freeFit}/${proFit}/${maxFit}`);
  check('all jonts version-stamped from src/version.ts',
    (await db.jont.count({ where: { version: VERSION } })) === jontCount);

  // 5. meta.version equals the single authoritative source.
  const meta = await db.meta.findUnique({ where: { key: 'version' } });
  check('meta.version == VERSION', meta?.value === VERSION,
    `db="${meta?.value}" src="${VERSION}"`);

  // 6. No seed drift on scores: every row is within [0, 10].
  const badScores = await db.jont.count({ where: { OR: [{ score: { lt: 0 } }, { score: { gt: 10 } }] } });
  check('jont scores within [0,10]', badScores === 0, `${badScores} out of range`);

  console.log(failures === 0 ? 'db:verify — ALL GREEN' : `db:verify — ${failures} FAILURE(S)`);
  if (failures > 0) process.exit(1);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
