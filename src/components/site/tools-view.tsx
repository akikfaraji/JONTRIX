'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Monitor, Search, Server, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { JontRecord } from '@/lib/types';

const PAGE = 48;

const TIER_LABEL: Record<string, string> = { FREE: 'Free', PRO: 'Pro', MAX: 'Max' };
const CONTEXT_LABEL: Record<string, string> = {
  client: 'In-browser',
  server: 'Server-side',
  hybrid: 'Hybrid',
};

export function ToolsView({ onOpenTool }: { onOpenTool: (j: JontRecord) => void }) {
  const [items, setItems] = useState<JontRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');
  const [pattern, setPattern] = useState('all');
  const [context, setContext] = useState('all');
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/jonts?limit=247')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setItems(j.data.items as JontRecord[]);
        else setError(true);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const patterns = useMemo(
    () => Array.from(new Set(items.map((i) => i.pattern))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q) && !i.slug.toLowerCase().includes(q))
        return false;
      if (tier !== 'all' && i.tier_fit !== tier) return false;
      if (pattern !== 'all' && i.pattern !== pattern) return false;
      if (context !== 'all' && i.context !== context) return false;
      return true;
    });
  }, [items, query, tier, pattern, context]);

  const shown = filtered.slice(0, visible);

  const reset = () => setVisible(PAGE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tool catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every tool in the subscription. Free-tier tools run without an account;
            Pro and Max tools show their value before the paywall.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-y py-3">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                reset();
              }}
              placeholder="Search tools"
              className="pl-9"
              aria-label="Search tools"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <ToggleGroup
              type="single"
              value={tier}
              size="sm"
              onValueChange={(v) => {
                setTier(v || 'all');
                reset();
              }}
              aria-label="Filter by tier"
            >
              <ToggleGroupItem value="all" variant="outline">All tiers</ToggleGroupItem>
              <ToggleGroupItem value="FREE" variant="outline">Free</ToggleGroupItem>
              <ToggleGroupItem value="PRO" variant="outline">Pro</ToggleGroupItem>
              <ToggleGroupItem value="MAX" variant="outline">Max</ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup
              type="single"
              value={context}
              size="sm"
              onValueChange={(v) => {
                setContext(v || 'all');
                reset();
              }}
              aria-label="Filter by execution context"
            >
              <ToggleGroupItem value="all" variant="outline">Anywhere</ToggleGroupItem>
              <ToggleGroupItem value="client" variant="outline">In-browser</ToggleGroupItem>
              <ToggleGroupItem value="server" variant="outline">Server-side</ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup
              type="single"
              value={pattern}
              size="sm"
              onValueChange={(v) => {
                setPattern(v || 'all');
                reset();
              }}
              aria-label="Filter by pattern"
            >
              <ToggleGroupItem value="all" variant="outline">All patterns</ToggleGroupItem>
              {patterns.map((p) => (
                <ToggleGroupItem key={p} value={p} variant="outline" className="capitalize">
                  {p}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <p className="ml-auto text-sm text-muted-foreground" aria-live="polite">
              Showing {shown.length} of {filtered.length}
              {filtered.length !== items.length && ` (of ${items.length} total)`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Catalog failed to load. Refresh to retry.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((j) => (
                <Card
                  key={j.id}
                  className="cursor-pointer border transition-colors hover:border-input"
                  onClick={() => onOpenTool(j)}
                  role="button"
                  aria-label={`Open ${j.title}`}
                >
                  <CardContent className="flex h-full flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug">{j.title}</p>
                      <Badge
                        variant="outline"
                        className={
                          j.tier_fit === 'FREE' ? '' : 'border-primary/40 text-primary'
                        }
                      >
                        {TIER_LABEL[j.tier_fit]}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {j.description}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        {j.context === 'server' ? (
                          <Server className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : j.context === 'hybrid' ? (
                          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {CONTEXT_LABEL[j.context]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{j.pattern}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{j.score.toFixed(1)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {visible < filtered.length && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setVisible((v) => v + PAGE)}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Load more ({filtered.length - visible} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
