// POST /api/auth/account/delete — self-serve account deletion.
//
// Identity proof (an open laptop must not be enough):
//   - account with a password  → current_password required and verified
//   - OTP/OAuth-only account   → confirm:"DELETE" typed confirmation
//
// What happens to the data (GDPR-flavoured, honest):
//   - email, display name, telegram id, settings → removed/anonymized
//   - credential + auth identities rows          → deleted
//   - every session (all devices)                → revoked
//   - every PAT/AAT token                        → revoked
//   - one-time auth tokens                       → purged
//   - usage/audit ledger rows                    → KEPT (append-only integrity,
//     VOL-04 §1.4) — they reference the user id, never the email; usage
//     totals are aggregate numbers without identity content.
// The user row survives as status:'deleted' with a scrambled handle so the
// ledger's foreign keys keep resolving. A farewell/security email goes out
// before anonymization (best-effort — deletion never depends on delivery).

import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { ok, fail, ERR } from '@/lib/envelope';
import { burstCheck } from '@/lib/burst';
import { readJsonWithLimit } from '@/lib/validate';
import { verifyPassword, equalizeTiming } from '@/lib/password';
import { getSessionAuth, revokeAllSessions, clearSessionCookie } from '@/lib/auth';
import { accountDeletedEmail, sendMail } from '@/lib/mailer';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  const burst = burstCheck(`acctdel:${auth.userId}`);
  if (!burst.ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'too many attempts');
  }

  const parsed = await readJsonWithLimit(req, 4 * 1024);
  if (!parsed.ok) {
    return parsed.tooLarge
      ? fail(413, 'PAYLOAD_TOO_LARGE', 'request body too large')
      : fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body; fields: password, confirm');
  }
  const body = parsed.body as { password?: unknown; confirm?: unknown };

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    include: { credential: true },
  });
  if (!user || user.status !== 'active') {
    return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'account unavailable');
  }

  if (user.credential) {
    if (typeof body.password !== 'string') {
      return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'your password is required to delete the account', {
        field: 'password',
      });
    }
    const valid = await verifyPassword(body.password, user.credential.passwordHash);
    if (!valid) return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'wrong password');
  } else {
    // no password on file — require the typed confirmation instead
    if (body.confirm !== 'DELETE') {
      return fail(
        ERR.ARGUMENTS_INVALID,
        'ARGUMENTS_INVALID',
        'type DELETE in the confirmation box to delete this account',
        { field: 'confirm' },
      );
    }
    await equalizeTiming(typeof body.password === 'string' ? body.password : '');
  }

  // farewell note while the address still exists (best-effort)
  if (user.email) {
    await sendMail({ to: user.email, ...accountDeletedEmail() }).catch(() => undefined);
  }

  // 1) every token dies — PAT/AAT first so API access stops immediately
  await db.token.updateMany({
    where: { userId: user.id, status: 'active' },
    data: { status: 'revoked', revokedAt: new Date() },
  });

  // 2) every session on every device
  await revokeAllSessions(user.id);

  // 3) one-time tokens (verify/reset) — purged, not just revoked
  await db.authToken.deleteMany({ where: { userId: user.id } });

  // 4) credential + identity links (they carry the email / provider uid)
  await db.credential.deleteMany({ where: { userId: user.id } });
  await db.authIdentity.deleteMany({ where: { userId: user.id } });

  // 5) anonymize the user row — the ledger keeps resolving, the person is gone
  await db.user.update({
    where: { id: user.id },
    data: {
      status: 'deleted',
      email: null,
      emailVerified: null,
      displayName: null,
      telegramUserId: null,
      settingsJson: '{}',
      handle: `deleted_${randomBytes(6).toString('hex')}`,
      lastSeenAt: null,
    },
  });

  await audit({
    actorKind: 'user_session',
    actorId: user.id,
    event: 'account.deleted',
    subject: user.id,
  });

  await clearSessionCookie();
  return ok({ deleted: true });
}
