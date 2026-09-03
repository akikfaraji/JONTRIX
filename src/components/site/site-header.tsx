'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { useToast } from '@/hooks/use-toast';

export type View = 'home' | 'tools' | 'pricing';

const NAV: { id: View; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'tools', label: 'Tools' },
  { id: 'pricing', label: 'Pricing' },
];

export function SiteHeader({
  view,
  onViewChange,
}: {
  view: View;
  onViewChange: (v: View) => void;
}) {
  const { toast } = useToast();

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

        <nav className="ml-4 flex items-center gap-1" aria-label="Primary">
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
          <ThemeToggle />
          <Button
            size="sm"
            onClick={() =>
              toast({
                title: 'Accounts arrive in Phase 5',
                description:
                  'Telegram and email sign-in, billing, and the token factory land with the platform-core phase. The catalog is browsable now.',
              })
            }
          >
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}
