// Sign-in dialog — email OTP flow (VOL-06 §2). Passwordless by contract;
// the build environment delivers codes to the server log (honest copy
// on screen), SMTP arrives with the billing phase.

'use client';

import { useEffect, useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
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

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignedIn: () => void;
}

export function SignInDialog({ open, onOpenChange, onSignedIn }: SignInDialogProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep('email');
      setCode('');
      setError(null);
    }
  }, [open]);

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (body.ok) setStep('code');
      else setError(body.error?.message ?? 'Could not send the code.');
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const body = await res.json();
      if (body.ok) {
        onOpenChange(false);
        onSignedIn();
      } else {
        setError(body.error?.message ?? 'Verification failed.');
      }
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in to JONTRIX</DialogTitle>
          <DialogDescription>
            One account for every tool. No password — a six-digit code verifies
            your email.
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) void requestCode();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || email.length === 0}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Email me a code
            </Button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Signing in doubles what an anonymous visitor gets, and it is the
              only way to keep presets and results.
            </p>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) void verifyCode();
            }}
          >
            <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                In this build environment the code is printed to the server log
                instead of an inbox — delivery by email lands with the billing
                phase. The code expires in 10 minutes.
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-code">Six-digit code</Label>
              <Input
                id="signin-code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="font-mono tracking-[0.4em]"
                autoComplete="one-time-code"
              />
              <p className="text-xs text-muted-foreground">Sent to {email}</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('email');
                  setError(null);
                }}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={busy || code.length !== 6}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
