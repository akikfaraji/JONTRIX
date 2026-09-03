// Shared session context — one /api/me fetch for the whole page tree.
// Consumers: header chip, dashboard, consent card. refresh() is called
// after sign-in, sign-out, and consent changes.

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { MeRecord } from '@/hooks/use-session';

interface SessionState {
  me: MeRecord | null;
  loading: boolean;
  ready: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState>({
  me: null,
  loading: true,
  ready: false,
  refresh: async () => undefined,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
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

  const value = useMemo(() => ({ me, loading, ready, refresh }), [me, loading, ready, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionValue(): SessionState {
  return useContext(SessionContext);
}
