// GET /api/health — VOL-05 §7 contract.
// Reports the VERSION imported from the single source (src/version.ts).
// Any dep failure still returns 200 with "degraded" — the watchdog reads the body.

import { db } from '@/lib/db';
import { VERSION } from '@/version';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbStatus = 'ok';
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'degraded';
  }

  const overall = dbStatus === 'ok' ? 'ok' : 'degraded';
  return Response.json({
    status: overall,
    version: VERSION,
    deps: { db: dbStatus },
  });
}
