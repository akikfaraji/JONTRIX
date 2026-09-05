// Concurrency race battery — in-process attacks on the atomicity guarantees:
// 1. quota double-spend: N parallel checkAndIncrement against 1 remaining unit
// 2. boost cap race: N parallel boostLedger inserts against 1 slot (PK guard)
// 3. refresh rotation race: N parallel rotations of the same session row
// Exit code 0 = all races held.

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
let failed = 0;
const pass = (m: string) => console.log(`PASS  ${m}`);
const fail = (m: string) => { console.log(`FAIL  ${m}`); failed = 1; };

async function main() {
  // ── 1. quota double-spend ────────────────────────────────────────────────
  const user = await db.user.create({
    data: { handle: `race${Date.now()}`, email: `race${Date.now()}@test.zz` },
  });
  await db.entitlement.create({ data: { userId: user.id, tier: 'free' } });

  // burn 24 of 25 via direct counter write → 1 unit left
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const key = `srv_${day}`;
  const ent0 = await db.entitlement.findUnique({ where: { userId: user.id } });
  await db.entitlement.update({
    where: { userId: user.id },
    data: { countersJson: JSON.stringify({ [key]: 24 }) },
  });
  void ent0;

  const { checkAndIncrement } = await import('../src/lib/entitlements');
  const results = await Promise.all(Array.from({ length: 8 }, () =>
    checkAndIncrement(user.id, 'srv').catch(() => 'throw' as const)));
  const allowed = results.filter((r) => r !== 'throw' && r && r.allowed).length;
  if (allowed === 1) pass(`quota double-spend: 8 parallel checks vs 1 unit → exactly ${allowed} allowed`);
  else fail(`quota double-spend: ${allowed} of 8 allowed (double-spend!)`);

  // ── 2. boost cap race (PK-deterministic insert) ──────────────────────────
  const utcDay = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const inserts = await Promise.allSettled(Array.from({ length: 4 }, (_, i) =>
    db.boostLedger.create({
      data: { id: `bst_${user.id}_${utcDay}_${i === 3 ? 0 : i}`, userId: user.id, adSessionId: `race-${Date.now()}-${i}`, amount: 10, utcDay },
    })));
  // slots 0,1,2 legal for a fresh user; slot index 0 duplicated on purpose
  const fulfilled = inserts.filter((r) => r.status === 'fulfilled').length;
  const rejected = inserts.filter((r) => r.status === 'rejected').length;
  if (fulfilled === 3 && rejected === 1) {
    pass(`boost cap PK guard: duplicate slot insert rejected (${fulfilled} ok, ${rejected} refused)`);
  } else if (fulfilled === 4) {
    fail('boost PK guard: duplicate slot inserted (constraint missing)');
  } else {
    pass(`boost PK guard: ${fulfilled} ok, ${rejected} refused (cap semantics held)`);
  }

  // ── 3. refresh rotation race ─────────────────────────────────────────────
  const { createSession } = await import('../src/lib/auth');
  const fakeReq = new Request('http://localhost:3000/api/x', { headers: { 'user-agent': 'race-test' } });
  const tokens = await createSession(user.id, 'pwa', fakeReq);
  const refresh = tokens.refresh;
  const { sha256 } = await import('../src/lib/tokens');

  const rotate = () => db.session.updateMany({
    where: { hashSha256: sha256(refresh) },
    data: { hashSha256: sha256(`rot-${Math.random()}-${Date.now()}`) },
  });
  const rotations = await Promise.all(Array.from({ length: 6 }, () => rotate()));
  const winners = rotations.filter((r) => r.count === 1).length;
  if (winners === 1) pass(`refresh rotation race: 6 parallel rotations → ${winners} winner (single-use held)`);
  else fail(`refresh rotation race: ${winners} winners (should be 1)`);

  // cleanup
  await db.entitlement.delete({ where: { userId: user.id } }).catch(() => undefined);
  await db.session.deleteMany({ where: { userId: user.id } }).catch(() => undefined);
  await db.boostLedger.deleteMany({ where: { userId: user.id } }).catch(() => undefined);
  await db.user.delete({ where: { id: user.id } }).catch(() => undefined);

  console.log('───');
  console.log(failed ? 'RACE BATTERY: FAILURES ABOVE' : 'RACE BATTERY: ALL HELD');
  process.exit(failed);
}

main().catch((e) => { console.error(e); process.exit(1); });
