// Security headers + CSRF origin guard — applied to every route (pages + API)
// via middleware. CSP is deliberately pragmatic: Next.js App Router injects
// inline scripts (flight data) and inline styles, so 'unsafe-inline' stays for
// script/style; everything else is locked to self. No third-party origins are
// needed by the product itself (AdsGram runs only inside the Telegram Mini App
// host).
//
// CSRF layer: SameSite=Lax already stops the browser from attaching the
// session cookie to cross-site POSTs — the guard below is defense-in-depth on
// top: any state-changing request that DOES carry the session cookie must be
// same-site (Sec-Fetch-Site) or carry a matching Origin. Bearer-token clients
// (PAT/AAT/MCP/Telegram) send no cookie and are unaffected; same-origin
// browser fetches always pass.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'jx_sess';
const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Transport security: no-op over plain HTTP in dev (browsers ignore HSTS on
  // http://), enforced by every conforming client once TLS terminates — the
  // production checklist pins TLS 1.3 with an ML-KEM hybrid key exchange.
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );
  // Isolate browsing context from cross-origin documents (defense-in-depth
  // against XS-Leaks and tab-nabbing; OAuth uses top-level redirects only).
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  );

  // ── CSRF guard (cookie-carrying state changes only) ──────────────────────
  const mutating = MUTATING.has(req.method);
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE));
  if (mutating && hasSession) {
    const site = req.headers.get('sec-fetch-site');
    // A conforming browser tells us the initiator's site directly.
    if (site === 'cross-site' || site === 'cross-origin') {
      return NextResponse.json(
        {
          ok: false,
          error: { code: 'CSRF_REJECTED', message: 'cross-site request refused' },
        },
        { status: 403 },
      );
    }
    const origin = req.headers.get('origin');
    if (origin) {
      const host =
        req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
      let same = false;
      try {
        same = Boolean(host) && new URL(origin).host === host;
      } catch {
        same = false;
      }
      if (!same) {
        return NextResponse.json(
          {
            ok: false,
            error: { code: 'CSRF_REJECTED', message: 'cross-origin request refused' },
          },
          { status: 403 },
        );
      }
    }
    // No Origin + no Sec-Fetch-Site: non-browser client (curl, SDKs) — same
    // ambient-credential exposure as first-party; allow as today.
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
