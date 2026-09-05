// Audit log writer — VOL-04 §5 (LOCKED).
// Closed event set; meta_json carries ids and codes only — NEVER request
// bodies, file contents, or result payloads (VOL-10 §8.8 applies platform-wide).

import { db } from '@/lib/db';

export const AUDIT_EVENTS = [
  'token.created',
  'token.revoked',
  'token.rotated',
  'session.family_revoked',
  'consent.changed',
  'account.deleted',
  'account.created',
  'account.linked',
  'email.verified',
  'password.reset',
  'password.changed',
  'grant.revoked',
  'boost.granted',
  'billing.webhook_failed',
  'mode.brake_flipped',
  'mcp.device.approved',
  'mcp.device.attached',
  'mcp.session.revoked',
] as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[number];

export type ActorKind = 'user_session' | 'pat' | 'aat' | 'system' | 'founder';

/**
 * Write one audit row. `meta` must contain ids/codes only (validated by
 * convention here — callers pass e.g. { token_id, kind }).
 */
export async function audit(params: {
  actorKind: ActorKind;
  actorId?: string;
  event: AuditEvent;
  subject?: string;
  meta?: Record<string, string | number | boolean>;
}): Promise<void> {
  await db.auditLog.create({
    data: {
      actorKind: params.actorKind,
      actorId: params.actorId ?? null,
      event: params.event,
      subject: params.subject ?? null,
      metaJson: params.meta ? JSON.stringify(params.meta) : null,
    },
  });
}
