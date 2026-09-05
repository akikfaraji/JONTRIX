// Auth dialog — the front door. Modes: sign-in (password | email code),
// create account, forgot/reset password inline. OAuth buttons probe the
// server honestly: an unconfigured provider disables itself with a note
// instead of bouncing the user to an error page.

'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignedIn: () => void;
}

type Mode = 'signin' | 'register' | 'forgot' | 'reset';

const FIELD_ERRORS: Record<string, string> = {
  email: 'That email address does not look valid.',
  password: 'That password was rejected.',
};

function errText(body: { error?: { code?: string; message?: string; field?: string } }): string {
  const e = body.error;
  if (!e) return 'Something went wrong — try again.';
  if (e.code === 'ARGUMENTS_INVALID' && e.field && FIELD_ERRORS[e.field]) {
    return `${FIELD_ERRORS[e.field]} ${e.message ?? ''}`.trim();
  }
  return e.message ?? 'Something went wrong — try again.';
}

export function SignInDialog({ open, onOpenChange, onSignedIn }: SignInDialogProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [signinWay, setSigninWay] = useState<'password' | 'code-request' | 'code-verify'>('password');

  // shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [oauth, setOauth] = useState<{ google: boolean; github: boolean }>({ google: false, github: false });

  useEffect(() => {
    if (open) {
      setMode('signin');
      setSigninWay('password');
      setPassword('');
      setCode('');
      setResetToken('');
      setResetPw('');
      setResetSent(false);
      setError(null);
      setNotice(null);
      // honest OAuth availability probe (never bounces to an error page)
      (['google', 'github'] as const).forEach((p) => {
        fetch(`/api/auth/oauth/${p}`, { redirect: 'manual' })
          .then((r) => setOauth((s) => ({ ...s, [p]: r.status === 302 || r.status === 307 })))
          .catch(() => setOauth((s) => ({ ...s, [p]: false })));
      });
    }
  }, [open]);

  function post(url: string, payload: unknown) {
    return fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((r) => r.json());
  }

  async function signInPassword() {
    setBusy(true); setError(null);
    try {
      const body = await post('/api/auth/login', { email, password });
      if (body.ok) { onOpenChange(false); onSignedIn(); }
      else setError(errText(body));
    } catch { setError('Network error — try again.'); }
    finally { setBusy(false); }
  }

  async function register() {
    setBusy(true); setError(null);
    try {
      const body = await post('/api/auth/register', {
        email, password, display_name: displayName || undefined,
      });
      if (body.ok) {
        onOpenChange(false);
        onSignedIn();
      } else setError(errText(body));
    } catch { setError('Network error — try again.'); }
    finally { setBusy(false); }
  }

  async function requestCode() {
    setBusy(true); setError(null);
    try {
      const body = await post('/api/auth/otp/request', { email });
      if (body.ok) setSigninWay('code-verify');
      else setError(errText(body));
    } catch { setError('Network error — try again.'); }
    finally { setBusy(false); }
  }

  async function verifyCode() {
    setBusy(true); setError(null);
    try {
      const body = await post('/api/auth/otp/verify', { email, code });
      if (body.ok) { onOpenChange(false); onSignedIn(); }
      else setError(errText(body));
    } catch { setError('Network error — try again.'); }
    finally { setBusy(false); }
  }

  async function sendReset() {
    setBusy(true); setError(null);
    try {
      const body = await post('/api/auth/password/forgot', { email });
      if (body.ok) { setResetSent(true); setMode('reset'); }
      else setError(errText(body));
    } catch { setError('Network error — try again.'); }
    finally { setBusy(false); }
  }

  async function doReset() {
    setBusy(true); setError(null);
    try {
      const body = await post('/api/auth/password/reset', { token: resetToken.trim(), password: resetPw });
      if (body.ok) {
        setNotice('Password updated. Sign in with the new password.');
        setMode('signin');
        setPassword('');
      } else setError(errText(body));
    } catch { setError('Network error — try again.'); }
    finally { setBusy(false); }
  }

  function oauthStart(provider: 'google' | 'github') {
    window.location.href = `/api/auth/oauth/${provider}`;
  }

  const title =
    mode === 'signin' ? 'Sign in to JONTRIX'
    : mode === 'register' ? 'Create your account'
    : mode === 'forgot' ? 'Reset your password'
    : 'Choose a new password';

  const showOAuth = mode === 'signin' || mode === 'register';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'signin' && 'One account for every tool — presets, tokens, and history stay yours.'}
            {mode === 'register' && 'Email and password. We send a verification link; your tools unlock immediately.'}
            {mode === 'forgot' && 'We email a single-use reset link. It expires in one hour.'}
            {mode === 'reset' && 'Paste the token from the email, or open the emailed link and come back with it.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'signin' && (
          <div className="space-y-4">
            <ToggleGroup
              type="single"
              value={signinWay}
              size="sm"
              className="w-full"
              onValueChange={(v) => v && setSigninWay(v === 'code' ? 'code-request' : 'password')}
            >
              <ToggleGroupItem value="password" variant="outline" className="flex-1">Password</ToggleGroupItem>
              <ToggleGroupItem value="code" variant="outline" className="flex-1">Email code</ToggleGroupItem>
            </ToggleGroup>

            {signinWay === 'password' ? (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!busy) void signInPassword(); }}>
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input id="auth-email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-pw">Password</Label>
                  <Input id="auth-pw" type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy || !email || !password}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
                <div className="flex justify-between text-xs">
                  <button type="button" className="text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => { setMode('forgot'); setError(null); }}>
                    Forgot password?
                  </button>
                  <button type="button" className="font-medium underline-offset-2 hover:underline"
                    onClick={() => { setMode('register'); setError(null); }}>
                    Create account
                  </button>
                </div>
              </form>
            ) : signinWay === 'code-request' ? (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!busy) void requestCode(); }}>
                <div className="space-y-2">
                  <Label htmlFor="auth-email-2">Email</Label>
                  <Input id="auth-email-2" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy || !email}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Email me a code
                </Button>
                <button type="button" className="w-full text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => { setMode('register'); setError(null); }}>
                  Need an account? Create one
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!busy) void verifyCode(); }}>
                <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                  <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    The six-digit code was sent to {email}.
                    {notice && ` ${notice}`} It expires in 10 minutes.
                  </span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-code">Six-digit code</Label>
                  <Input id="auth-code" inputMode="numeric" pattern="\d{6}" maxLength={6} required value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000"
                    className="font-mono tracking-[0.4em]" autoComplete="one-time-code" />
                </div>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => { setSigninWay('code-request'); setError(null); }}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={busy || code.length !== 6}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {mode === 'register' && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!busy) void register(); }}>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-name">Display name (optional)</Label>
              <Input id="reg-name" value={displayName} maxLength={60}
                onChange={(e) => setDisplayName(e.target.value)} placeholder="Alice" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-pw">Password</Label>
              <Input id="reg-pw" type="password" required minLength={10} value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">
                At least 10 characters, mixing two of: lowercase, uppercase, digits, symbols.
              </p>
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !email || password.length < 10}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
            <button type="button" className="w-full text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => { setMode('signin'); setError(null); }}>
              Already have an account? Sign in
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!busy) void sendReset(); }}>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Account email</Label>
              <Input id="forgot-email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !email}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
            <button type="button" className="w-full text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => { setMode('signin'); setError(null); }}>
              Back to sign in
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!busy) void doReset(); }}>
            {resetSent && (
              <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>If an account exists for {email}, a reset link is on its way. Paste the token from the link below.</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-token">Reset token</Label>
              <Input id="reset-token" required value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="font-mono text-xs" placeholder="paste the token from the email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-pw">New password</Label>
              <Input id="reset-pw" type="password" required minLength={10} value={resetPw}
                onChange={(e) => setResetPw(e.target.value)} autoComplete="new-password" />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !resetToken || resetPw.length < 10}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set new password
            </Button>
          </form>
        )}

        {showOAuth && (
          <>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" disabled={!oauth.google}
                onClick={() => oauthStart('google')}>
                Google
              </Button>
              <Button type="button" variant="outline" disabled={!oauth.github}
                onClick={() => oauthStart('github')}>
                GitHub
              </Button>
            </div>
            {(!oauth.google || !oauth.github) && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                A greyed-out provider is not configured on this deployment yet —
                the server reports honestly instead of bouncing you to an error page.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
