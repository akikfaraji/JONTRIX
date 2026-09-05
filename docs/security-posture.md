# Security Posture — JONTRIX

Status: adversarially audited 2026-09-05 (batches A–G + MCP + bot + engine +
web e2e suites, all green). This document is the honest inventory of what
protects user data, what its limits are, and what only a deployment can add.

## 1. Cryptographic inventory (application layer)

| Purpose | Primitive | Parameters | Notes |
| --- | --- | --- | --- |
| Password storage | scrypt (`s2$` format) | N=2^14, r=8, p=1, 64-byte key, 16-byte salt | Memory-hard: no known quantum algorithm reduces the memory cost; Grover only halves the password's effective entropy, which the 10-char/2-class policy plus blocklist dominates. Constant-time verify; dummy-hash timing equalization for unknown accounts. |
| Session access tokens | HMAC-SHA256 signed payload | 15-min TTL, bound to a DB session row | Constant-time MAC compare. Grover halves SHA-256's preimage cost: 256→128-bit effective — still beyond brute force. |
| Session refresh tokens | 256-bit random, SHA-256 at rest | 30-day TTL, single-use, family revocation on replay | A database leak exposes hashes, not usable tokens. |
| Email OTP | 6 digits, SHA-256 at rest | 10-min TTL, 5 attempts, day lockout, 5 sends/day/address, 30 s resend interval | Attempt counter lives server-side. |
| One-time email tokens (verify/reset) | 256-bit random, SHA-256 at rest | 24 h / 1 h TTL, atomic single-use | Issue purges prior unused tokens of the same purpose. |
| OAuth state (CSRF) | 256-bit random, hashed in DB | 10-min TTL, single-use consume | Provider-scoped callback; unverified-email linking refused. |
| Telegram webhook | HMAC-SHA256 over raw body | Constant-time compare | Path token + secret double-check. |
| PAT / AAT secrets | 256-bit random, SHA-256 at rest | Plane isolation enforced per request | Revocation is immediate (same-process check on every call). |

No symmetric or asymmetric key material is hardcoded; `AUTH_SECRET` is
env-provided or generated at first boot into `db/auth-secret` (gitignored,
mode 0600).

## 2. Transport and context (per-response headers)

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` — self-locked; inline scripts/styles only (Next.js
  flight-data requirement), `frame-ancestors 'none'`, `form-action 'self'`
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- `Cross-Origin-Opener-Policy: same-origin`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: no-store, must-revalidate` on sensitive API responses
- Session cookie: `HttpOnly; SameSite=Lax; Secure (production); Path=/`

CSRF defense-in-depth: state-changing requests carrying the session cookie
must be same-site (`Sec-Fetch-Site`) or same-origin (`Origin` vs `Host`);
cross-site attempts get `403 CSRF_REJECTED`. Bearer-token clients are
unaffected (no ambient credentials → no CSRF).

## 3. Post-quantum honesty

What is already quantum-robust at the application layer:

- Password hashing (scrypt) — memory hardness is unaffected by Shor; Grover's
  quadratic speedup does not collapse a memory-hard function.
- All stored secrets are SHA-256 digests of 256-bit random values. Under
  Grover the effective strength is ~128-bit — the same margin TLS 1.3
  accepts for symmetric keys post-quantum.
- No RSA/ECDH key material is persisted anywhere in the codebase, so there
  is no stored ciphertext a future CRQC (cryptographically relevant quantum
  computer) could retroactively decrypt ("harvest now, decrypt later"
  exposure at the application layer is nil — session/OTP/token data is
  short-lived by design).

What a deployment must provide (it is TLS-terminator configuration, not
application code — see the manual checklist in the final report):

- TLS 1.3 with a hybrid post-quantum key exchange — X25519 + ML-KEM-768
  (Kyber) — is supported by Chrome/Firefox/Edge and by Cloudflare, Google
  and AWS terminators today; enable it at the edge.
- Certificate signatures remain classical (ECDSA/RSA) until CAs ship ML-DSA
  chains; track CA availability, rotate on release.

No honest "quantum-proof" claim can be made about TLS before the terminator
is configured; everything above the transport already is.

## 4. Abuse limits (verified by the adversarial suites)

- Register: per-IP burst limiter + OTP-style mail caps.
- Login: 5 failed attempts/day → lockout; reset flow (email proof) clears it.
- OTP: 30 s resend interval, 5/day/address (rotating spoofed X-Forwarded-For
  does not bypass — the cap keys on the address).
- Engine runs: per-user daily quota, per-user concurrency slot (atomic),
  hard 10 s engine timeout, 2 MB request cap, 64 KB inline result cap.
- Body parsing: every JSON route goes through one size-capped, JSON-only
  parser (per-route caps 1 KB–256 KB); oversize/non-JSON refused before
  buffering.
- Sessions: list/revoke-others/revoke-all, single-use refresh with family
  revocation on replay, last-seen heartbeat.

## 5. Accepted, documented residuals

- `prisma` CLI (devDependency) → `@prisma/config` → `deepmerge-ts <8` has a
  stack-exhaustion advisory. Build-time only: the deployed runtime imports
  the query engine, never the CLI's config merger. Fix lands with the next
  Prisma minor; not attacker-reachable in production.
- `X-Forwarded-For` is trusted for burst keys and session metadata. Behind a
  real proxy this is correct; direct Internet exposure would allow IP
  spoofing for rate-key collisions (auth surfaces additionally cap per
  account, so login/OTP/mail brute force is still bounded).
- Next.js CSP keeps `unsafe-inline`/`unsafe-eval` for scripts because the
  App Router injects flight data; the product adds no third-party script
  origins, which keeps the practical XSS surface self-only.
