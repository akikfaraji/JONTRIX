// GET/POST /api/consent — AI-training consent (D-05, VOL-05 §8, LOCKED).
// Default denied; every change writes exactly one consent_events row in the
// same transaction as the users update; policy bumps trigger a re-ask, never
// an automatic flip (VOL-04 §5 MUST).

import { getSessionAuth } from '@/lib/auth';
import { ok, fail, ERR } from '@/lib/envelope';
import { db } from '@/lib/db';
import { audit } from '@/lib/audit';
import { burstCheck } from '@/lib/burst';

export const dynamic = 'force-dynamic';

const CURRENT_POLICY_VERSION = 1; // mirrors the published policy (VOL-16 §6)

export async function GET(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');

  const user = await db.user.findUnique({ where: { id: auth.userId } });
  if (!user) return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'account unavailable');

  return ok({
    state: user.aiTrainingConsent,
    policy_version: CURRENT_POLICY_VERSION,
    consent_version: user.consentVersion,
    re_ask_required: user.consentVersion < CURRENT_POLICY_VERSION,
  });
}

export async function POST(req: Request) {
  const auth = await getSessionAuth(req);
  if (!auth) return fail(ERR.AUTH_REQUIRED, 'AUTH_REQUIRED', 'sign in required');
  if (!burstCheck(`consent:${auth.userId}`).ok) {
    return fail(ERR.RATE_LIMITED, 'RATE_LIMITED', 'slow down');
  }

  let body: { consent?: string; surface?: string };
  try {
    body = (await req.json()) as { consent?: string; surface?: string };
  } catch {
    return fail(ERR.BAD_REQUEST, 'BAD_REQUEST', 'malformed JSON body');
  }
  if (body.consent !== 'granted' && body.consent !== 'denied') {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'consent must be granted or denied', {
      field: 'consent',
    });
  }
  if (!['onboarding', 'settings', 're-ask'].includes(body.surface ?? '')) {
    return fail(ERR.ARGUMENTS_INVALID, 'ARGUMENTS_INVALID', 'surface must be onboarding, settings, or re-ask', {
      field: 'surface',
    });
  }

  const user = await db.user.findUnique({ where: { id: auth.userId } });
  if (!user) return fail(ERR.AUTH_INVALID, 'AUTH_INVALID', 'account unavailable');

  const from = user.aiTrainingConsent;
  const to = body.consent;
  if (from !== to) {
    // One transaction: users write + exactly one consent_events row (VOL-04 §5).
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          aiTrainingConsent: to,
          consentVersion: CURRENT_POLICY_VERSION,
          consentAskedAt: new Date(),
        },
      });
      await tx.consentEvent.create({
        data: {
          userId: user.id,
          fromState: from,
          toState: to,
          policyVersion: CURRENT_POLICY_VERSION,
          surface: body.surface as 'onboarding' | 'settings' | 're-ask',
        },
      });
    });
    await audit({
      actorKind: 'user_session',
      actorId: user.id,
      event: 'consent.changed',
      subject: user.id,
      meta: { from, to, surface: body.surface ?? '' },
    });
  } else {
    // Same state re-confirmed — still record the ask (asked_at updates),
    // but no event row: the closed set records state CHANGES (D-05 audit).
    await db.user.update({
      where: { id: user.id },
      data: { consentVersion: CURRENT_POLICY_VERSION, consentAskedAt: new Date() },
    });
  }

  return ok({ state: to, policy_version: CURRENT_POLICY_VERSION });
}
