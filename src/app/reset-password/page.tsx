// /reset-password — landing page for the emailed reset link. Reads the
// token from the query string, collects the new password, POSTs the reset,
// and points the user back to sign in. Server component shell + client form.

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetForm() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), password }),
      });
      const body = await res.json();
      if (body.ok) setDone(true);
      else setError(body.error?.message ?? 'The reset failed — request a new link.');
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md border">
      <CardContent className="space-y-5 p-6">
        <div>
          <p className="text-sm font-semibold tracking-[0.08em]">JONTRIX</p>
          <h1 className="mt-3 text-xl font-bold tracking-tight">Choose a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The emailed link works once and expires in one hour. Every signed-in
            session is signed out when the password changes.
          </p>
        </div>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm" role="status">
              Your password has been updated. Sign in with the new password —
              all previous sessions were signed out.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Back to JONTRIX</Link>
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) void submit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="rp-token">Reset token</Label>
              <Input
                id="rp-token"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono text-xs"
                placeholder="from the emailed link"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-pw">New password</Label>
              <Input
                id="rp-pw"
                type="password"
                required
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                At least 10 characters, mixing two of: lowercase, uppercase, digits, symbols.
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy || !token || password.length < 10}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set new password
            </Button>
            <p className="text-center text-xs">
              <Link href="/" className="text-muted-foreground underline-offset-2 hover:underline">
                Back to JONTRIX
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </main>
  );
}
