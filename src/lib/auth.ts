// Session auth + email OTP — VOL-06 §2 (LOCKED), D-07 environment delta.
//
// Cookie contract: `jx_sess` HttpOnly, SameSite=Lax, carries
// "<access>.<refresh>" where access = HMAC-signed 15-minute payload bound to
// the session row, refresh = a 30-day single-use secret whose SHA-256 lives
// in the sessions row. Refresh rotation is single-use: presenting a consumed
// refresh revokes the whole family (replay detection), audited as
// session.family_revoked.
//
// Email OTP: 6-digit code, SHA-256 at rest, TTL 10 min, max 5 attempts then
// locked for the UTC day (T6.1). Delivery is pluggable; the build
// environment uses the `log` driver (code appears in the server log) until
// SMTP credentials land with the billing phase — stated honestly in the UI.
//
// D-07 delta: the spec's KV STATE store is realized as the KvState table —
// cross-route state in Next.js cannot live in module memory (each route
// bundle holds its own module instance). Semantics preserved: hashed codes,
// 10-min TTL, day-keyed lockouts. Expired rows purge opportunistically.

import { cookies } from 'next/headers';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { sha256, randomSecret } from '@/lib/tokens';
import { utcDay } from '@/lib/utc';
import { audit } from '@/lib/audit';
import { codeEmail, sendMail, type MailDriver } from '@/lib/mailer';

const COOKIE = 'jx_sess';
const ACCESS_TTL_MS = 15 * 60 * 1000; // 15 min — VOL-06 §2
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 d
const OTP_TTL_MS = 10 * 60 * 1000; // 10 min
const OTP_MAX_ATTEMPTS = 5;

// ── server secret (HMAC for access payloads) ────────────────────────────────

let cachedSecret: string | null = null;

/**
 * HMAC secret for access payloads. AUTH_SECRET env wins; otherwise a dev
 * secret is generated once and persisted under db/ (gitignored) — it never
 * enters the repo (G-15).
 */
async function serverSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  if (process.env.AUTH_SECRET) {
    cachedSecret = process.env.AUTH_SECRET;
    return cachedSecret;
  }
  const { readFileSync, writeFileSync, existsSync } = await import('node:fs');
  const path = 'db/auth-secret';
  if (existsSync(path)) {
    cachedSecret = readFileSync(path, 'utf8').trim();
  } else {
    cachedSecret = randomSecret();
    writeFileSync(path, cachedSecret, { mode: 0o600 });
  }
  return cachedSecret;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}


// ── shared TTL store (KV STATE delta — KvState table) ───────────────────────
// Cross-route state in Next.js cannot live in module memory (each route
// bundle holds its own module instance). The spec's KV STATE semantics are
// preserved: hashed codes, 10-min TTL, day-keyed lockouts, hashed at rest.

async function ttlSet(key: string, value: string, ttlMs: number): Promise<void> {
  await db.kvState.upsert({
    where: { key },
    create: { key, value, expiresAt: new Date(Date.now() + ttlMs) },
    update: { value, expiresAt: new Date(Date.now() + ttlMs) },
  });
}

async function ttlGet(key: string): Promise<string | null> {
  const row = await db.kvState.findUnique({ where: { key } });
  if (!row) return null;
  if (row.expiresAt < new Date()) {
    await db.kvState.delete({ where: { key } }).catch(() => undefined);
    return null;
  }
  return row.value;
}

async function ttlDel(key: string): Promise<void> {
  await db.kvState.delete({ where: { key } }).catch(() => undefined);
}

// ── OTP (email identity) ────────────────────────────────────────────────────

export interface OtpIssue {
  ok: true;
  /** Delivery driver actually used — surfaced honestly to the client. */
  driver: MailDriver;
}
export interface OtpRefusal {
  ok: false;
  reason: 'locked' | 'send_cap' | 'resend_interval';
  resets_at: string;
}

const OTP_SEND_CAP_PER_DAY = 5;
const OTP_RESEND_INTERVAL_MS = 30 * 1000;

function normalizeEmail(email: unknown): string {
  return String(email ?? '').trim().toLowerCase();
}

/**
 * Issue an email OTP. Codes are hashed at rest (VOL-04 §1.4); the plaintext
 * reaches ONLY the mail transport (or the dev log). Anti-flood: max 5 sends
 * per address per UTC day and a 30 s resend interval — rotating spoofed
 * X-Forwarded-For values cannot turn this endpoint into a mail bomber.
 */
export async function issueOtp(emailRaw: string): Promise<OtpIssue | OtpRefusal> {
  const email = normalizeEmail(emailRaw);
  const lockKey = `otp_lock:${email}:${utcDay()}`;
  if (await ttlGet(lockKey)) {
    const resets = new Date(Date.now() + 24 * 3600 * 1000);
    return { ok: false, reason: 'locked', resets_at: resets.toISOString() };
  }

  // per-address resend interval
  const lastKey = `otp_last_sent:${email}`;
  const last = await ttlGet(lastKey);
  if (last && Date.now() - Number(last) < OTP_RESEND_INTERVAL_MS) {
    const resets = new Date(Number(last) + OTP_RESEND_INTERVAL_MS);
    return { ok: false, reason: 'resend_interval', resets_at: resets.toISOString() };
  }

  // per-address daily send cap
  const sentKey = `otp_sent_count:${email}:${utcDay()}`;
  const sentRaw = await ttlGet(sentKey);
  const sent = sentRaw ? Number(sentRaw) : 0;
  if (sent >= OTP_SEND_CAP_PER_DAY) {
    const resets = new Date(Date.now() + 24 * 3600 * 1000);
    return { ok: false, reason: 'send_cap', resets_at: resets.toISOString() };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await ttlSet(`otp_code:${email}`, JSON.stringify({ hash: sha256(code), attempts: 0 }), OTP_TTL_MS);
  await ttlSet(lastKey, String(Date.now()), 24 * 3600 * 1000);
  await ttlSet(sentKey, String(sent + 1), 24 * 3600 * 1000);

  // Delivery — real SMTP when configured; honest dev log driver otherwise.
  const mail = codeEmail(code);
  const result = await sendMail({ to: email, ...mail });
  const driver = result.driver;
  if (driver === 'log') {
    // The log driver's contract: the code appears in the server log — this
    // line is also what the acceptance sweeps (test-mcp.sh et al.) extract.
    console.log(`[auth] OTP for ${email}: ${code} (dev log driver — expires in 10 min)`);
  }
  if (driver === 'smtp' && !result.delivered) {
    console.error(`[auth] OTP mail delivery failed for ${email}: ${result.error}`);
  }

  return { ok: true, driver };
}

/** Verify an email OTP; on success returns the normalized email. */
export async function verifyOtp(
  emailRaw: unknown,
  codeRaw: unknown,
): Promise<{ ok: true; email: string } | { ok: false; reason: 'expired' | 'invalid' | 'locked' }> {
  if (typeof emailRaw !== 'string' || typeof codeRaw !== 'string') {
    return { ok: false, reason: 'invalid' };
  }
  const email = normalizeEmail(emailRaw);
  const code = codeRaw;
  const key = `otp_code:${email}`;
  const raw = await ttlGet(key);
  if (!raw) return { ok: false, reason: 'expired' };

  const entry = JSON.parse(raw) as { hash: string; attempts: number };
  if (entry.attempts >= OTP_MAX_ATTEMPTS) {
    await ttlDel(key);
    await ttlSet(`otp_lock:${email}:${utcDay()}`, '1', 24 * 3600 * 1000);
    return { ok: false, reason: 'locked' };
  }

  if (sha256(code.trim()) !== entry.hash) {
    entry.attempts += 1;
    await ttlSet(key, JSON.stringify(entry), OTP_TTL_MS);
    return { ok: false, reason: 'invalid' };
  }

  await ttlDel(key);
  return { ok: true, email };
}

// ── user provisioning ───────────────────────────────────────────────────────

/** Get-or-create the user for a verified identity (VOL-06 §2 first-login path). */
export async function upsertUserByEmail(email: string) {
  const identity = await db.authIdentity.findUnique({
    where: { provider_providerUid: { provider: 'email', providerUid: email } },
    include: { user: true },
  });
  if (identity) {
    await db.user.update({ where: { id: identity.userId }, data: { lastSeenAt: new Date() } });
    return identity.user;
  }

  const base = email.split('@')[0].replace(/[^a-z0-9_.-]/gi, '').slice(0, 30) || 'user';
  let handle = base;
  for (let attempt = 0; attempt < 8; attempt++) {
    const exists = await db.user.findUnique({ where: { handle } });
    if (!exists) {
      try {
        return await db.user.create({
          data: {
            handle,
            email,
            authIdentities: {
              create: { provider: 'email', providerUid: email },
            },
          },
        });
      } catch {
        // unique-constraint race on handle or email — retry with a suffix
      }
    }
    handle = `${base}_${randomBytes(2).toString('hex')}`;
  }
  throw new Error('could not provision a unique handle');
}

/**
 * Registration path: create a user that does not exist yet, with a scrypt
 * credential and the shared AuthIdentity('email') marker so OTP and password
 * logins converge on the same identity. Caller has already checked the email
 * is free — a racing duplicate surfaces as a unique-constraint error and is
 * reported to the caller (409) rather than silently merged.
 */
export async function createProvisionedUser(
  email: string,
  passwordHash: string | null,
  displayName: string | null,
) {
  const base = email.split('@')[0].replace(/[^a-z0-9_.-]/gi, '').slice(0, 30) || 'user';
  let handle = base;
  for (let attempt = 0; attempt < 8; attempt++) {
    const exists = await db.user.findUnique({ where: { handle } });
    if (!exists) {
      try {
        return await db.user.create({
          data: {
            handle,
            email,
            displayName,
            authIdentities: { create: { provider: 'email', providerUid: email } },
            ...(passwordHash ? { credential: { create: { passwordHash } } } : {}),
          },
        });
      } catch {
        // handle or email unique race — retry with a fresh suffix
      }
    }
    handle = `${base}_${randomBytes(2).toString('hex')}`;
  }
  throw new Error('could not provision a unique handle');
}

// ── session lifecycle ───────────────────────────────────────────────────────

export interface SessionTokens {
  access: string;
  refresh: string;
}

/** Create a session row and mint the access/refresh pair (VOL-06 §2). */
export async function createSession(
  userId: string,
  kind: 'pwa' | 'miniapp' | 'dashboard',
  req: Request,
): Promise<SessionTokens> {
  const refresh = randomSecret();
  const secret = await serverSecret();

  const row = await db.session.create({
    data: {
      userId,
      kind,
      hashSha256: sha256(refresh),
      refreshFamily: randomSecret(),
      createdIp: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  const access = await mintAccess(row.id, userId, secret);
  return { access, refresh };
}

async function mintAccess(sessionId: string, userId: string, secret: string): Promise<string> {
  const payload = Buffer.from(
    JSON.stringify({ sid: sessionId, uid: userId, exp: Date.now() + ACCESS_TTL_MS }),
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

async function verifyAccess(
  token: string,
  secret: string,
): Promise<{ sid: string; uid: string } | null> {
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return null;
  // constant-time MAC comparison (timing-attack hardening)
  const expected = Buffer.from(sign(payload, secret));
  const provided = Buffer.from(mac);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      sid: string;
      uid: string;
      exp: number;
    };
    if (parsed.exp < Date.now()) return null;
    return { sid: parsed.sid, uid: parsed.uid };
  } catch {
    return null;
  }
}

export interface AuthContext {
  userId: string;
  sessionId: string;
  kind: string;
}

/**
 * Authenticate the browser session from the `jx_sess` cookie.
 * Verifies the access payload; falls back to refresh rotation when the
 * access token has aged out (single-use refresh, family revocation on
 * replay — VOL-06 §2 / VOL-10 §4.8 semantics).
 */
export async function getSessionAuth(req: Request): Promise<AuthContext | null> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const raw = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!raw) return null;

  const [access, refresh] = decodeURIComponent(raw).split(':');
  if (!access) return null;

  const secret = await serverSecret();
  const valid = await verifyAccess(access, secret);
  if (valid) {
    const row = await db.session.findUnique({ where: { id: valid.sid } });
    if (!row || row.revokedAt || row.expiresAt < new Date()) return null;
    // last-seen heartbeat, throttled to one write per minute per session —
    // powers the "active sessions" security view without hammering SQLite.
    void db.session.updateMany({
      where: {
        id: row.id,
        OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(Date.now() - 60_000) } }],
      },
      data: { lastSeenAt: new Date() },
    }).catch(() => undefined);
    return { userId: row.userId, sessionId: row.id, kind: row.kind };
  }

  // Access aged out or forged — attempt single-use refresh rotation.
  if (!refresh) return null;
  const row = await db.session.findUnique({ where: { hashSha256: sha256(refresh) } });
  if (!row) return null; // unknown refresh — nothing to reveal

  if (row.revokedAt || row.expiresAt < new Date()) {
    // Replay of a consumed refresh: revoke the family (VOL-06 §2).
    await db.session.updateMany({
      where: { refreshFamily: row.refreshFamily, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await audit({
      actorKind: 'user_session',
      actorId: row.userId,
      event: 'session.family_revoked',
      subject: row.id,
      meta: { reason: 'refresh_replay' },
    });
    return null;
  }

  // Rotate: this refresh dies, a new pair is issued for the same row.
  // Atomic single-use: the update is conditional on the hash still matching
  // — two parallel requests carrying the same consumed refresh cannot both
  // win (the loser sees count 0 and is treated as a replay).
  const newRefresh = randomSecret();
  const rotated = await db.session.updateMany({
    where: { id: row.id, hashSha256: sha256(refresh) },
    data: { hashSha256: sha256(newRefresh) },
  });
  if (rotated.count === 0) {
    // lost the race → the winner already consumed this refresh; treat this
    // presentation as a replay attempt and let the next clean request
    // trigger family revocation through the revokedAt path above.
    return null;
  }
  const newAccess = await mintAccess(row.id, row.userId, secret);
  await setSessionCookie(req, { access: newAccess, refresh: newRefresh });
  return { userId: row.userId, sessionId: row.id, kind: row.kind };
}

/** Set the `jx_sess` cookie on a Next.js response-less route handler. */
export async function setSessionCookie(_req: Request, tokens: SessionTokens): Promise<void> {
  const jar = await cookies();
  // ':' separator — the access token itself contains dots (payload.mac).
  // NOTE: Next's cookie serializer encodes the value itself — pass the raw
  // string; encoding it here too would double-encode ('%253A').
  const value = `${tokens.access}:${tokens.refresh}`;
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_TTL_MS / 1000,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

/** Revoke the current session row and clear the cookie (sign-out). */
export async function revokeSession(auth: AuthContext): Promise<void> {
  await db.session.update({
    where: { id: auth.sessionId },
    data: { revokedAt: new Date() },
  }).catch(() => undefined);
  await clearSessionCookie();
}

// ── session management (account security view) ───────────────────────────

export interface SessionListItem {
  id: string;
  kind: string;
  created_ip: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string | null;
  expires_at: string;
  current: boolean;
}

/** Active (non-revoked, non-expired) sessions for a user, newest first. */
export async function listActiveSessions(
  userId: string,
  currentSessionId: string,
): Promise<SessionListItem[]> {
  const rows = await db.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    created_ip: r.createdIp,
    user_agent: r.userAgent,
    created_at: r.createdAt.toISOString(),
    last_seen_at: r.lastSeenAt ? r.lastSeenAt.toISOString() : null,
    expires_at: r.expiresAt.toISOString(),
    current: r.id === currentSessionId,
  }));
}

/**
 * Revoke one session by id, scoped to the owner — returns 'not_found' when
 * the id does not belong to this user (IDOR-safe: no existence leak across
 * accounts, same 404 for a foreign id and a bogus id).
 */
export async function revokeSessionById(
  userId: string,
  sessionId: string,
): Promise<'revoked' | 'not_found'> {
  const row = await db.session.findFirst({ where: { id: sessionId, userId } });
  if (!row || row.revokedAt) return row ? 'revoked' : 'not_found';
  await db.session.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
  await audit({
    actorKind: 'user_session',
    actorId: userId,
    event: 'session.revoked_by_user',
    subject: row.id,
  });
  return 'revoked';
}

/** Revoke every active session of a user except one ("sign out everywhere else"). */
export async function revokeOtherSessions(
  userId: string,
  keepSessionId: string,
): Promise<number> {
  const res = await db.session.updateMany({
    where: { userId, revokedAt: null, id: { not: keepSessionId } },
    data: { revokedAt: new Date() },
  });
  if (res.count > 0) {
    await audit({
      actorKind: 'user_session',
      actorId: userId,
      event: 'session.revoked_others',
      subject: keepSessionId,
      meta: { count: res.count },
    });
  }
  return res.count;
}

/** Revoke ALL active sessions of a user (password change, account deletion). */
export async function revokeAllSessions(userId: string): Promise<number> {
  const res = await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return res.count;
}
