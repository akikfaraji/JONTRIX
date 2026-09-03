'use client';

import { Zap, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSessionValue } from '@/components/site/session-context';
import { ThemeToggle } from '@/components/site/theme-toggle';

export type View = 'home' | 'tools' | 'pricing' | 'dashboard' | 'tokens' | 'about' | 'connect';

const NAV: { id: View; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'tools', label: 'Tools' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'connect', label: 'Connect agent' },
  { id: 'about', label: 'About' },
];

export function SiteHeader({
  view,
  onViewChange,
  onOpenSignIn,
}: {
  view: View;
  onViewChange: (v: View) => void;
  onOpenSignIn: () => void;
}) {
  const { me, ready } = useSessionValue();

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <button
          className="flex items-center gap-2 rounded-md px-1 py-1"
          onClick={() => onViewChange('home')}
          aria-label="JONTRIX home"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
            J
          </span>
          <span className="text-base font-semibold tracking-tight">JONTRIX</span>
        </button>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Button
              key={n.id}
              variant={view === n.id ? 'secondary' : 'ghost'}
              size="sm"
              className={view === n.id ? 'font-medium' : 'text-muted-foreground'}
              onClick={() => onViewChange(n.id)}
              aria-current={view === n.id ? 'page' : undefined}
            >
              {n.label}
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Entitlement snapshot chip — tier + honest quota (VOL-07 §2 MUST). */}
          {ready && me && (
            <button
              className="hidden items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted/60 sm:flex"
              onClick={() => onViewChange('dashboard')}
              aria-label="Open dashboard: quota snapshot"
              title="Server calls left today (boost from ads is included honestly)"
            >
              <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="font-medium capitalize">{me.tier}</span>
              <span aria-hidden="true" className="text-muted-foreground">·</span>
              <span className="font-mono text-muted-foreground">
                {me.quota.server_calls.remaining}/{me.quota.server_calls.effective}
              </span>
              {me.quota.server_calls.boost > 0 && (
                <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                  +{me.quota.server_calls.boost} ads
                </Badge>
              )}
            </button>
          )}
          <ThemeToggle />
          {ready && me ? (
            <Button size="sm" variant="outline" onClick={() => onViewChange('dashboard')}>
              Account
            </Button>
          ) : (
            <Button size="sm" onClick={onOpenSignIn}>
              <LogIn className="mr-1.5 h-4 w-4" />
              Sign in
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav — secondary row to keep the header flat and honest. */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 md:hidden" aria-label="Primary mobile">
        {NAV.map((n) => (
          <Button
            key={n.id}
            variant={view === n.id ? 'secondary' : 'ghost'}
            size="sm"
            className={`shrink-0 ${view === n.id ? 'font-medium' : 'text-muted-foreground'}`}
            onClick={() => onViewChange(n.id)}
            aria-current={view === n.id ? 'page' : undefined}
          >
            {n.label}
          </Button>
        ))}
      </nav>
    </header>
  );
}
