'use client';

import { useEffect, useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { PlanRecord } from '@/lib/types';

const UNLOCKED: Record<string, string> = { FREE: '155', PRO: '234', MAX: '247' };

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const count = (n: number) => (n >= 9999 ? 'Unlimited' : n.toLocaleString('en-US'));

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {value === null ? (
        <Minus className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
      ) : (
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {value}
        </span>
      )}
    </div>
  );
}

export function PricingView() {
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/plans')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setPlans(j.data.plans as PlanRecord[]);
        else setError(true);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          One subscription, every tool. These values render from the seeded plan rows —
          the same numbers the checkout will charge, never marketing arithmetic.
          Annual pricing is exactly ten months (two free) on the USDT rail.
        </p>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-destructive">Plans failed to load. Refresh to retry.</p>
      ) : loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <Card key={p.tier} className="flex flex-col border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">{p.tier}</p>
                  {p.tier === 'free' && <Badge variant="secondary">Default</Badge>}
                  {p.tier === 'max' && <Badge variant="outline">Everything</Badge>}
                </div>
                <p className="mt-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    {usd(p.price_usd_cents)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {p.tier === 'free' ? ' forever' : ' / month'}
                  </span>
                </p>
                {p.tier !== 'free' && (
                  <p className="text-xs text-muted-foreground">
                    or {usd(p.price_usd_annual_cents ?? 0)}/year via USDT ·{' '}
                    {p.price_stars.toLocaleString('en-US')} Stars/month in Telegram
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <Separator className="mb-2" />
                <Row label="Tools unlocked" value={`${UNLOCKED[p.limits.jonts_unlocked]} of 247`} />
                <Row label="In-browser tool runs" value="Unlimited" />
                <Row label="Server calls / day" value={count(p.limits.server_calls_per_day)} />
                <Row label="Agent (MCP) calls / month" value={count(p.limits.mcp_calls_per_month)} />
                <Row label="Agent tokens" value={count(p.limits.mcp_aats_max)} />
                <Row label="Personal token (PAT)" value={String(p.limits.mcp_pats_max)} />
                <Row label="Result history" value={p.limits.history_days === 0 ? null : `${count(p.limits.history_days)} days`} />
                <Row label="Saved presets" value={count(p.limits.presets_max)} />
                <Row label="Batch rows / job" value={count(p.limits.batch_rows_max)} />
                <Row label="Seats" value={String(p.limits.seats)} />
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-1.5">
                {p.tier === 'free' ? (
                  <Button variant="secondary" disabled>
                    Included by default
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" disabled>
                      Upgrade to {p.tier}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Checkout comes online in Phase 5 (Stars + USDT rails)
                    </p>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Quotas reset at 00:00 UTC, daily and monthly. Crypto payments are final — no
        refunds; Stars sales follow Telegram’s own mechanics. The free tier stays free:
        in-browser tools are unlimited, and no ad ever gates your own data.
      </p>
    </div>
  );
}
