'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Monitor, Server, ShieldCheck, Layers, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { JontRecord } from '@/lib/types';

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Files stay in your browser',
    body: 'Every tool that can run locally does run locally. Your files never touch a server unless a tool is explicitly labeled server-side.',
  },
  {
    icon: Layers,
    title: 'One subscription, everything unlocked',
    body: 'No per-tool pricing, no bundles, no marketplace. One account opens the whole catalog — even tools used once a month.',
  },
  {
    icon: UserCheck,
    title: 'Your data, your call',
    body: 'AI training on saved data is off by default and needs your explicit, versioned consent. Change your mind anytime; withdrawal actually purges.',
  },
];

export function HomeView({
  onBrowse,
  onPricing,
}: {
  onBrowse: () => void;
  onPricing: () => void;
}) {
  const [featured, setFeatured] = useState<JontRecord[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/jonts?sort=score&limit=8')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.ok) return;
        setFeatured(j.data.items as JontRecord[]);
        setTotal(j.data.total as number);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="py-16 sm:py-24">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Every tool. One subscription.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {total ?? 247} single-purpose Jonts — convert, clean, extract, generate, and fix.
          One account opens the entire catalog, and the tools that can run locally never
          send your files anywhere.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={onBrowse}>
            Browse the catalog
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={onPricing}>
            See pricing
          </Button>
        </div>
      </section>

      <section className="grid gap-3 border-y py-8 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key facts">
        {[
          [total !== null ? String(total) : '247', 'tools in the catalog'],
          ['4', 'tiers, one subscription'],
          ['40 / mo', 'free agent calls via MCP'],
          ['0', 'files uploaded by default'],
        ].map(([value, label]) => (
          <div key={label} className="px-1">
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section className="py-12" aria-label="Principles">
        <div className="grid gap-4 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <Card key={p.title} className="border">
              <CardContent className="p-5">
                <p.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="mt-3 font-medium">{p.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="pb-16" aria-label="Featured tools">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Highest-scored tools</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onBrowse}>
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive">Catalog failed to load. Refresh to retry.</p>
        ) : featured.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((j) => (
              <Card key={j.id} className="border transition-colors hover:border-input">
                <CardContent className="flex h-full flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{j.title}</p>
                    <Badge
                      variant="outline"
                      className={j.tier_fit === 'FREE' ? '' : 'border-primary/40 text-primary'}
                    >
                      {j.tier_fit === 'FREE' ? 'Free' : j.tier_fit === 'PRO' ? 'Pro' : 'Max'}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
                  <div className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                    {j.context === 'server' ? (
                      <Server className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {j.context === 'server' ? 'Server-side' : 'In-browser'}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{j.score.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
