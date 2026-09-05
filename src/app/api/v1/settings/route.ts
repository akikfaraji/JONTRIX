// PATCH /api/v1/settings — PAT data-plane settings (VOL-05 §3.1).
// Same non-security allowlist as the session route (theme, locale, default
// export format). Security-relevant capabilities are control-plane only.

import { authenticateBearer } from '@/lib/bearer';
import { ok, fail, ERR } from '@/lib/envelope';
import { db } from '@/lib/db';
import { checkAndIncrement } from '@/lib/entitlements';
import { burstCheck } from '@/lib/burst';
import { readJsonWithLimit } from '@/lib/validate';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = new Set(['theme', 'locale', 'default_export_format']);
const ALLOWED_VALUES: Record<string, Set<string>> = {
  theme: new Set(['light', 'dark', 'system']),
  locale: new Set(['en']),
  default_export_format: new Set(['json', 'csv']),
};

export async function PATCH(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'valid PAT bearer required');
  if (auth.kind !== 'pat') {
    return fail(ERR.TOKEN_KIND_MISMATCH, 'TOKEN_KIND_MISMATCH', 'this surface accepts a PAT only');
  }
  if (!burstCheck(`pat:${auth.tokenId}`).ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'burst limit reached (10 req / 10 s)');
  }
  const patCheck = await checkAndIncrement(auth.userId, 'pat');
  if (!patCheck.allowed) {
    return fail(ERR.QUOTA_EXCEEDED, 'QUOTA_EXCEEDED', 'PAT daily ceiling reached', {
      resets_at: patCheck.resets_at,
    });
  }

  let body: Record<string, unknown>;
  try {
    const parsedBody = await readJsonWithLimit(req, 8 * 1024);

    if (!parsedBody.ok) throw new Error('BAD_BODY');

    body = parsedBody.body as Record<string, unknown>;
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
      return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', `unknown setting: ${key}`, { field: key });
    }
    if (typeof value !== 'string' || !ALLOWED_VALUES[key]?.has(value)) {
      return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', `invalid value for ${key}`, { field: key });
    }
    settings[key] = value;
  }

  await db.user.update({
    where: { id: user.id },
    data: { settingsJson: JSON.stringify(settings) },
  });

  return ok({ settings });
}
