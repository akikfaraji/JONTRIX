// About — product, publisher, VERSION rendered verbatim (VOL-07 §2).
// The version string is imported from the single source (src/version.ts),
// never duplicated (VOL-00 §0.7).

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VERSION } from '@/version';

export function AboutView() {
  const [healthVersion, setHealthVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && typeof j.version === 'string') setHealthVersion(j.version);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">About JONTRIX</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        JONTRIX is a subscription mega-toolbox: one account, every tool in the
        catalog. Each Jont does one transformation well and finishes in
        seconds — convert, validate, generate, extract, fix. Tools that can
        run in your browser do run in your browser; files never leave your
        device unless a tool is explicitly labeled server-side.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card className="border">
          <CardContent className="space-y-1.5 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Publisher</p>
            <p className="font-medium">Fraziym Soft</p>
            <p className="text-sm text-muted-foreground">Independent software, Dhaka, Bangladesh</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="space-y-1.5 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Version</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {VERSION}
              </Badge>
              <Badge variant="secondary">beta</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              FRAZIYM versioning: platform generation . feature . fix — stage — revision
            </p>
            {healthVersion !== null && (
              <p className="text-xs text-muted-foreground">
                API health reports: <span className="font-mono">{healthVersion}</span>
                {healthVersion === VERSION ? ' — in agreement' : ' — MISMATCH (bug)'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          Pricing is anchored to what the replaced tools actually cost: one
          subscription is meant to undercut the stack of single-tool
          subscriptions it replaces. The free tier is genuinely useful — no
          trial tricks, no fake counters, no ads outside the Telegram Mini App.
        </p>
        <p>
          AI training on saved data never happens without your explicit,
          versioned consent, and withdrawing it takes effect from the first
          export after the change. Quotas are real and shown before you hit
          them; upgrades are offered at the quota wall and nowhere else.
        </p>
      </div>
    </div>
  );
}
