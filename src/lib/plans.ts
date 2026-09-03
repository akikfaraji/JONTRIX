// JONTRIX tier ladder — VOL-01 §4.1 `Limits` contract, verbatim values.
// These are the seed source for the `plans` table; pricing surfaces render
// from the DB rows, never from hard-coded strings (VOL-01 §5.6).

export type Tier = 'free' | 'pro' | 'studio' | 'max';

export interface Limits {
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
}

export interface PlanSeed {
  tier: Tier;
  price_usd_cents: number;
  price_usd_annual_cents: number;
  price_stars: number;
  limits: Limits;
}

export const PLANS_SEED: PlanSeed[] = [
  {
    tier: 'free',
    price_usd_cents: 0,
    price_usd_annual_cents: 0,
    price_stars: 0,
    limits: {
      jonts_unlocked: 'FREE',
      server_calls_per_day: 25,
      max_upload_mb: 2,
      batch_rows_max: 100,
      concurrent_jobs: 1,
      mcp_calls_per_month: 40, // D-01: taste, not a workflow
      mcp_aats_max: 1,
      mcp_pats_max: 1, // D-03: one PAT per user, every tier
      ad_boost_daily_calls_max: 20, // D-02: rewarded-ad bonus, Free only
      ai_fallback_calls_per_month: 0,
      history_days: 0,
      presets_max: 3,
      seats: 1,
    },
  },
  {
    tier: 'pro',
    price_usd_cents: 499,
    price_usd_annual_cents: 4990, // exactly x10 (USDT rail only)
    price_stars: 400,
    limits: {
      jonts_unlocked: 'PRO',
      server_calls_per_day: 500,
      max_upload_mb: 25,
      batch_rows_max: 5000,
      concurrent_jobs: 2,
      mcp_calls_per_month: 2000,
      mcp_aats_max: 3,
      mcp_pats_max: 1,
      ad_boost_daily_calls_max: 0,
      ai_fallback_calls_per_month: 100,
      history_days: 90,
      presets_max: 50,
      seats: 1,
    },
  },
  {
    tier: 'studio',
    price_usd_cents: 999,
    price_usd_annual_cents: 9990,
    price_stars: 750,
    limits: {
      jonts_unlocked: 'PRO',
      server_calls_per_day: 2000,
      max_upload_mb: 100,
      batch_rows_max: 50000,
      concurrent_jobs: 5,
      mcp_calls_per_month: 10000,
      mcp_aats_max: 10,
      mcp_pats_max: 1,
      ad_boost_daily_calls_max: 0,
      ai_fallback_calls_per_month: 1000,
      history_days: 365,
      presets_max: 9999,
      seats: 1,
    },
  },
  {
    tier: 'max',
    price_usd_cents: 1999,
    price_usd_annual_cents: 19990,
    price_stars: 1500,
    limits: {
      jonts_unlocked: 'MAX',
      server_calls_per_day: 10000,
      max_upload_mb: 100,
      batch_rows_max: 250000,
      concurrent_jobs: 10,
      mcp_calls_per_month: 100000,
      mcp_aats_max: 9999, // "unlimited"
      mcp_pats_max: 1,
      ad_boost_daily_calls_max: 0,
      ai_fallback_calls_per_month: 5000,
      history_days: 36500,
      presets_max: 9999,
      seats: 3,
    },
  },
];
