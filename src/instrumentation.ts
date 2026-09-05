// Next.js instrumentation hook — runs once per server process start.
// The database bootstrap guard lives here: a fresh or wiped volume self-heals
// (idempotent seed) before the first request is served.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    const { bootstrapDatabase } = await import('./lib/bootstrap');
    const result = await bootstrapDatabase();
    if (result.seeded) {
      console.log('[instrumentation] database bootstrap applied');
    }
  } catch (err) {
    // Never crash the server on bootstrap failure — health route reports it.
    console.error('[instrumentation] bootstrap failed:', err instanceof Error ? err.message : err);
  }
}
