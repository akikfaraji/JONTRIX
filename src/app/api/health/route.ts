// GET /api/health — deployment liveness probe (uptime monitors, containers).
// Cheap by design: one `select 1` against SQLite + process uptime. Reports
// the authoritative version from src/version.ts. Unauthenticated on purpose
// (no data leaves — only booleans), so external monitors can ping it.

import { db } from '@/lib/db';
import { VERSION } from '@/version';

export const dynamic = 'force-dynamic';

let startedAt = Date.now();

export async function GET() {
  let dbUp = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbUp = false;
  }

  const body = {
    ok: dbUp,
    version: VERSION,
    db: dbUp ? 'up' : 'down',
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    time: new Date().toISOString(),
  };

  return Response.json(body, {
    status: dbUp ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  });
}
