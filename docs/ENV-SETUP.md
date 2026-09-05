# Environment setup — where to get every variable

Grounded in the code: every var below is read by `src/lib/*` today. Dev mode
runs with only `DATABASE_URL` (mail driver falls back to `log`, OAuth reports
"not configured" honestly). Real email, social login, and a public deploy need
the rest. All options are free tier.

## 0. Secrets you generate yourself (instant, free)

```bash
openssl rand -base64 32   # → AUTH_SECRET
openssl rand -hex 16      # → BOOST_SALT
openssl rand -hex 24      # → TELEGRAM_WEBHOOK_SECRET
```

Keep them private; never commit the filled `.env`.

## 1. Database — `DATABASE_URL`

- **Local / single VPS (current):** `file:./db/jontrix.db` — zero config.
- **Ephemeral hosts (Vercel) or multi-instance:** free hosted Postgres —
  [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com) →
  create project → copy connection string → set Prisma provider to
  `postgresql` in `prisma/schema.prisma` → `npx prisma migrate deploy`.

## 2. Real email — `SMTP_*` (the one thing between you and real mail)

Any of these free SMTP providers plugs straight into `src/lib/mailer.ts`:

**Option A — Gmail app password (fastest, ~500 mails/day):**
1. Google Account → Security → turn on 2-Step Verification.
2. Search "App passwords" → create one (16 chars).
3. `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=you@gmail.com
   SMTP_PASS=<16-char app password>
   SMTP_FROM="JONTRIX <you@gmail.com>"
   ```

**Option B — Brevo (300/day free, custom domain sender):**
1. Sign up at brevo.com → SMTP & API → copy SMTP keys.
2. Senders & Domains → verify your domain (add the DKIM/SPF DNS records it shows).
3. `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`,
   `SMTP_USER`/`SMTP_PASS` from the SMTP page, `SMTP_FROM="JONTRIX <noreply@your-domain>"`.

**Option C — Resend SMTP (3,000/mo free):**
1. Sign up at resend.com → API Keys → create.
2. Domains → add your domain → add the shown DNS records (SPF + DKIM).
3. `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`,
   `SMTP_USER=resend`, `SMTP_PASS=<api key re_...>`.

DNS records are added at your domain registrar / Cloudflare — propagation
usually under an hour. Deliverability without your own verified domain is
poor (spam folders), so for production prefer B or C with a real domain.

## 3. Google OAuth — `GOOGLE_CLIENT_*` (free, no card)

Exact redirect the code registers: `${APP_ORIGIN}/api/auth/oauth/google/callback`

1. [console.cloud.google.com](https://console.cloud.google.com) → create project (any name).
2. APIs & Services → OAuth consent screen → External → fill app name,
   support email, developer email → add scopes `openid`, `email`, `profile`
   (non-sensitive, so you can publish without a verification audit).
3. APIs & Services → Credentials → Create credentials → OAuth client ID →
   Web application.
4. Authorized JavaScript origins: `https://your-domain` and
   `http://localhost:3000`.
5. Authorized redirect URIs (both):
   - `https://your-domain/api/auth/oauth/google/callback`
   - `http://localhost:3000/api/auth/oauth/google/callback`
6. Copy Client ID + Client Secret into `.env`.

## 4. GitHub OAuth — `GITHUB_CLIENT_*` (free)

Exact redirect: `${APP_ORIGIN}/api/auth/oauth/github/callback`

1. github.com → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Application name: JONTRIX; Homepage URL: `https://your-domain`.
3. Authorization callback URL:
   `https://your-domain/api/auth/oauth/github/callback`
4. Register → Generate client secret → copy ID + secret into `.env`.

Account-linking safety is already enforced in code: a provider identity only
auto-links to an existing JONTRIX account when its email is verified.

## 5. Domain, HTTPS, `APP_ORIGIN`

1. Point your domain's DNS at your host (Cloudflare free plan is fine).
2. TLS: host on Vercel (automatic) or run `certbot` (Let's Encrypt) on the VPS.
3. Set `APP_ORIGIN=https://your-domain` (no trailing slash) in the host env.
   This drives every emailed link and OAuth callback, and stops host-header
   tampering on reset/verify links.
4. `NODE_ENV=production` — flips `Secure` cookies on.

## 6. Telegram bot + MiniApp (optional, when you ship that piece)

1. @BotFather → `/newbot` → token → `TELEGRAM_BOT_TOKEN`.
2. `TELEGRAM_WEBHOOK_SECRET` = random hex; register the webhook with
   `setWebhook?secret_token=<same value>` — the route refuses calls without it.
3. `MINIAPP_URL`: BotFather → Bot Settings → Menu Button.
4. AdsGram: adsgram.io → create block → Block ID → `NEXT_PUBLIC_ADSGRAM_ID`;
   optional verify key → `ADSGRAM_VERIFY_KEY`.

## 7. Applying the values

- **Local:** fill `.env` (copy from `.env.example`) → restart `npm run dev`.
- **VPS:** export via systemd `Environment=`/`EnvironmentFile=` or docker
  `--env-file`; restart the service.
- **Vercel:** Project → Settings → Environment Variables → paste each key.

## 8. Verify the wiring

```bash
curl -s https://your-domain/api/health
# register with a real address → you should receive the verification email
# sign in with Google/GitHub → round-trip back to your dashboard
# server log shows driver:'smtp' delivered:true (not driver:'log')
```
