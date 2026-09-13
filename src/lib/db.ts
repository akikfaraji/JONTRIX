import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// SQLite relative-path resolution, unified with the Prisma CLI.
//
// The CLI resolves `file:./db/x.db` relative to the SCHEMA directory
// (prisma/), while the query engine resolves it relative to the process
// CWD — two different files from the same URL. Everything here (db push,
// seed, dev server, standalone start) must land on ONE file, so relative
// file: URLs are rewritten to absolute against the schema dir when it
// exists, falling back to CWD.
//
// The parent directory is also created eagerly: a fresh clone has no db/
// directory (git does not track empty dirs), and the engine cannot create
// missing directories — it fails with "Error code 14: Unable to open the
// database file", which took the platform health check (and therefore the
// whole publish) down.
function resolveUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith('file:')) return url;

  const [rawPath, query] = url.slice('file:'.length).split('?');
  let filePath = rawPath;

  if (!path.isAbsolute(filePath)) {
    const schemaDir = path.join(process.cwd(), 'prisma');
    const base = fs.existsSync(path.join(schemaDir, 'schema.prisma')) ? schemaDir : process.cwd();
    filePath = path.join(base, filePath);
  }

  // Parent directory must exist before the engine opens the file.
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch {
    // Let the engine surface the real error if this is genuinely unwritable.
  }

  const resolved = `file:${filePath}`;
  return query ? `${resolved}?${query}` : `${resolved}?connection_limit=1`;
}

const dbUrl = resolveUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
