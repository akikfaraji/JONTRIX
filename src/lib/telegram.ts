// Telegram identity helpers — VOL-06 §2 + VOL-08 §1.
// initData HMAC validation is the Mini App's only auth (no second system);
// bot commands link the account by telegram id (first-login provisioning).

import { createHmac } from 'node:crypto';
import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';

/**
 * Validate Telegram Mini App initData (VOL-06 §2): data-check-string HMAC
 * with the bot token's secret key. Returns the parsed fields or null.
 * window.Telegram.WebApp sends `initData`; we never trust client calls
 * without this check.
 */
export function validateInitData(
  initData: string,
  botToken: string,
): Record<string, string> | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (computed !== hash) return null;

  // auth_date freshness: 1 day (replay window)
  const authDate = Number(params.get('auth_date') ?? '0');
  if (!authDate || Date.now() / 1000 - authDate > 86_400) return null;

  const out: Record<string, string> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

/** Get-or-create the user behind a Telegram identity (VOL-06 §2). */
export async function upsertUserByTelegram(
  telegramUserId: string,
  displayName?: string,
) {
  const identity = await db.authIdentity.findUnique({
    where: { provider_providerUid: { provider: 'telegram', providerUid: telegramUserId } },
    include: { user: true },
  });
  if (identity) {
    await db.user.update({ where: { id: identity.userId }, data: { lastSeenAt: new Date() } });
    return identity.user;
  }

  const base = (displayName ?? `tg_${telegramUserId.slice(-6)}`).toLowerCase().replace(/[^a-z0-9_.-]/gi, '').slice(0, 24) || `tg_${telegramUserId.slice(-6)}`;
  let handle = base;
  for (let i = 0; i < 5; i++) {
    const exists = await db.user.findUnique({ where: { handle } });
    if (!exists) break;
    handle = `${base}_${randomBytes(2).toString('hex')}`;
  }

  return db.user.create({
    data: {
      handle,
      authIdentities: {
        create: { provider: 'telegram', providerUid: telegramUserId },
      },
    },
  });
}

export function telegramBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return token && token.includes(':') ? token : null;
}
