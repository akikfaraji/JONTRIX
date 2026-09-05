// Dashboard — account, quota meters, consent card, billing status (VOL-07 §6).
// Meters report base / boost / effective separately — boost renders as
// "from ads" and is never hidden (C8). The PWA displays boost; it never
// grants it (D-02: grants happen in the Mini App only).

'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { BoostButton } from '@/components/site/boost-button';
import { useSessionValue } from '@/components/site/session-context';

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  studio: 'Studio',
  max: 'Max',
};

function QuotaMeter({
  label,
  quota,
  boostNote,
}: {
  label: string;
  quota: { base: number; boost: number; effective: number; remaining: number; resets_at: string };
  boostNote?: boolean;
}) {
  const usedPct =
    quota.effective > 0
      ? Math.min(100, Math.round(((quota.effective - quota.remaining) / quota.effective) * 100))
      : 100;
  const resets = new Date(quota.resets_at);
  const resetsLocal = resets.toLocaleString('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {quota.remaining.toLocaleString('en-US')} of{' '}
          {quota.effective.toLocaleString('en-US')} left
        </p>
      </div>
      <Progress value={usedPct} aria-label={`${label} usage`} />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
        <span>
          base {quota.base.toLocaleString('en-US')}
          {quota.boost > 0 && ` + boost ${quota.boost.toLocaleString('en-US')}`}
        </span>
        {boostNote && quota.boost > 0 && <Badge variant="secondary">from ads</Badge>}
        <span aria-hidden="true">·</span>
        <span>resets {resetsLocal} UTC</span>
      </div>
    </div>
  );
}

function ConsentCard() {
  const { me, refresh } = useSessionValue();
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    // Onboarding ask: exactly once, when the account has never been asked.
    if (me && me.consent.asked_at === null) setAsk(true);
  }, [me]);

  if (!me) return null;

  async function decide(choice: 'granted' | 'denied', surface: 'onboarding' | 'settings') {
    setBusy(true);
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ consent: choice, surface }),
      });
      setAsk(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium">AI training consent</p>
          <Badge variant={me.consent.state === 'granted' ? 'secondary' : 'outline'} className="ml-auto">
            {me.consent.state === 'granted' ? 'Granted' : 'Denied'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your saved data is only considered for model training if you say so.
          Consent is off by default, versioned, and audited — withdrawing it
          excludes your data from the first export after the change.
        </p>
        {ask ? (
          <div className="space-y-2 rounded-md border bg-muted/40 p-3">
            <p className="text-sm font-medium">Decide now — you can change this anytime</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => void decide('granted', 'onboarding')}>
                Allow
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide('denied', 'onboarding')}>
                Deny
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                disabled={busy}
                onClick={() => setAsk(false)}
              >
                Decide later (stays denied)
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {me.consent.state === 'granted' ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide('denied', 'settings')}>
                Withdraw consent
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide('granted', 'settings')}>
                Grant consent
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardView({
  onOpenTokens,
}: {
  onOpenTokens: () => void;
}) {
  const { me, loading, refresh } = useSessionValue();
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="text-lg font-medium">Sign in to see your dashboard</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          The dashboard shows your quota meters, consent state, tokens, and
          billing window. Anonymous visitors only get the free catalog.
        </p>
      </div>
    );
  }

  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const windowEnds = me.window.expires_at
    ? new Date(me.window.expires_at).toLocaleDateString('en-GB', {
        timeZone: 'UTC',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Badge variant="outline" className="capitalize">
          {TIER_LABEL[me.tier]}
          {me.source && me.tier !== 'free' ? ` · via ${me.source}` : ''}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground"
          disabled={busy}
          onClick={() => void signOut()}
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign out
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {me.email ?? me.handle}
        {me.handle !== me.email && ` (${me.handle})`}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="border">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium">Quota</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <QuotaMeter label="Server-side tool calls / day" quota={me.quota.server_calls} boostNote />
            {me.tier === 'free' && <BoostButton />}
            <Separator />
            <QuotaMeter label="Agent (MCP) calls / month" quota={me.quota.mcp_calls} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Quotas are real and counted — no invented urgency. In-browser
              tools are unlimited and never touch the server.
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium">Billing</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{TIER_LABEL[me.tier]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Window ends</span>
              <span className="font-medium">{windowEnds ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Renewal</span>
              <span className="font-medium">Manual (no auto-charge)</span>
            </div>
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Checkout opens in a later phase (Stars + USDT). Downgrade never
              deletes data — history past your horizon is hidden, not destroyed,
              and comes back when you resubscribe.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ConsentCard />

        <Card className="border">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium">Tokens</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm leading-relaxed text-muted-foreground">
              One Personal Access Token for your own data, plus agent tokens
              for MCP access. Secrets are shown exactly once at creation.
            </p>
            <Button size="sm" variant="outline" onClick={onOpenTokens}>
              Manage tokens
            </Button>
          </CardContent>
        </Card>
      </div>

      <SecurityCard />

    </div>
  );
}

/* ── account security: verification state + password management ─────────── */

function SecurityCard() {
  const { me, refresh } = useSessionValue();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  if (!me) return null;

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const note = await fn();
      if (note) setMsg(note);
    } finally {
      setBusy(false);
    }
  }

  const resend = () =>
    run(async () => {
      const r = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const b = await r.json();
      if (!b.ok) { setError(b.error?.message ?? 'Could not send.'); return null; }
      await refresh();
      return b.data.sent
        ? 'Verification email sent — check your inbox.'
        : 'Your email is already verified.';
    });

  const changePw = () =>
    run(async () => {
      const r = await fetch('/api/auth/password/change', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const b = await r.json();
      if (!b.ok) { setError(b.error?.message ?? 'Could not change the password.'); return null; }
      setCurrentPw('');
      setNewPw('');
      await refresh();
      return 'Password updated — other sessions were signed out.';
    });

  return (
    <Card className="mt-4 border">
      <CardHeader className="pb-3">
        <p className="text-sm font-medium">Account security</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span>Email</span>
          <span className="text-muted-foreground">{me.email ?? 'none on file'}</span>
          {me.email && (
            me.email_verified ? (
              <Badge variant="outline">verified</Badge>
            ) : (
              <>
                <Badge variant="outline" className="border-destructive/40 text-destructive">not verified</Badge>
                <Button size="sm" variant="outline" className="h-7" disabled={busy} onClick={() => void resend()}>
                  Send verification email
                </Button>
              </>
            )
          )}
        </div>

        <Separator />

        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void changePw();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="sec-current" className="text-xs">
              {me.has_password ? 'Current password' : 'No password yet — set one (optional)'}
            </Label>
            <Input
              id="sec-current"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sec-new" className="text-xs">New password</Label>
            <Input
              id="sec-new"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              minLength={10}
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" size="sm" disabled={busy || newPw.length < 10}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {me.has_password ? 'Change password' : 'Set password'}
          </Button>
        </form>

        {msg && <p className="text-sm" role="status">{msg}</p>}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Changing the password signs out every other session. Passwords are
          stored as scrypt hashes — never in a readable form.
        </p>
      </CardContent>
    </Card>
  );
}
