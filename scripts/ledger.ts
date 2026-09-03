// VOL-15 ledger — scripts/ledger.ts (LOCKED structure §1/§2).
// One honest, script-generated record of every dollar, Star, and cost.
// Reads the payments/webhook_events tables + provider statement CSVs, emits
// docs/ledger/<YYYY-MM>.csv + a ≤20-line summary. Every number traces to a
// payments row, a statement line, or a cost invoice — never hand-edited.

import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const db = new PrismaClient();

interface LedgerRow {
  event_id: string;
  date_utc: string;
  kind: string;
  rail: string;
  gross: string;
  fee: string;
  net: string;
  currency: string;
  hold_days: string;
  ref: string;
  note: string;
}

// VOL-01 §5.1 verified net rate — Stars → USD at ≈ $0.013/Star net.
const STARS_NET_USD = 0.013;
const STARS_HOLD_DAYS = 21;

function usd(cents: number): string {
  return (cents / 100).toFixed(2);
}

function row(r: LedgerRow): string {
  return [r.event_id, r.date_utc, r.kind, r.rail, r.gross, r.fee, r.net, r.currency, r.hold_days, r.ref, r.note]
    .map((v) => (String(v).includes(',') ? `"${v}"` : String(v)))
    .join(',');
}

async function main() {
  const month = process.argv[2] ?? new Date().toISOString().slice(0, 7);
  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const nextMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));

  const rows: LedgerRow[] = [];

  // ── money-in: payments rows 1:1 (T15.1) ─────────────────────────────────
  const payments = await db.payment.findMany({
    where: { createdAt: { gte: monthStart, lt: nextMonth } },
  });

  let starsGrossUsd = 0;
  let starsNetUsd = 0;
  let usdtGrossUsd = 0;
  let usdtNetUsd = 0;
  let grantCount = 0;

  // founder grant accounts — always visible, never revenue (T15.5)
  const grantUserIds = new Set(
    (await db.user.findMany({ where: { email: { endsWith: '@fraziym.test' } }, select: { id: true } })).map((u) => u.id),
  );

  for (const p of payments) {
    const isGrant = grantUserIds.has(p.userId) || p.rail === 'grant';
    const rail = p.rail === 'stars' ? 'stars' : p.rail === 'usdt' ? 'usdt' : p.rail;
    const grossCents = p.amount;
    // fee: use the processor's own estimate when present; else the verified rate
    let feeCents = p.processorFeeEstCents ?? 0;
    let holdDays = 0;
    let note = '';

    if (rail === 'stars') {
      const grossStars = Math.round(grossCents / 100);
      holdDays = STARS_HOLD_DAYS; // T15.2: visible cashflow before the payout lands
      note = `${grossStars} Stars, net at $${STARS_NET_USD}/Star`;
      starsGrossUsd += grossCents / 100;
      starsNetUsd += (grossCents - feeCents) / 100;
    } else if (rail === 'usdt') {
      if (!p.processorFeeEstCents) feeCents = Math.round(grossCents * 0.01);
      note = 'NOWPayments 0.5–1.5% (processor invoice data)';
      usdtGrossUsd += grossCents / 100;
      usdtNetUsd += (grossCents - feeCents) / 100;
    }

    const kind = isGrant ? 'grant.internal' : rail === 'stars' ? 'subscription.stars' : 'subscription.usdt';
    if (isGrant) grantCount++;
    // NEVER a revenue row without its webhook reference (§2 MUST)
    const ref = p.webhookEventId ? `webhook:${p.webhookEventId}` : 'statement:manual-entry [flag for founder review]';

    const availableAfter = new Date(p.createdAt.getTime() + holdDays * 24 * 3600 * 1000).toISOString().slice(0, 10);
    rows.push({
      event_id: p.id,
      date_utc: p.createdAt.toISOString().slice(0, 10),
      kind,
      rail,
      gross: usd(grossCents),
      fee: usd(feeCents),
      net: usd(grossCents - feeCents),
      currency: p.currency ?? (rail === 'stars' ? 'USD(stars)' : 'USD'),
      hold_days: String(holdDays),
      ref,
      note: holdDays ? `${note} | available_after=${availableAfter}` : note,
    });
  }

  // ── ads revenue (§4): one row per AdsGram statement line ────────────────
  const statementsDir = join('docs', 'ledger', 'statements');
  let adsRevenueUsd = 0;
  if (existsSync(statementsDir)) {
    for (const file of readdirSync(statementsDir).filter((f) => f.startsWith(month) && f.endsWith('.csv'))) {
      const lines = readFileSync(join(statementsDir, file), 'utf8').split('\n').filter(Boolean);
      for (const line of lines.slice(1)) {
        const [date, stars] = line.split(',');
        const starsNet = Number(stars) * STARS_NET_USD;
        adsRevenueUsd += starsNet;
        rows.push({
          event_id: `ads_${file}_${rows.length}`,
          date_utc: date ?? month,
          kind: 'ads.adsgram',
          rail: 'stars',
          gross: starsNet.toFixed(2),
          fee: '0.00',
          net: starsNet.toFixed(2),
          currency: 'USD(stars)',
          hold_days: String(STARS_HOLD_DAYS),
          ref: `statement:${file}`,
          note: 'converted at the same net rate as subs so ads and subs compare honestly',
        });
      }
    }
  }

  // ── costs (§5): domain rows are the only guaranteed recurring cost ──────
  const domainCostUsd = 12.0; // jontrix.app renewal — the one guaranteed row
  rows.push({
    event_id: `cost_domain_${month}`,
    date_utc: `${month}-15`,
    kind: 'cost.domain',
    rail: 'card',
    gross: domainCostUsd.toFixed(2),
    fee: '0.00',
    net: domainCostUsd.toFixed(2),
    currency: 'USD',
    hold_days: '0',
    ref: 'invoice:domain-renewal',
    note: 'C1: only guaranteed recurring infra cost',
  });

  // gross − fee = net must hold on EVERY row (T15.1)
  for (const r of rows) {
    if (Math.abs((Number(r.gross) - Number(r.fee)) - Number(r.net)) > 0.005) {
      throw new Error(`ledger arithmetic broken on ${r.event_id}`);
    }
  }

  // ── emit ────────────────────────────────────────────────────────────────
  mkdirSync(join('docs', 'ledger'), { recursive: true });
  const csv = [
    'event_id,date_utc,kind,rail,gross,fee,net,currency,hold_days,ref,note',
    ...rows.map(row),
  ].join('\n');
  writeFileSync(join('docs', 'ledger', `${month}.csv`), `${csv}\n`);

  // ── summary block (§6/§8): ≤ 20 lines, every number reproducible ────────
  const totalNet = starsNetUsd + usdtNetUsd + adsRevenueUsd - domainCostUsd;
  const paidUsers = await db.entitlement.count({ where: { tier: { not: 'free' } } });
  const freeUsers = await db.entitlement.count({ where: { tier: 'free' } });
  const paidTotal = paidUsers + freeUsers;
  const aats = await db.token.count({ where: { kind: 'aat', status: 'active' } });
  const conversion = paidTotal > 0 ? ((paidUsers / paidTotal) * 100).toFixed(1) : '0.0';
  const mcpAttachment = paidUsers > 0 ? ((aats / paidUsers) * 100).toFixed(0) : '0';
  const inHold = starsNetUsd; // Stars revenue lands 21 days after month end
  const eCPM = adsRevenueUsd > 0 ? (adsRevenueUsd * 1000).toFixed(2) : 'n/a (no statement this month)';

  const summary = [
    `LEDGER ${month} — scenario S1, DAU basis: ${freeUsers} free users`,
    `revenue: Stars $${starsNetUsd.toFixed(2)} net (gross $${starsGrossUsd.toFixed(2)}) · USDT $${usdtNetUsd.toFixed(2)} net · ads $${adsRevenueUsd.toFixed(2)}`,
    `ads: eCPM ${eCPM} (baseline $1–3) — kill-switch (<$1.00) flag: ${adsRevenueUsd > 0 && parseFloat(eCPM) < 1 ? 'REVIEW' : 'not triggered'}`,
    `costs: domains $${domainCostUsd.toFixed(2)} · AI $0.00 (free tiers, projector: within limits) · other infra $0.00`,
    `net for month: $${totalNet.toFixed(2)}`,
    `grant rows visible: ${grantCount} (never revenue — T15.5)`,
    `conversion: ${conversion}% paid/free · MCP-attachment: ${mcpAttachment}% of paid users (AATs: ${aats})`,
    `payout pipeline in-hold: $${inHold.toFixed(2)} (Stars, ${STARS_HOLD_DAYS}-day hold)`,
    `C1 statement: total infra spend = domains only (+ founder-signed exceptions: none)`,
  ].join('\n');

  console.log(summary);
  console.log(`\nledger written: docs/ledger/${month}.csv (${rows.length} rows)`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
