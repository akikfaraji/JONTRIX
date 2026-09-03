// Boost affordance — VOL-08 §5 (D-02): the rewarded-ad button lives ONLY in
// the Mini App context (Telegram WebView). PWA/extension builds never load
// ad code (T8.6). The grant flows through POST /api/boost/claim, which
// refuses honestly when reward verification is not configured.

'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TelegramWebApp {
  initData: string;
}
interface TelegramWindow {
  Telegram?: { WebApp?: TelegramWebApp };
}
interface AdsGramController {
  show(): Promise<{ done?: boolean; state?: string }>;
}
interface AdsGramWindow extends TelegramWindow {
  AdsGram?: { init(adsId: string): AdsGramController };
}

const CONSENT_LINE = 'Watch a short ad → +10 server calls for today. Max 2 per day.';

export function BoostButton({ onGranted }: { onGranted?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // Render only inside Telegram's WebView — the Mini App surface (§5).
  const w = window as unknown as AdsGramWindow;
  const isMiniApp = Boolean(w.Telegram?.WebApp?.initData);

  if (!isMiniApp) return null;

  async function watch(): Promise<void> {
    setBusy(true);
    setNote(null);
    try {
      const ads = w.AdsGram;
      if (!ads) {
        setNote('the ad module is not available here — no grant can be claimed');
        return;
      }
      const controller = ads.init(process.env.NEXT_PUBLIC_ADSGRAM_ID ?? '');
      const result = await controller.show(); // resolves on reward, per AdsGram SDK
      const adSessionId = result?.done ? crypto.randomUUID() : null;
      if (!adSessionId) {
        setNote('the ad was not completed — nothing granted');
        return;
      }
      const res = await fetch('/api/boost/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ad_session_id: adSessionId, signature: result.state ?? '' }),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        setNote(`+${j.data.granted} calls today — resets at 00:00 UTC`);
        onGranted?.();
      } else if (j.error?.code === 'boost_cap') {
        setNote("that's today's max — resets 00:00 UTC");
      } else {
        setNote(j.error?.message ?? 'the grant was refused');
      }
    } catch {
      setNote('the reward did not verify — nothing granted');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Button size="sm" variant="outline" onClick={watch} disabled={busy} className="w-full">
        <Zap className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Boost +10 calls today
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">{note ?? CONSENT_LINE}</p>
    </div>
  );
}
