'use client';

import { useState } from 'react';
import { SiteHeader, type View } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { HomeView } from '@/components/site/home-view';
import { ToolsView } from '@/components/site/tools-view';
import { PricingView } from '@/components/site/pricing-view';

export default function Page() {
  const [view, setView] = useState<View>('home');

  return (
    <>
      <SiteHeader view={view} onViewChange={setView} />
      <main className="flex-1">
        {view === 'home' && (
          <HomeView onBrowse={() => setView('tools')} onPricing={() => setView('pricing')} />
        )}
        {view === 'tools' && <ToolsView />}
        {view === 'pricing' && <PricingView />}
      </main>
      <SiteFooter />
    </>
  );
}
