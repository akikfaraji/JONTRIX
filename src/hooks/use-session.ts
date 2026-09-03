// Session hook — the browser-side projection of the VOL-05 session plane.
// Fetches /api/me, exposes the honest quota block, and re-fetches on demand.

'use client';

import { useCallback, useEffect, useState } from 'react';

export interface QuotaView {
  base: number;
  boost: number;
  effective: number;
  remaining: number;
  resets_at: string;
}

export interface MeRecord {
  user_id: string;
  handle: string;
  display_name: string | null;
  email: string | null;
  tier: 'free' | 'pro' | 'studio' | 'max';
  source: string | null;
  window: { starts_at: string | null; expires_at: string | null };
  consent: { state: 'granted' | 'denied'; version: number; asked_at: string | null };
  quota: { server_calls: QuotaView; mcp_calls: QuotaView };
}

interface SessionState {
  me: MeRecord | null;
  loading: boolean;
  /** 401 only counts as "signed out" after the first successful check. */
  ready: boolean;
  refresh: () => Promise<void>;
}

export function useSession(): SessionState {
  const [me, setMe] = useState<MeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/me');
      const body = await res.json();
      setMe(body.ok ? (body.data as MeRecord) : null);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { me, loading, ready, refresh };
}
