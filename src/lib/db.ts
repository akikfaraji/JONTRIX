import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// SQLite file databases are funneled through a single connection
// (connection_limit=1): SQLite allows exactly one writer, and a multi-
// connection pool turns parallel writes into lock convoys that exhaust the
// 5 s interactive-transaction budget (observed as 500s under burst). One
// connection queues cleanly instead.
function resolveUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith('file:')) return url;
  return url.includes('?') ? url : `${url}?connection_limit=1`;
}

const dbUrl = resolveUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db