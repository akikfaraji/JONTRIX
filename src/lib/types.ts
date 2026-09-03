// Shared client/server types for the platform data records.

export interface JontRecord {
  id: string;
  title: string;
  slug: string;
  pattern: string;
  context: 'client' | 'server' | 'hybrid';
  status?: 'built' | 'planned' | 'disabled';
  tier_fit: 'FREE' | 'PRO' | 'MAX';
  platform_role: string;
  score: number;
  mcp_exposed: boolean;
  description: string | null;
}

export interface PlanRecord {
  tier: 'free' | 'pro' | 'studio' | 'max';
  price_usd_cents: number;
  price_usd_annual_cents: number | null;
  price_stars: number;
  limits: {
    jonts_unlocked: 'FREE' | 'PRO' | 'MAX';
    server_calls_per_day: number;
    max_upload_mb: number;
    batch_rows_max: number;
    concurrent_jobs: number;
    mcp_calls_per_month: number;
    mcp_aats_max: number;
    mcp_pats_max: number;
    ad_boost_daily_calls_max: number;
    ai_fallback_calls_per_month: number;
    history_days: number;
    presets_max: number;
    seats: number;
  };
}

export interface EnvelopeResponse<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; field?: string; upgrade_url?: string; resets_at?: string };
  warnings?: string[];
  meta: { request_id: string; version: string; ts: number };
}
