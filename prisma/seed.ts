// Phase-1 seed (VOL-04 §7): 4 plan rows verbatim from src/lib/plans.ts,
// 247 jonts rows from spec/catalog/jonts.seed.json, meta.version row.
// Deterministic: same inputs → identical rows; re-runs upsert, never duplicate.
// Run: npm run db:seed

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLANS_SEED } from '../src/lib/plans';
import { VERSION } from '../src/version';

const db = new PrismaClient();

interface SeedRow {
  jont_id: string;
  src_id: string;
  slug: string;
  name: string;
  pattern: string;
  context: string;
  tier_fit: string;
  platform_role: string;
  score: number;
  mcp_exposed: boolean;
  context_note: string | null;
  seo: { slug: string; canonical: string; description: string };
  faq: [string, string][];
}

async function main() {
  // Plans — upsert so re-seeds never duplicate.
  for (const p of PLANS_SEED) {
    await db.plan.upsert({
      where: { tier: p.tier },
      create: {
        tier: p.tier,
        priceUsdCents: p.price_usd_cents,
        priceUsdAnnualCents: p.price_usd_annual_cents,
        priceStars: p.price_stars,
        limitsJson: JSON.stringify(p.limits),
      },
      update: {
        priceUsdCents: p.price_usd_cents,
        priceUsdAnnualCents: p.price_usd_annual_cents,
        priceStars: p.price_stars,
        limitsJson: JSON.stringify(p.limits),
      },
    });
  }
  console.log(`plans seeded: ${PLANS_SEED.length}`);

  // Jonts — from the frozen catalog (research/opportunities.json-derived).
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), 'spec', 'catalog', 'jonts.seed.json'), 'utf8'),
  ) as SeedRow[];

  let count = 0;
  for (const r of raw) {
    const id = `jont_${r.jont_id.toLowerCase()}_${r.slug}`;
    await db.jont.upsert({
      where: { id },
      create: {
        id,
        family: r.pattern,
        title: r.name,
        score: r.score,
        tierFit: r.tier_fit,
        platformRole: r.platform_role,
        context: r.context,
        description: r.seo?.description ?? null,
        mcpExposed: r.mcp_exposed,
        seoSlug: r.seo?.slug ?? r.slug,
        faqJson: JSON.stringify(r.faq ?? []),
        version: VERSION,
      },
      update: {
        family: r.pattern,
        title: r.name,
        score: r.score,
        tierFit: r.tier_fit,
        platformRole: r.platform_role,
        context: r.context,
        description: r.seo?.description ?? null,
        mcpExposed: r.mcp_exposed,
        seoSlug: r.seo?.slug ?? r.slug,
        faqJson: JSON.stringify(r.faq ?? []),
        version: VERSION,
      },
    });
    count++;
  }
  console.log(`jonts seeded: ${count}`);
  if (count !== 247) throw new Error(`expected 247 jonts, seeded ${count}`);

  // VOL-04 §7: meta.version row — SQL reads the version from the single source.
  await db.meta.upsert({
    where: { key: 'version' },
    create: { key: 'version', value: VERSION },
    update: { value: VERSION },
  });
  console.log(`meta.version = ${VERSION}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
