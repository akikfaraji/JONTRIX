// Security headers — applied to every route (pages + API) via middleware.
// CSP is deliberately pragmatic: Next.js App Router injects inline scripts
// (flight data) and inline styles, so 'unsafe-inline' stays for script/style;
// everything else is locked to self. No third-party origins are needed by
// the product itself (AdsGram runs only inside the Telegram Mini App host).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
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

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
