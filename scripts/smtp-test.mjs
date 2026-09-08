// Live SMTP diagnostic — reads .env, verifies the transport, sends one real
// mail to SMTP_USER. Prints verdicts, never the password.
import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')];
    }),
);

const host = env.SMTP_HOST;
const port = Number(env.SMTP_PORT ?? 587);
const secure = env.SMTP_SECURE === 'true' || port === 465;
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
const from = env.SMTP_FROM ?? `JONTRIX <${user}>`;

console.log(`config: host=${host} port=${port} secure=${secure} user=${user} from="${from}"`);

if (!host || !pass) {
  console.log('VERDICT: SMTP_HOST or SMTP_PASS missing in .env — mailer would run driver:"log"');
  process.exit(0);
}

const t = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

try {
  await t.verify();
  console.log('VERIFY: OK — server accepted auth and is ready to relay');
} catch (e) {
  console.log(`VERIFY: FAILED — ${e?.code ?? ''} ${e?.response ?? e?.message ?? e}`);
  process.exit(1);
}

try {
  const info = await t.sendMail({
    from,
    to: user,
    subject: 'JONTRIX SMTP diagnostic',
    text: 'If you can read this in your inbox, SMTP delivery works end to end.',
  });
  console.log(`SEND: OK — message id ${info.messageId}, accepted by ${JSON.stringify(info.accepted)}`);
  console.log('VERDICT: real delivery works — check the inbox of', user);
} catch (e) {
  console.log(`SEND: FAILED — ${e?.code ?? ''} ${e?.response ?? e?.message ?? e}`);
}
