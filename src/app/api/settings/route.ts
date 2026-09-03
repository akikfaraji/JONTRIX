// PATCH /api/settings — non-security settings only (VOL-05 §4).
// Allowlist: theme, locale, default export format. Never anything
// security-relevant — those are control-plane capabilities.

import { getSessionAuth } from '@/lib/auth';
import { ok, fail, ERR } from '@/lib/envelope';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = new Set(['theme', 'locale', 'default_export_format']);
const ALLOWED_VALUES: Record<string, Set<string>> = {
  theme: new Set(['light', 'dark', 'system']),
  locale: new Set(['en']),
  default_export_format: new Set(['json', 'csv']),
};

export async function PATCH(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body');
  }

  const user = await db.user.findUnique({ where: { id: auth.userId } });
  if (!user) return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'account unavailable');

  let settings: Record<string, string> = {};
  try {
    settings = JSON.parse(user.settingsJson || '{}') as Record<string, string>;
  } catch {
    settings = {};
  }

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.has(key)) {
      return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', `unknown setting: ${key}`, {
        field: key,
      });
    }
    if (typeof value !== 'string' || !ALLOWED_VALUES[key]?.has(value)) {
      return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', `invalid value for ${key}`, {
        field: key,
      });
    }
    settings[key] = value;
  }

  await db.user.update({
    where: { id: user.id },
    data: { settingsJson: JSON.stringify(settings) },
  });

  return ok({ settings });
}
