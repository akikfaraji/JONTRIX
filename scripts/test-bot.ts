// VOL-08 tests — bot command semantics (§1) + boost ceremony (§5):
// T8.3 boost cap (2 grants, third refused), replay refusal (T8.4 analog),
// help honesty (T8.7), dual-price display (§3), quota honesty (§6).

import { handleUpdate, type TgUpdate } from '../src/lib/bot/commands';
import { createHmac } from 'node:crypto';

function msg(text: string, id = 777000): TgUpdate {
  return {
    update_id: Math.floor(Math.random() * 1e9),
    message: {
      message_id: Math.floor(Math.random() * 1e6),
      chat: { id: id },
      from: { id, username: 'tester', first_name: 'Tester' },
      text,
    },
  };
}

async function main() {
  let failures = 0;
  const check = (name: string, cond: boolean) => {
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
    if (!cond) failures++;
  };

  // T8.7 unknown text → one-line help, no menu loops
  const unknown = await handleUpdate(msg('hello bot'));
  check('T8.7 unknown → one-line honest help', (unknown?.text ?? '').includes('/help'));

  // /start → 3-line pitch + Mini App button
  const start = await handleUpdate(msg('/start'));
  check('T8.1 /start → pitch + Mini App button', (start?.text ?? '').split('\n').length >= 3 && JSON.stringify(start?.inline_keyboard ?? []).includes('web_app'));

  // /catalog → 5 family buttons
  const catalog = await handleUpdate(msg('/catalog'));
  check('§1 /catalog → 5 family inline buttons', catalog?.inline_keyboard?.length === 5);

  // family callback → built tools listed
  const fam = await handleUpdate({ update_id: 2, callback_query: { id: 'cb1', from: { id: 777000 }, data: 'family:converter' } });
  check('§1 family callback → built tool list', (fam?.text ?? '').includes('built tools'));

  // /jont known + unknown
  const jont = await handleUpdate(msg('/jont json-repair'));
  check('§1 /jont slug → card with honest status', (jont?.text ?? '').includes('status:'));
  const jontNone = await handleUpdate(msg('/jont nope-nope'));
  check('§1 /jont unknown → honest miss', (jontNone?.text ?? '').includes('No tool matches'));

  // /me → tier + consent state
  const me = await handleUpdate(msg('/me'));
  check('§6 /me → tier + consent state', (me?.text ?? '').includes('tier:') && (me?.text ?? '').includes('consent'));

  // /quota → reset times
  const quota = await handleUpdate(msg('/quota'));
  check('§1 /quota → reset times', (quota?.text ?? '').includes('resets'));

  // /buy → dual price line (C8)
  const buy = await handleUpdate(msg('/buy'));
  check('§3 /buy → dual price', (buy?.text ?? '').includes('Stars') || JSON.stringify(buy?.inline_keyboard ?? []).includes('Stars'));

  // /mcp → 3-step onboarding, no remote path mention (§9)
  const mcp = await handleUpdate(msg('/mcp'));
  check('§9 /mcp → 3 steps, PAT line', (mcp?.text ?? '').includes('npm i -g jontrix-gateway') && (mcp?.text ?? '').includes('PAT'));

  // ── boost ceremony (§5) — direct DB + endpoint semantics ──
  const { db } = await import('../src/lib/db');
  // The claim requests below run under the tester's EMAIL session (the
  // Mini App session path, §5) — assertions key off that user.
  const emailUser = await db.user.findUnique({ where: { email: 'tester@jontrix.test' } });
  const user = emailUser;
  if (!user) throw new Error('tester email user missing — sign-in should have provisioned it');
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  await db.boostLedger.deleteMany({ where: { userId: user.id, utcDay: day } });

  const key = process.env.ADSGRAM_VERIFY_KEY ?? 'test-key';
  const claimBody = (n: number) => ({
    ad_session_id: `adsess-${day}-${n}-${Date.now()}`, // unique per run — real ad sessions never repeat
    signature: '',
  });
  const sign = (id: string) => createHmac('sha256', key).update(id).digest('hex');

  // Mini App session identity (§5: "Mini App session or anonymous identity")
  // — the test signs in so grants land on the tester user, matching cleanup.
  const jar: string[] = [];
  const signin = async () => {
    await fetch('http://localhost:3000/api/auth/otp/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'tester@jontrix.test' }),
    });
    const { execSync } = await import('node:child_process');
    const code = execSync('tail -c 3000 dev.log | strings | grep -oE "OTP for tester@jontrix.test: [0-9]{6}" | tail -1 | grep -oE "[0-9]{6}$"').toString().trim();
    const res = await fetch('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'tester@jontrix.test', code }),
    });
    const setCookies =
      res.headers.getSetCookie?.() ??
      (res.headers.get('set-cookie') ?? '').split(/,(?=[^;]+?=)/).filter(Boolean);
    for (const c of setCookies) jar.push(c.split(';')[0]);
    if (jar.length === 0) throw new Error('no session cookie set — sign-in failed');
  };

  const port = process.env.PORT ?? 3000;
  const claim = async (n: number) => {
    const body = claimBody(n);
    body.signature = sign(body.ad_session_id);
    const res = await fetch(`http://localhost:${port}/api/boost/claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(jar.length ? { cookie: jar.join('; ') } : {}) },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };
  await signin();

  if (process.env.ADSGRAM_VERIFY_KEY) {
    const r1 = await claim(1);
    check('T8.3 grant 1 → 200 (+10)', r1.status === 200 && r1.body.data?.granted === 10);
    const r2 = await claim(2);
    check('T8.3 grant 2 → 200 (+10, cap reached)', r2.status === 200);
    const r3 = await claim(3);
    check('T8.3 third → 429 boost_cap honest copy', r3.status === 429 && r3.body.error?.code === 'boost_cap');
    const ledger = await db.boostLedger.findMany({ where: { userId: user.id, utcDay: day } });
    check('T8.3 ledger shows exactly 2 rows', ledger.length === 2);
    const replayId = ledger[0]?.adSessionId ?? '';
    const replay = await fetch(`http://localhost:${port}/api/boost/claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: jar.join('; ') },
      body: JSON.stringify({ ad_session_id: replayId, signature: sign(replayId) }),
    });
    check('T8.4 replayed callback refused', replay.status === 409 || replay.status === 429);
  } else {
    const r = await claim(1);
    check('§5 no verify key → 503 honest refusal (nothing granted)', r.status === 503);
    const ledger = await db.boostLedger.findMany({ where: { userId: user.id, utcDay: day } });
    check('§5 ledger empty without verified callback', ledger.length === 0);
  }

  await db.$disconnect();
  console.log('───');
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
