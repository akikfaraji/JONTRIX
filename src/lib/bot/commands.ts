// Bot command handlers — VOL-08 §1 (LOCKED command set). Anything unknown
// → one-line help, never a menu maze. Proactive messages are limited to
// receipts + reminders + opted-in digest (§4) — handlers here only ever
// reply; nothing is ever sent outside a reply to an update.

import { db } from '@/lib/db';
import { upsertUserByTelegram } from '@/lib/telegram';
import { resolveEntitlement, quotaSnapshot } from '@/lib/entitlements';
import { PLANS_SEED } from '@/lib/plans';

export interface TgFrom {
  id: number;
  username?: string;
  first_name?: string;
}

export interface TgUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    from?: TgFrom;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: TgFrom;
    data?: string;
  };
}

export interface BotReply {
  text: string;
  inline_keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string; web_app?: { url: string } }>>;
  parse_mode?: 'HTML';
}

const HELP_TEXT = [
  '<b>JONTRIX commands</b>',
  '/catalog — browse tool families',
  '/jont &lt;id&gt; — one tool card',
  '/me — your tier and quota',
  '/quota — reset times',
  '/buy — plans (Stars or web)',
  '/mcp — connect your AI agent',
  '/help — this screen',
].join('\n');

function quotaBlockText(ent: Awaited<ReturnType<typeof resolveEntitlement>>, boostUsed: number): string {
  const lines = [
    `tier: <b>${ent.tier}</b>`,
    `daily server calls: base ${ent.limits.server_calls_per_day}`,
  ];
  if (ent.tier === 'free' && boostUsed > 0) {
    lines.push(`boost today: +${boostUsed} (from rewarded ads)`);
  }
  lines.push(`monthly MCP calls: ${ent.limits.mcp_calls_per_month}`);
  return lines.join('\n');
}

export async function handleUpdate(update: TgUpdate): Promise<BotReply | null> {
  const msg = update.message;
  const cb = update.callback_query;
  const text = msg?.text?.trim() ?? '';
  const from = msg?.from ?? cb?.from;

  // callback queries (inline button taps)
  if (cb?.data) {
    if (cb.data.startsWith('family:')) {
      const family = cb.data.slice('family:'.length);
      const rows = await db.jont.findMany({
        where: { family, status: 'built' },
        orderBy: { score: 'desc' },
        take: 5,
      });
      const label = family.charAt(0).toUpperCase() + family.slice(1);
      return {
        text: `<b>${label}</b> — built tools (top by score)\n${rows
          .map((r) => `• ${r.title} [${r.tierFit}] — /jont_${r.id}`)
          .join('\n')}`,
      };
    }
    if (cb.data.startsWith('buy:')) {
      const tier = cb.data.slice('buy:'.length);
      const plan = PLANS_SEED.find((p) => p.tier === tier);
      if (!plan) return { text: 'Unknown plan.' };
      const usd = (plan.price_usd_cents / 100).toFixed(2);
      return {
        text: [
          `<b>${plan.tier.toUpperCase()}</b> — ${plan.price_stars} Stars ≈ $${(plan.price_stars / 100).toFixed(2)} in-app · ≈ $${usd} on web`,
          'Telegram handles renewal; cancel anytime in Telegram.',
        ].join('\n'),
        inline_keyboard: [[
          { text: `Pay ${plan.price_stars} Stars`, callback_data: `invoice:${tier}` },
        ]],
      };
    }
    if (cb.data.startsWith('invoice:')) {
      // The Stars invoice itself is sent server-side via sendInvoice
      // (VOL-06 §3); here we state the fact honestly either way.
      return { text: 'Invoice flow: the payment sheet opens in your chat. Failure states are honest: cancel, insufficient Stars, or timeout each re-price from the plans table.' };
    }
    return null;
  }

  if (!text || !from) return null;

  // /jont_<id> deep links rendered inside family listings
  if (text.startsWith('/jont_')) {
    const id = text.slice('/jont_'.length).split(' ')[0];
    return jontCard(id);
  }

  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(' ').trim();

  switch (cmd) {
    case '/start': {
      await upsertUserByTelegram(String(from.id), from.first_name ?? from.username);
      return {
        text: [
          'JONTRIX — 247 tools for the jobs software forgot.',
          'Convert, fix, extract, and check data; agents can drive it over MCP.',
          'Free tier runs 155 tools — no card, no trial clock.',
        ].join('\n'),
        inline_keyboard: [[
          { text: 'Open JONTRIX', web_app: { url: process.env.MINIAPP_URL ?? 'https://t.me/JONTRIX_bot/app' } },
        ]],
      };
    }
    case '/help':
      return { text: HELP_TEXT };
    case '/catalog': {
      const families = ['converter', 'validator', 'generator', 'extractor', 'fixer'];
      const counts = await db.jont.groupBy({ by: ['family'], _count: { family: true } });
      const countFor = (f: string) => counts.find((c) => c.family === f)?._count.family ?? 0;
      return {
        text: '<b>Catalog</b> — 247 tools in 5 families. Pick one:',
        inline_keyboard: families.map((f) => [
          { text: `${f} (${countFor(f)})`, callback_data: `family:${f}` },
        ]),
      };
    }
    case '/jont': {
      if (!arg) return { text: 'usage: /jont <id-or-slug>' };
      return jontCard(arg);
    }
    case '/me': {
      const user = await upsertUserByTelegram(String(from.id), from.first_name ?? from.username);
      const ent = await resolveEntitlement(user.id);
      const boosts = await db.boostLedger.findMany({
        where: { userId: user.id, utcDay: new Date().toISOString().slice(0, 10).replace(/-/g, '') },
        select: { amount: true },
      });
      const boostUsed = boosts.reduce((s, b) => s + b.amount, 0);
      const consent = await db.consentEvent.findFirst({
        where: { userId: user.id },
        orderBy: { at: 'desc' },
        select: { toState: true },
      });
      return {
        text: [
          quotaBlockText(ent, boostUsed),
          `AI-training consent: <b>${consent?.toState ?? 'denied (default)'}</b>`,
        ].join('\n'),
      };
    }
    case '/quota': {
      const user = await upsertUserByTelegram(String(from.id), from.first_name ?? from.username);
      const ent = await resolveEntitlement(user.id);
      const srv = await quotaSnapshot(ent, 'srv');
      const mcp = await quotaSnapshot(ent, 'mcp');
      return {
        text: [
          `daily server: ${srv.used}/${srv.effective} — resets ${srv.resets_at}`,
          `monthly MCP: ${mcp.used}/${mcp.effective} — resets ${mcp.resets_at}`,
        ].join('\n'),
      };
    }
    case '/buy': {
      return {
        text: 'Plans — dual price always stated (C8):',
        inline_keyboard: PLANS_SEED.filter((p) => p.tier !== 'free').map((p) => [
          {
            text: `${p.tier} — ${p.price_stars} Stars ≈ $${(p.price_usd_cents / 100).toFixed(2)}/mo`,
            callback_data: `buy:${p.tier}`,
          },
        ]),
      };
    }
    case '/mcp': {
      return {
        text: [
          '<b>Connect your AI agent</b>',
          '1. <code>npm i -g jontrix-gateway</code> (or pip, or binaries)',
          '2. <code>jontrix-gateway login</code> — signs you in and creates or attaches an AAT; your PAT stays for the terminal data plane',
          '3. <code>jontrix-gateway connect claude-desktop</code> (or cursor, cline, windsurf, vscode, gemini-cli)',
        ].join('\n'),
      };
    }
    default:
      return { text: 'Unknown command — /help lists everything.' };
  }
}

async function jontCard(idOrSlug: string): Promise<BotReply> {
  const row = await db.jont.findFirst({
    where: { OR: [{ id: idOrSlug }, { id: { contains: idOrSlug } }, { seoSlug: idOrSlug }] },
  });
  if (!row) return { text: `No tool matches "${idOrSlug}".` };
  const built = row.status === 'built' ? 'built — runs now' : row.status === 'disabled' ? 'disabled' : 'planned — not built yet (honest status)';
  return {
    text: [
      `<b>${row.title}</b>`,
      row.description ?? '',
      `pattern: ${row.family} · context: ${row.context} · tier: ${row.tierFit}`,
      `status: ${built}`,
    ].filter(Boolean).join('\n'),
    inline_keyboard: [[
      { text: 'Open in Mini App', web_app: { url: process.env.MINIAPP_URL ?? 'https://t.me/JONTRIX_bot/app' } },
    ]],
  };
}
