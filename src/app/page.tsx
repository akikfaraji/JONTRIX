'use client';

import { useEffect, useState } from 'react';
import { SiteHeader, type View } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { HomeView } from '@/components/site/home-view';
import { ToolsView } from '@/components/site/tools-view';
import { PricingView } from '@/components/site/pricing-view';
import { DashboardView } from '@/components/site/dashboard-view';
import { TokenFactoryView } from '@/components/site/token-factory-view';
import { AboutView } from '@/components/site/about-view';
import { ToolDetailView } from '@/components/site/tool-detail-view';
import { SessionProvider, useSessionValue } from '@/components/site/session-context';
import { SignInDialog } from '@/components/site/sign-in-dialog';
import type { JontRecord } from '@/lib/types';

function PageBody() {
  const [view, setView] = useState<View>('home');
  const [tool, setTool] = useState<JontRecord | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const { refresh } = useSessionValue();

  // Related tools: same pattern family, highest score first (VOL-07 §3.6).
  // Cleared synchronously in openTool; the effect only sets them async.
  const [related, setRelated] = useState<JontRecord[]>([]);
  useEffect(() => {
    if (!tool) return;
    let cancelled = false;
    fetch(`/api/jonts?pattern=${encodeURIComponent(tool.pattern)}&sort=score&limit=6`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.ok) return;
        const items = (j.data.items as JontRecord[]).filter((i) => i.id !== tool.id).slice(0, 4);
        setRelated(items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tool]);

  function openTool(j: JontRecord) {
    setTool(j);
    setRelated([]);
    window.scrollTo({ top: 0 });
  }

  function changeView(v: View) {
    if (v !== 'tools') setTool(null);
    setView(v);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <SiteHeader
        view={view}
        onViewChange={changeView}
        onOpenSignIn={() => setSignInOpen(true)}
      />
      <main className="flex-1">
        {view === 'home' && (
          <HomeView onBrowse={() => changeView('tools')} onPricing={() => changeView('pricing')} />
        )}
        {view === 'tools' &&
          (tool ? (
            <ToolDetailView
              tool={tool}
              related={related}
              onBack={() => setTool(null)}
              onOpenTool={openTool}
            />
          ) : (
            <ToolsView onOpenTool={openTool} />
          ))}
        {view === 'pricing' && <PricingView />}
        {view === 'dashboard' && <DashboardView onOpenTokens={() => setView('tokens')} />}
        {view === 'tokens' && <TokenFactoryView onBack={() => setView('dashboard')} />}
        {view === 'about' && <AboutView />}
      </main>
      <SiteFooter />
      <SignInDialog
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onSignedIn={() => {
          void refresh();
          changeView('dashboard');
        }}
      />
    </>
  );
}

export default function Page() {
  return (
    <SessionProvider>
      <PageBody />
    </SessionProvider>
  );
}
