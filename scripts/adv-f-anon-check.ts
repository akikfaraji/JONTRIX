// DB-level anonymization check for the account-deletion sweep.
// Usage: npx tsx scripts/adv-f-anon-check.ts <email>
// Prints ANONYMIZED when no user row carries the email anymore AND a
// deleted_<hex> row exists; EMAIL_STILL_THERE / NO_ROW otherwise.

import { db } from '../src/lib/db';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('NO_ARG');
    return;
  }
  const byEmail = await db.user.findFirst({ where: { email } });
  if (byEmail) {
    console.log('EMAIL_STILL_THERE');
    return;
  }
  const deletedRow = await db.user.findFirst({
    where: { handle: { startsWith: 'deleted_' } },
    orderBy: { createdAt: 'desc' },
  });
  console.log(deletedRow ? 'ANONYMIZED' : 'NO_ROW');
}

main()
  .catch(() => console.log('DB_ERROR'))
  .finally(() => process.exit(0));
