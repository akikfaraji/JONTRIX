// Response envelope + error taxonomy — VOL-05 §2 and §9, LOCKED.
// Every JSON response from the platform API uses this envelope and nothing else.

import { VERSION } from '@/version';

export interface EnvelopeMeta {
  request_id: string;
  version: string;
  ts: number;
}

export interface QuotaBlock {
  base: number;
  boost: number;
  effective: number;
  remaining: number;
  resets_at: string;
}

function meta(): EnvelopeMeta {
  return { request_id: crypto.randomUUID(), version: VERSION, ts: Date.now() };
}

export function ok(data: unknown, init?: ResponseInit): Response {
  return Response.json({ ok: true, data, meta: meta() }, init);
}

export function fail(
  status: number,
  code: string,
  message: string,
  extra?: { field?: string; upgrade_url?: string; resets_at?: string },
): Response {
  return Response.json(
    { ok: false, error: { code, message, ...extra }, meta: meta() },
    { status },
  );
}

// VOL-05 §9 error codes (closed set) — name them, never invent new shapes.
export const ERR = {
  BAD_REQUEST: 400,
  AUTH_REQUIRED: 401,
  AUTH_INVALID: 401,
  TIER_LOCKED: 402,
  QUOTA_EXCEEDED: 402,
  TOKEN_KIND_MISMATCH: 403,
  CONTROL_PLANE_LOCKED: 403,
  FORBIDDEN_TOOL: 403,
  NOT_FOUND: 404,
  UNKNOWN_TOOL: 404,
  CONFLICT_IDEMPOTENCY: 409,
  ARGUMENTS_INVALID: 422,
  LIMIT_REACHED: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
} as const;
